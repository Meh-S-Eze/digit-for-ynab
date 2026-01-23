
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ClientManager {
    constructor() {
        // Map<ynabToken, { client: Client, transport: StdioClientTransport, lastUsed: number }>
        this.clients = new Map();
        const CLEANUP_INTERVAL = 1000 * 60 * 5; // 5 minutes
        const MAX_IDLE_TIME = 1000 * 60 * 15; // 15 minutes

        // Periodic cleanup of idle clients
        setInterval(() => {
            const now = Date.now();
            for (const [token, session] of this.clients.entries()) {
                if (now - session.lastUsed > MAX_IDLE_TIME) {
                    console.log(`Cleaning up idle client for token ending in ...${token.slice(-4)}`);
                    try {
                        // There isn't a direct "disconnect" on Client that closes transport, 
                        // but we should attempt to close the transport if possible.
                        // The SDK doesn't expose strict disconnect easily on the high level client without potentially ensuring clean shutdown.
                        // However, for Stdio, we want to kill the process.
                        // The transport object often has close() or similar, or we just drop reference.
                        // Let's rely on garbage collection? No, that leaves processes.
                        // StdioClientTransport likely has a helper. 
                        // Looking at SDK source is hard, let's assume we just drop it for now OR verify transport.close() exists.
                        // NOTE: SDK 0.6.0 StdioClientTransport has .close().
                        session.transport.close().catch(e => console.error("Error closing transport:", e));
                    } catch (e) {
                        console.error("Error cleaning up client:", e);
                    }
                    this.clients.delete(token);
                }
            }
        }, CLEANUP_INTERVAL);
    }

    async getClient(ynabToken) {
        if (!ynabToken) {
            throw new Error("YNAB Token is required to create an MCP client.");
        }

        if (this.clients.has(ynabToken)) {
            const session = this.clients.get(ynabToken);
            session.lastUsed = Date.now();
            return session.client;
        }

        console.log(`Creating new MCP client for token ending in ...${ynabToken.slice(-4)}`);

        const mcpServerPath = path.resolve(__dirname, '../../dist/index.js');
        console.log(`[ClientManager] Resolving MCP server at: ${mcpServerPath}`);

        // Debug Check
        import fs from 'fs';
        try {
            if (fs.existsSync(mcpServerPath)) {
                console.log("✅ MCP Server file exists.");
            } else {
                console.error("❌ MCP Server file NOT FOUND at " + mcpServerPath);
                // List specific directories to help debug
                try {
                    console.log("Contents of ../../:", fs.readdirSync(path.resolve(__dirname, '../../')));
                    if (fs.existsSync(path.resolve(__dirname, '../../dist'))) {
                        console.log("Contents of ../../dist:", fs.readdirSync(path.resolve(__dirname, '../../dist')));
                    } else {
                        console.log("dist directory does not exist.");
                    }
                } catch (err) {
                    console.error("Error listing directories:", err);
                }
            }
        } catch (err) {
            console.error("Error checking file existence:", err);
        }

        const transport = new StdioClientTransport({
            command: 'node',
            args: [mcpServerPath],
            env: {
                ...process.env,
                YNAB_API_TOKEN: ynabToken, // Inject the specific user's token
                PATH: process.env.PATH,
            }
        });

        const client = new Client(
            {
                name: 'ynab-chat-client',
                version: '1.0.0',
            },
            {
                capabilities: {
                    prompts: {},
                    resources: {},
                    tools: {},
                },
            }
        );

        await client.connect(transport);

        this.clients.set(ynabToken, {
            client,
            transport,
            lastUsed: Date.now()
        });

        return client;
    }
}

export const clientManager = new ClientManager();
