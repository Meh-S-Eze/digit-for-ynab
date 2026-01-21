# Rust MCP Server Setup

Here is the complete configuration to use the high-performance **Rust** server with your current Authentication and Development Budget.

## Configuration for Claude Desktop

Copy this **exact** block into your `claude_desktop_config.json` file (typically located at `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ynab-rust": {
      "command": "/Users/whatamehs/000-Development/ynab-mcp-25-11-05/target/release/ynab-mcp",
      "args": [],
      "env": {
        "YNAB_API_TOKEN": "5YTfUea-_BgtRVWgAY_Gdpgqimho-AHD2cwg4Rza5fo",
        "YNAB_BUDGET_ID": "7c8d67c8-ed70-4ba8-a25e-931a2f294167"
      }
    }
  }
}
```

> **Security Note**: This file now contains your actual API Token. Be careful if sharing this screen or file.

## Important Note on Budget ID
The Rust server does not natively support the `YNAB_BUDGET_ID` environment variable to set a default budget.

**You must tell the AI which budget to use** at the start of your conversation, for example:
*   *"Use the budget with ID 7c8d67c8..."*
*   *"List my budgets and use the 'My Budget' one"*

Including `YNAB_BUDGET_ID` in the `env` block above makes it available to the AI if it decides to inspect its environment, but it won't automatically restrict the tool scope unless the AI agent logic handles it.
