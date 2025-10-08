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

function getVSCodeConfigPath() {
    const homeDir = os.homedir();
    const platform = os.platform();

    if (platform === 'win32') {
        return path.join(homeDir, 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'mcp.json');
    } else if (platform === 'darwin') {
        return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'mcp.json');
    } else {
        return path.join(homeDir, '.config', 'Code', 'User', 'globalStorage', 'mcp.json');
    }
}

function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function addServerToConfig(configPath, editorName) {
    ensureDirectoryExists(configPath);

    const serverKey = editorName === 'VS Code' ? 'servers' : 'mcpServers';

    let config = {
        [serverKey]: {},
        inputs: []
    };

    // Read existing config if it exists
    if (fs.existsSync(configPath)) {
        try {
            const fileContent = fs.readFileSync(configPath, 'utf-8');
            config = JSON.parse(fileContent);

            // Ensure the correct key exists
            if (!config[serverKey]) {
                config[serverKey] = {};
            }
        } catch (error) {
            console.error(`Error reading existing config: ${error.message}`);
            console.log('Creating new config...');
        }
    }

    // Check if helix is already configured
    if (config[serverKey] && config[serverKey].helix) {
        console.log(`✓ Helix MCP server is already configured in ${editorName}!`);
        return;
    }

    // Add helix server
    config[serverKey].helix = MCP_CONFIG.helix;

    // Write back to file
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log(`✓ Successfully added Helix MCP server to ${editorName}!`);
        console.log(`\nConfig location: ${configPath}`);
        console.log(`\nPlease restart ${editorName} to apply changes.`);
        console.log("\nPlease go to the MCP Servers tab and authenticate with your GitHub account.");
    } catch (error) {
        console.error(`✗ Error writing config: ${error.message}`);
        process.exit(1);
    }
}

function initCursor() {
    const configPath = getCursorConfigPath();
    addServerToConfig(configPath, 'Cursor');
}

function initVSCode() {
    const configPath = getVSCodeConfigPath();
    addServerToConfig(configPath, 'VS Code');
}

function showHelp() {
    console.log(`
Usage: npx @helixlabs/mcp init [options]

Commands:
  init --cursor    Setup Helix MCP server in Cursor
  init --vscode    Setup Helix MCP server in VS Code
  init --all       Setup Helix MCP server in both Cursor and VS Code

Options:
  -h, --help       Show this help message

Examples:
  npx @helixlabs/mcp init --cursor
  npx @helixlabs/mcp init --vscode
  npx @helixlabs/mcp init --all
  `);
}

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
}

if (args[0] === 'init') {
    if (args.includes('--cursor')) {
        initCursor();
    } else if (args.includes('--vscode')) {
        initVSCode();
    } else if (args.includes('--all')) {
        console.log('Setting up Helix MCP server for all editors...\n');
        initCursor();
        console.log('');
        initVSCode();
    } else {
        console.error('Invalid option. Use --cursor, --vscode, or --all');
        console.log('\nRun with --help for usage information.');
        process.exit(1);
    }
} else {
    console.error('Invalid command. Use --help for usage information.');
    process.exit(1);
}