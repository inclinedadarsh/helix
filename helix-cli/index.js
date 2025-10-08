#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';

const MCP_CONFIG = {
    "helix": {
        "url": "https://helix-mcp-server.borse-aditya7.workers.dev/mcp",
        "type": "http"
    }
};

function getCursorConfigPath() {
    const homeDir = os.homedir();
    return path.join(homeDir, '.cursor', 'mcp.json');
}

function initCursor() {
    const configPath = getCursorConfigPath();
    const configDir = path.dirname(configPath);

    // Ensure .cursor directory exists
    if (!fs.existsSync(configDir)) {
        console.log('Creating .cursor directory...');
        fs.mkdirSync(configDir, { recursive: true });
    }

    let config = {
        mcpServers: {},
        inputs: []
    };

    // Read existing config if it exists
    if (fs.existsSync(configPath)) {
        try {
            const fileContent = fs.readFileSync(configPath, 'utf-8');
            config = JSON.parse(fileContent);
        } catch (error) {
            console.error('Error reading existing config:', error.message);
            console.log('Creating new config...');
        }
    }

    // Check if helix is already configured
    if (config.mcpServers && config.mcpServers.helix) {
        console.log('✓ Helix MCP server is already configured in Cursor!');
        return;
    }

    // Add helix server
    config.mcpServers = config.mcpServers || {};
    config.mcpServers.helix = MCP_CONFIG.helix;

    // Write back to file
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log('✓ Successfully added Helix MCP server to Cursor!');
        console.log(`\nConfig location: ${configPath}`);
        console.log('\nPlease restart Cursor to apply changes.');
    } catch (error) {
        console.error('✗ Error writing config:', error.message);
        process.exit(1);
    }
}

function showHelp() {
    console.log(`
Usage: npx @helixlabs/mcp init --cursor

Commands:
  init --cursor    Setup Helix MCP server in Cursor

Options:
  -h, --help      Show this help message
  `);
}

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
}

if (args[0] === 'init' && args[1] === '--cursor') {
    initCursor();
} else {
    console.error('Invalid command. Use --help for usage information.');
    process.exit(1);
}