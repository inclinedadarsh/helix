# Helix MCP Server

Remote Model Context Protocol (MCP) server that provides AI assistants with personalized context and knowledge about users.

## Overview

Helix MCP enables AI assistants to access user-specific data, preferences, and personal context, allowing them to provide more accurate and relevant responses. The server acts as a bridge between AI clients and the user's knowledge store present on [helix-llm.app](https://helix-llm.app/).

## Technologies Used

- **Runtime**: Cloudflare Workers
- **Storage**: Cloudflare Durable Objects + KV
- **Authentication**: GitHub OAuth via `@cloudflare/workers-oauth-provider`
- **MCP SDK**: `@modelcontextprotocol/sdk` v1.19.1
- **Agent Framework**: `agents` v0.2.8 with `McpAgent`

## Tool

### `helix`

Retrieve personalized context and knowledge about the user by querying their uploaded files and data.

**Input Schema:**
```json
{
  "query": "string - The question or context you need about the user"
}
```

**Example Queries:**
```
"What topics did I discuss in my recent meeting recordings?"
"Summarize the key points from the research papers I uploaded"
"What are my recent projects?"
"Find information about machine learning from my saved articles"
```

**How It Works:**
1. User uploads files via the Helix app available at [helix-llm.app](https://helix-llm.app/)
2. Helix backend service processes and stores the files.
3. When any LLM client (like ChatGPT, Claude, or Cursor) queries via Helix MCP, a multi-agent system searches across all user's processed content.
4. Results are synthesized and returned to the AI assistant with relevant context.

## How to Use

There are two methods to connect the Helix MCP server to your AI client:

### Method 1: Direct Connection

Connect directly to the Helix MCP server using the server URL. This method works with any MCP-compatible client.

**Server URL:** `https://helix-mcp-server.borse-aditya7.workers.dev/mcp`

#### VS Code (GitHub Copilot)

1. Open VS Code settings (JSON) by pressing `Cmd/Ctrl + Shift + P` and searching for "Preferences: Open User Settings (JSON)"
2. Add the following configuration:
```json
{
  "mcp": {
    "servers": {
      "helix": {
        "type": "http",
        "url": "https://helix-mcp-server.borse-aditya7.workers.dev/mcp"
      }
    }
  }
}
```
3. Reload VS Code
4. Enable MCP support: Go to Settings → Search for `chat.mcp.enabled` and set it to `true` 
5. Open GitHub Copilot Chat in **Agent mode** to use the Helix tool


#### Cursor

Cursor supports MCP servers through workspace configuration:

1. Create a `.vscode/mcp.json` file in your workspace root
2. Add the following configuration:
```json
{
  "servers": {
    "helix": {
      "type": "http",
      "url": "https://helix-mcp-server.borse-aditya7.workers.dev/mcp"
    }
  }
}
```
3. Restart Cursor
4. The Helix tool will be available in Cursor's AI chat interface

#### Claude Desktop

1. Locate your Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Open the configuration file in a text editor

3. Add the Helix MCP server to the `mcpServers` section:
```json
{
  "mcpServers": {
    "helix": {
      "url": "https://helix-mcp-server.borse-aditya7.workers.dev/mcp"
    }
  }
}
```

   **Note**: If you already have other MCP servers configured, add the `helix` entry to the existing `mcpServers` object.

4. Save the file and restart Claude Desktop

5. Open a new conversation in Claude Desktop

6. The Helix tool will now be available - Claude can automatically use it to retrieve your personalized context when relevant to the conversation

### Method 2: Using Docker MCP Gateway

## TODO