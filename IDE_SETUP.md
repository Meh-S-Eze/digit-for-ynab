# IDE Integration Guide

To use the YNAB MCP Server with your AI-powered IDE (like Claude Desktop, Cursor, or Windsurf), you need to register it in your MCP configuration file.

## Prerequisite: Build the Server
Ensure you have the latest version built:
```bash
cd /Users/whatamehs/000-Development/ynab-mcp-again
npm install
npm run build
```

## Configuration for Claude Desktop / Agent IDEs

Add the following to your MCP config file (typically `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "ynab": {
      "command": "node",
      "args": [
        "/Users/whatamehs/000-Development/ynab-mcp-again/dist/index.js"
      ],
      "env": {
        "YNAB_API_TOKEN": "YOUR_API_TOKEN_HERE",
        "YNAB_BUDGET_ID": "7c8d67c8-ed70-4ba8-a25e-931a2f294167"
      }
    }
  }
}
```

> **Note**: Replace `"YOUR_API_TOKEN_HERE"` with your actual YNAB API Token. You can find this in your `.env` file.
> **Note**: The `YNAB_BUDGET_ID` is currently set to your **Development Budget**. Change this to your Production Budget ID when you are ready to manage your real money.


## Available Tools (24)

The current version of the server provides a comprehensive set of 24 tools for budget management and analysis:

- **Analysis & Reporting**: `analyze_spending_by_category`, `analyze_transactions`, `generate_spending_report`, `get_budget_summary`
- **Transactions**: `create_transaction`, `create_multiple_transactions`, `create_transfer`, `update_single_transaction`, `update_multiple_transactions`, `approve_transaction`, `clear_transaction`, `get_unapproved_transactions`, `delete_transaction`
- **Scheduled Transactions**: `list_scheduled_transactions`, `create_scheduled_transaction`, `delete_scheduled_transaction`
- **Budgeting**: `get_month_detail`, `update_category_budget`, `move_funds`, `list_budgets`
- **Accounts & Payees**: `list_accounts`, `get_payees`, `get_single_payee`
- **System**: `health_check`

## Available Prompts (3)
The server provides contextual guidance to the AI through MCP Prompts:
- `analyze_spending_guidance`: Helps the AI choose the right tool for spending analysis.
- `transaction_maintenance_guidance`: Best practices for transaction lifecycle and safety.
- `resource_allocation_guidance`: Guidance on moving money between categories effectively.

## Testing the Connection
Once configured:
1.  Restart your IDE / Claude Desktop.
2.  Look for the 🔌 icon or "MCP Servers" status.
3.  Ask the AI: *"List my recent YNAB transactions"* or *"What is my age of money?"*

## Troubleshooting
*   **"Server not found"**: Double-check the path to `dist/index.js`.
*   **"Permission denied"**: Run `chmod +x dist/index.js`.
*   **Authentication Errors**: Verify the `YNAB_API_TOKEN` in the config JSON matches your working `.env` token.
