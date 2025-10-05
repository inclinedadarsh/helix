import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

interface SearchRequest {
  user_id: string;
  query: string;
}

interface SearchResponse {
  user_id: string;
  query: string;
  result: string;
}

async function main() {
  const server = new McpServer({
    name: 'Helix',
    version: '1.0.0',
  });

  server.tool(
    'helix',
    'Retrieve personalized context and knowledge about the user to better answer their questions. Call this tool when you need additional information about the user\'s data, preferences, history, or personal context to provide more accurate and relevant responses.',
    { query: z.string().describe('The question or context you need about the user to answer their request') },
    async ({ query }) => {
      try {
        const userId = process.env.MCP_USER_ID;

        if (!userId) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: User authentication required. Please ensure MCP_USER_ID is set.',
              },
            ],
            isError: true,
          };
        }

        const searchRequest: SearchRequest = {
          user_id: userId,
          query: query,
        };

        const apiUrl = 'https://server.helix-llm.app/search';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); 

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchRequest),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            return {
              content: [
                {
                  type: 'text',
                  text: `API Error (${response.status}): ${errorText}`,
                },
              ],
              isError: true,
            };
          }

          const data = await response.json() as SearchResponse;

          return {
            content: [
              {
                type: 'text',
                text: data.result,
              },
            ],
          };
        } catch (fetchError) {
          clearTimeout(timeoutId);

          if (fetchError instanceof Error) {
            if (fetchError.name === 'AbortError') {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Request timeout: The search API took too long to respond (>2 minutes).',
                  },
                ],
                isError: true,
              };
            }

            return {
              content: [
                {
                  type: 'text',
                  text: `Network error: ${fetchError.message}`,
                },
              ],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: 'text',
                text: 'Network error: Unknown error occurred',
              },
            ],
            isError: true,
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Helix MCP Server started successfully');

  process.on('SIGINT', async () => {
    console.error('Shutting down Helix MCP Server...');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Shutting down Helix MCP Server...');
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error in Helix MCP Server:', error);
  process.exit(1);
});
