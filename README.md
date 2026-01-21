# ynab-mcp-server
[![smithery badge](https://smithery.ai/badge/@calebl/ynab-mcp-server)](https://smithery.ai/server/@calebl/ynab-mcp-server)

A Model Context Protocol (MCP) server built with mcp-framework. This MCP provides tools
for interacting with your YNAB budgets setup at https://ynab.com

<a href="https://glama.ai/mcp/servers/@calebl/ynab-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@calebl/ynab-mcp-server/badge" alt="YNAB Server MCP server" />
</a>

In order to have an AI interact with this tool, you will need to get your Personal Access Token
from YNAB: https://api.ynab.com/#personal-access-tokens. When adding this MCP server to any
client, you will need to provide your personal access token as YNAB_API_TOKEN. **This token
is never directly sent to the LLM.** It is stored privately in an environment variable for
use with the YNAB api.

## Setup
Specify env variables:
* YNAB_API_TOKEN (required)
* YNAB_BUDGET_ID (optional)
  * **⚠️ WARNING:** For development/testing, ALWAYS use the "DEVELOPMENT" budget ID to avoid messing up real financial data.
  * You can find this ID by running the `ListBudgets` tool.

## Goal
The goal of the project is to be able to interact with my YNAB budget via an AI conversation.
There are a few primary workflows I want to enable:

## Workflows:
### First time setup
* be prompted to select your budget from your available budgets. If you try to use another
tool first, this prompt should happen asking you to set your default budget.
  * Tools needed: ListBudgets
### Manage overspent categories
### Adding new transactions
### Approving transactions
### Check total monthly spending vs total income
### Auto-distribute ready to assign funds based on category targets

## Current state
Available tools:
* ListBudgets - lists available budgets on your account
* BudgetSummary - provides a summary of categories that are underfunded and accounts that are low
* GetUnapprovedTransactions - retrieve all unapproved transactions
* CreateTransaction - creates a transaction for a specified budget and account.
  * example prompt: `Add a transaction to my Ally account for $3.98 I spent at REI today`
  * requires GetBudget to be called first so we know the account id
* ApproveTransaction - approves an existing transaction in your YNAB budget
  * requires a transaction ID to approve
  * can be used in conjunction with GetUnapprovedTransactions to approve pending transactions
  * After calling get unapproved transactions, prompt: `approve the transaction for $6.95 on the Apple Card`
* CreateMultipleTransactions - create multiple transactions at once
* UpdateMultipleTransactions - update multiple transactions at once
* UpdateSingleTransaction - update a single existing transaction
* ListPayees - get a list of all payees
* GetPayee - get details of a single payee

## Project Roadmap & Priorities

**📋 For the complete project roadmap, current status, and story priorities, see: [docs/Storries](docs/Storries)**

This document contains:
- ✅ **Epic 1: Payee Data Read-Access** (COMPLETE)
- 🚧 **Epic 2: Transaction Management** (In Progress)
- 📋 **Epic 3: Budget & Month Management** (Planned)

**Current Priorities:**
- [x] Story 3.1: UpdateCategoryBudget (Move Money)
- [x] Story 3.2: GetMonthDetail (Budget Status)

**Next:**
* be able to approve multiple transactions with 1 call
* updateCategory tool - or updateTransaction more general tool if I can get optional parameters to work correctly with zod & mcp framework
* move off of mcp framework to use the model context protocol sdk directly?


## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

```

## Project Structure

```
ynab-mcp-server/
├── src/
│   ├── tools/        # MCP Tools
│   └── index.ts      # Server entry point
├── .cursor/
│   └── rules/        # Cursor AI rules for code generation
├── package.json
└── tsconfig.json
```

## Adding Components

The YNAB sdk describes the available api endpoints: https://github.com/ynab/ynab-sdk-js.

YNAB open api specification is here: https://api.ynab.com/papi/open_api_spec.yaml. This can
be used to prompt an AI to generate a new tool. Example prompt for Cursor Agent:

```
create a new tool based on the readme and this openapi doc: https://api.ynab.com/papi/open_api_spec.yaml

The new tool should get the details for a single budget
```

You can add more tools using the CLI:

```bash
# Add a new tool
mcp add tool my-tool

# Example tools you might create:
mcp add tool data-processor
mcp add tool api-client
mcp add tool file-handler
```

## Tool Development

### Critical Testing Requirements

**⚠️ IMPORTANT**: All tools must pass comprehensive testing including build verification and integration testing. See [docs/lessons-learned.md](docs/lessons-learned.md) for critical testing gaps discovered.

#### Required Test Commands
```bash
# Full test suite (includes build verification)
npm test

# Build verification only
npm run test:build-verification

# Coverage (includes build step)
npm run test:coverage

# Restart MCP server (after tests pass)
pkill -f "start-mcp.js" && node start-mcp.js

# Augment Chat testing prompt (after restart)
# Please test the new [TOOL_NAME] tool. Use the [TOOL_NAME] tool with [SPECIFIC_TEST_PARAMETERS] to verify it works correctly with the YNAB development budget.
```

#### Pre-Completion Checklist
- [ ] Unit tests pass
- [ ] Tool compiles to JavaScript successfully
- [ ] Compiled file exists in `dist/tools/`
- [ ] MCP server loads tool without errors
- [ ] Tool appears in server tool list
- [ ] **Restart MCP server** to ensure latest compiled tools are loaded
- [ ] Tool is usable in Augment Chat
- [ ] Provide specific test prompt for Augment Chat testing

### Example Tool Structure

```typescript
import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface MyToolInput {
  message: string;
}

class MyTool extends MCPTool<MyToolInput> {
  name = "my_tool";
  description = "Describes what your tool does";

  schema = {
    message: {
      type: z.string(),
      description: "Description of this input parameter",
    },
  };

  async execute(input: MyToolInput) {
    // Your tool logic here
    return `Processed: ${input.message}`;
  }
}

export default MyTool;
```

## Publishing to npm

1. Update your package.json:
   - Ensure `name` is unique and follows npm naming conventions
   - Set appropriate `version`
   - Add `description`, `author`, `license`, etc.
   - Check `bin` points to the correct entry file

2. Build and test locally:
   ```bash
   npm run build
   npm link
   ynab-mcp-server  # Test your CLI locally
   ```

3. Login to npm (create account if necessary):
   ```bash
   npm login
   ```

4. Publish your package:
   ```bash
   npm publish
   ```

After publishing, users can add it to their claude desktop client (read below) or run it with npx


## Using with Claude Desktop

### Installing via Smithery

To install YNAB Budget Assistant for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@calebl/ynab-mcp-server):

```bash
npx -y @smithery/cli install @calebl/ynab-mcp-server --client claude
```

### Local Development

Add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ynab-mcp-server": {
      "command": "node",
      "args":["/absolute/path/to/ynab-mcp-server/dist/index.js"]
    }
  }
}
```

### After Publishing

Add this configuration to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ynab-mcp-server": {
      "command": "npx",
      "args": ["ynab-mcp-server"]
    }
  }
}
```

### Other MCP Clients
Check https://modelcontextprotocol.io/clients for other available clients.

## Building and Testing

1. Make changes to your tools
2. Run `npm run build` to compile
3. The server will automatically load your tools on startup

## Learn More

- [MCP Framework Github](https://github.com/QuantGeekDev/mcp-framework)
- [MCP Framework Docs](https://mcp-framework.com)
