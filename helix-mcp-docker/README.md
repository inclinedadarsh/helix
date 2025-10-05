# Helix MCP Server (Docker)

Docker containerized version of Helix MCP Server for use with Docker Desktop's MCP Toolkit.

## Features

- Personalized context retrieval from user data uploaded to [Helix App](https://helix-llm.app)

## Environment Variables

- `MCP_USER_ID` - GitHub username

## Building Locally
```bash
# Build the image
docker build -t helix-mcp:latest .

# Test the image (interactive mode)
docker run -i --rm \
  -e MCP_USER_ID=your_github_username \
  helix-mcp:latest