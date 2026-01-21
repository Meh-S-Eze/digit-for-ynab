import { MCPServer } from "mcp-framework";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";

// Ensure we are in the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// If running from dist/index.js, root is ..
// If running from src/index.ts (e.g. via tsx), root is .. 
const projectRoot = path.resolve(__dirname, "..");
process.chdir(projectRoot);

// Ensure logs directory exists to prevent startup crash
if (!existsSync("logs")) {
  mkdirSync("logs");
}

const server = new MCPServer();

server.start();

// Handle shutdown
process.on("SIGINT", async () => {
  await server.stop();
});
