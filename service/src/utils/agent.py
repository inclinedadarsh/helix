import json
import os
import logging
import asyncio
from pathlib import Path
from openai import OpenAI
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import mcp.types as mcp_types
from dotenv import load_dotenv
from cerebras.cloud.sdk import Cerebras

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

MODEL = os.getenv("MODEL")

LINKS_AGENT_PROMPT = os.environ.get("LINKS_AGENT_PROMPT", "")
DOCS_AGENT_PROMPT = os.environ.get("DOCS_AGENT_PROMPT", "")
MEDIA_AGENT_PROMPT = os.environ.get("MEDIA_AGENT_PROMPT", "")
SYNTHESIS_AGENT_PROMPT = os.environ.get("SYNTHESIS_AGENT_PROMPT", "")


def mcp_tool_to_openrouter(t: mcp_types.Tool) -> dict:
    """Convert MCP tool definition to OpenRouter/OpenAI function format."""
    return {
        "type": "function",
        "function": {
            "name": t.name,
            "description": t.description or "",
            "parameters": t.inputSchema or {"type": "object"},
        },
    }


async def agent(user_id: str, user_query: str, subdirectory: str, system_prompt: str) -> dict:
    """
    Run a single agent for a specific subdirectory.
    
    Args:
        user_id: Unique identifier for the user
        user_query: The user's search query
        subdirectory: The subdirectory to search (links/docs/media)
        system_prompt: The system prompt for this specific agent
        
    Returns:
        Dict with agent results: {"subdirectory": str, "result": str, "error": str | None}
    """
    logger.info(f"Starting {subdirectory} agent for user {user_id}")
    
    try:
        mcp_server_path = Path(__file__).parent / "tools.py"
        
        server = StdioServerParameters(
            command="python",
            args=[str(mcp_server_path)],
            env={"USER_ID": user_id, "SUBDIRECTORY": subdirectory}
        )
        
        async with stdio_client(server) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()

                tools_resp = await session.list_tools()
                logger.info(f"{subdirectory} agent - Available tools: {[t.name for t in tools_resp.tools]}")
                tools_for_model = [mcp_tool_to_openrouter(t) for t in tools_resp.tools]

                client = OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=os.environ.get("OPENROUTER_API_KEY")
                )

                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query},
                ]
                
                logger.info(f"{subdirectory} agent - Processing query: {user_query}")

                response = client.chat.completions.create(
                    model=MODEL,
                    messages=messages,
                    tools=tools_for_model,
                )
                
                msg = response.choices[0].message
                logger.info(f"{subdirectory} agent - Initial response: {msg.model_dump()}")

                while msg.tool_calls:
                    logger.info(f"{subdirectory} agent - Tool calls requested: {len(msg.tool_calls)}")
                    messages.append(msg.model_dump())

                    for call in msg.tool_calls:
                        name = call.function.name
                        args = json.loads(call.function.arguments or "{}")
                        
                        logger.info(f"{subdirectory} agent - Executing tool: {name} with args: {args}")

                        result = await session.call_tool(name, args)

                        payload = None
                        if getattr(result, "structuredContent", None):
                            payload = json.dumps(result.structuredContent)
                        else:
                            parts = []
                            for c in result.content:
                                if isinstance(c, mcp_types.TextContent):
                                    parts.append(c.text)
                            payload = "\n".join(parts) if parts else ""
                        
                        logger.info(f"{subdirectory} agent - Tool {name} result: {payload}")

                        messages.append({
                            "role": "tool",
                            "tool_call_id": call.id,
                            "content": payload,
                        })

                    follow = client.chat.completions.create(
                        model=MODEL,
                        messages=messages,
                    )
                    msg = follow.choices[0].message
                    logger.info(f"{subdirectory} agent - Follow-up response: {msg.model_dump()}")

                logger.info(f"{subdirectory} agent - Final response: {msg.content}")
                return {
                    "subdirectory": subdirectory,
                    "result": msg.content or "",
                    "error": None
                }
                
    except Exception as e:
        logger.error(f"{subdirectory} agent - Error: {str(e)}")
        return {
            "subdirectory": subdirectory,
            "result": "",
            "error": str(e)
        }


async def helix(user_id: str, user_query: str, timeout: int = 600) -> str:
    """
    Process a user request using multiple agents.
    
    Args:
        user_id: Unique identifier for the user
        user_query: The user's search query
        timeout: Timeout in seconds for each agent (default: 600)

    Returns:
        Summarized and structured response from all the agents
    """
    logger.info(f"Processing multi-agent request for user: {user_id}")
    
    agents = [
        ("links", LINKS_AGENT_PROMPT),
        ("docs", DOCS_AGENT_PROMPT),
        ("media", MEDIA_AGENT_PROMPT),
    ]
    
    try:
        results = await asyncio.wait_for(
            asyncio.gather(
                *[agent(user_id, user_query, subdir, prompt) 
                  for subdir, prompt in agents],
                return_exceptions=True
            ),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        logger.error(f"Multi-agent request timed out after {timeout}s for user {user_id}")
        return "Error: Search request timed out. Please try again with a more specific query."
    
    successful_results = []
    failed_agents = []
    
    for result in results:
        if isinstance(result, Exception):
            logger.error(f"Agent exception: {str(result)}")
            failed_agents.append(f"Unknown agent: {str(result)}")
        elif result.get("error"):
            logger.warning(f"{result['subdirectory']} agent failed: {result['error']}")
            failed_agents.append(f"{result['subdirectory']}: {result['error']}")
        elif result.get("result"):
            successful_results.append(f"=== {result['subdirectory'].upper()} RESULTS ===\n{result['result']}")
    
    if not successful_results:
        error_summary = "\n".join(failed_agents) if failed_agents else "All agents failed to return results"
        logger.error(f"All agents failed for user {user_id}: {error_summary}")
        return f"Error: Unable to search any directories. Details:\n{error_summary}"
    
    concatenated_results = "\n\n".join(successful_results)
    
    logger.info(f"Concatenated results length: {len(concatenated_results)} characters")
    
    failure_note = ""
    if failed_agents:
        failure_note = f"\n\nNote: Some search locations were unavailable: {', '.join([f.split(':')[0] for f in failed_agents])}"
    
    try:
        logger.info("Calling Cerebras for synthesis")
        cerebras_client = Cerebras(api_key=os.environ["CEREBRAS_API_KEY"])
        prompt = f"""
                User Query: {user_query}
                Search Results:
                {concatenated_results}
                Please provide a well-structured summary that directly addresses the user's query.
                """
        summary_response = cerebras_client.chat.completions.create(
            model="llama3.3-70b",
            messages=[
                {"role": "system", "content": SYNTHESIS_AGENT_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2048,
        )
        summary = summary_response.choices[0].message.content
        logger.info(f"Summarization complete for user {user_id}")
        
        return summary + failure_note
        
    except Exception as e:
        logger.error(f"Summarization failed: {str(e)}")
        logger.info("Falling back to concatenated results")
        return f"Search Results (summarization unavailable):\n\n{concatenated_results}{failure_note}"
