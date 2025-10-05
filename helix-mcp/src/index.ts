import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import { GitHubHandler } from "./github-handler";

type Props = {
	login: string;
	name: string;
	email: string;
	accessToken: string;
};

interface SearchRequest {
	user_id: string;
	query: string;
}

interface SearchResponse {
	user_id: string;
	query: string;
	result: string;
}

export class MyMCP extends McpAgent<Env, Record<string, never>, Props> {
	server = new McpServer({
		name: "Helix",
		version: "1.0.0",
	});

	async init() {
		this.server.tool(
			"helix",
			"Retrieve personalized context and knowledge about the user to better answer their questions. Call this tool when you need additional information about the user's data, preferences, history, or personal context to provide more accurate and relevant responses.",
			{ query: z.string().describe("The question or context you need about the user to answer their request") },
			async ({ query }) => {
				try {
					if (!this.props?.login) {
						return {
							content: [{
								type: "text",
								text: "Error: User authentication required. Please ensure you are logged in."
							}],
							isError: true,
						};
					}

					const searchRequest: SearchRequest = {
						user_id: this.props.login,
						query: query,
					};

					const apiUrl = this.env.SEARCH_API_URL || "http://localhost:8001/search";

					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 120000);

					try {
						const response = await fetch(apiUrl, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify(searchRequest),
							signal: controller.signal,
						});

						clearTimeout(timeoutId);

						if (!response.ok) {
							const errorText = await response.text().catch(() => "Unknown error");
							return {
								content: [{
									type: "text",
									text: `API Error (${response.status}): ${errorText}`
								}],
								isError: true,
							};
						}

						const data: SearchResponse = await response.json();

						return {
							content: [{
								type: "text",
								text: data.result,
							}],
						};
					} catch (fetchError) {
						clearTimeout(timeoutId);

						if (fetchError instanceof Error) {
							if (fetchError.name === "AbortError") {
								return {
									content: [{
										type: "text",
										text: "Request timeout: The search API took too long to respond."
									}],
									isError: true,
								};
							}
							return {
								content: [{
									type: "text",
									text: `Network error: ${fetchError.message}`
								}],
								isError: true,
							};
						}

						throw fetchError;
					}
				} catch (error) {
					return {
						content: [{
							type: "text",
							text: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
						}],
						isError: true,
					};
				}
			},
		);
	}
}

const provider = new OAuthProvider({
	apiHandlers: {
		"/sse": MyMCP.serveSSE("/sse"), 
		"/mcp": MyMCP.serve("/mcp"),
	},
	authorizeEndpoint: "/authorize",
	clientRegistrationEndpoint: "/register",
	defaultHandler: GitHubHandler as any,
	tokenEndpoint: "/token",
});

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
					'Access-Control-Max-Age': '86400'
				}
			});
		}

		const response = await provider.fetch(request, env, ctx);
		
		const headers = new Headers(response.headers);
		headers.set('Access-Control-Allow-Origin', '*');
		headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
		headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers
		});
	}
} satisfies ExportedHandler<Env>;
