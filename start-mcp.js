#!/usr/bin/env node

// Change to the correct directory before starting the MCP server
process.chdir('/Users/whatamehs/000-Development/ynab-mcp-again');

// Create symbolic links for the compiled assets if they don't exist
import { existsSync } from 'fs';
import { symlink } from 'fs/promises';

async function setupSymlinks() {
  try {
    if (!existsSync('tools')) {
      await symlink('dist/tools', 'tools', 'dir');
      console.log('Created tools symlink');
    }
    if (!existsSync('prompts') && existsSync('dist/prompts')) {
      await symlink('dist/prompts', 'prompts', 'dir');
      console.log('Created prompts symlink');
    }
    if (!existsSync('resources') && existsSync('dist/resources')) {
      await symlink('dist/resources', 'resources', 'dir');
      console.log('Created resources symlink');
    }
  } catch (error) {
    console.warn('Warning: Could not create symlinks:', error.message);
  }
}

await setupSymlinks();

// Now import and start the server
import('./dist/index.js');
