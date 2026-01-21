# YNAB MCP Tool Dependencies

This document maps each tool to its prerequisite tools and related tools. Use this to understand what you must call before using a specific tool.

## Quick Reference Table

| Tool | Prerequisites | Related Tools | Notes |
|------|---------------|---------------|-------|
| `list_budgets` | None | — | Always call this first to get `budgetId` |
| `list_accounts` | `list_budgets` or `budgetId` | `list_budgets` | Get account IDs needed for transactions |
| `budget_summary` | `list_budgets` or `budgetId` | `get_month_detail` | Shows overspent categories and account balances |
| `get_month_detail` | `list_budgets` or `budgetId` | `budget_summary` | Detailed category budget info for a month |
| `get_unapproved_transactions` | `list_budgets` or `budgetId` | `approve_transaction` | Find transactions needing approval |
| `analyze_transactions` | `list_budgets` or `budgetId` | `get_unapproved_transactions` | Filter and search specific transactions |
| `analyze_spending_by_category` | `list_budgets` or `budgetId` | `generate_spending_report` | See spending breakdown by category |
| `generate_spending_report` | `list_budgets` or `budgetId` | `analyze_spending_by_category` | See spending trends over time |
| `get_payees` | `list_budgets` or `budgetId` | `get_single_payee` | Get all payees for reference |
| `get_single_payee` | `list_budgets` or `budgetId` | `get_payees` | Get details for one payee |
| `create_transaction` | `list_budgets` or `budgetId`, `list_accounts` | `create_multiple_transactions`, `approve_transaction` | Need `accountId` from `list_accounts` |
| `create_multiple_transactions` | `list_budgets` or `budgetId`, `list_accounts` | `create_transaction`, `get_unapproved_transactions` | Bulk create; need `accountId` from `list_accounts` |
| `create_split_transaction` | `list_budgets` or `budgetId`, `list_accounts` | `create_transaction` | For multi-category purchases |
| `create_transfer` | `list_budgets` or `budgetId`, `list_accounts` | `create_transaction` | For inter-account transfers |
| `create_scheduled_transaction` | `list_budgets` or `budgetId`, `list_accounts` | `list_scheduled_transactions` | Set up recurring transactions |
| `approve_transaction` | `budgetId`, `transactionId` (from create or search) | `get_unapproved_transactions`, `update_single_transaction` | Need transaction ID first |
| `approve_multiple_transactions` | `budgetId`, `transactionIds` array | — | Approve batch of transactions |
| `update_single_transaction` | `budgetId`, `transactionId` | `analyze_transactions`, `get_unapproved_transactions` | Find transaction ID via search first |
| `update_multiple_transactions` | `budgetId`, array of transaction updates | — | Batch update multiple transactions |
| `delete_transaction` | `budgetId`, `transactionId` | `analyze_transactions` | ⚠️ Permanent. Get ID via search first. |
| `delete_scheduled_transaction` | `budgetId`, `scheduledTransactionId` | `list_scheduled_transactions` | ⚠️ Permanent. Get ID from list first. |
| `clear_transaction` | `budgetId`, `transactionId` | `update_single_transaction` | Mark as cleared/reconciled. Get ID via search. |
| `move_funds` | `budgetId` | `budget_summary` | Reallocate between categories |
| `update_category_budget` | `budgetId`, `categoryId` | `budget_summary`, `get_month_detail` | Update category budget amount |
| `list_scheduled_transactions` | `list_budgets` or `budgetId` | `create_scheduled_transaction`, `delete_scheduled_transaction` | View all scheduled/recurring |
| `health_check` | None | — | Verify server is running (diagnostic tool) |

---

## Detailed Tool Dependencies

### Read/List Tools (No prerequisites except budgetId)

#### `list_budgets`
- **Prerequisites**: None
- **Usage**: First step - lists all available budgets
- **Returns**: Budget IDs and names
- **Next Steps**: Select a budget, use its ID for other tools
- **Caching**: Results cached 5 minutes

#### `list_accounts`
- **Prerequisites**: `budgetId` (from `list_budgets`)
- **Usage**: Get all accounts in a budget
- **Returns**: Account IDs, names, balances, types
- **Next Steps**: Use `accountId` for transaction creation
- **Why needed**: `create_transaction` requires `accountId`

#### `budget_summary`
- **Prerequisites**: `budgetId` (from `list_budgets`)
- **Parameters**: `month` (optional, defaults to "current")
- **Usage**: Get budget health for a month
- **Returns**: Income, budgeted, activity, overspent categories, account balances
- **Next Steps**: Identify problem areas, call `move_funds` to rebalance
- **Caching**: Results cached 5 minutes

#### `get_month_detail`
- **Prerequisites**: `budgetId` (from `list_budgets`)
- **Parameters**: `month` (ISO date like "2026-01-01")
- **Usage**: Detailed category info for a specific month
- **Returns**: Category budget amounts, activity, balance
- **Related**: `budget_summary` (high-level) vs `get_month_detail` (detailed)

#### `get_payees`
- **Prerequisites**: `budgetId` (from `list_budgets`)
- **Usage**: List all payees in the budget
- **Returns**: Payee IDs and names
- **Why needed**: Optional - can use `payeeName` instead of `payeeId` when creating transactions

#### `get_single_payee`
- **Prerequisites**: `budgetId` (from `list_budgets`), `payeeId` (from `get_payees`)
- **Usage**: Get details for one payee
- **Returns**: Payee info and recent transactions

#### `list_scheduled_transactions`
- **Prerequisites**: `budgetId` (from `list_budgets`)
- **Usage**: View all scheduled/recurring transactions
- **Returns**: Scheduled transaction IDs, next dates, amounts
- **Next Steps**: Call `delete_scheduled_transaction` to remove, or `create_scheduled_transaction` to add

#### `health_check`
- **Prerequisites**: None
- **Usage**: Verify MCP server and API connection
- **Returns**: Server status, API authentication status
- **When to use**: Diagnostic tool when other tools fail

---

### Search/Analysis Tools (Read-only, no side effects)

#### `get_unapproved_transactions`
- **Prerequisites**: `budgetId` (from `list_budgets`)
- **Usage**: Find transactions awaiting approval
- **Returns**: Array of unapproved transactions with IDs
- **Next Steps**: Call `approve_transaction` with returned IDs
- **Why needed**: You need `transactionId` to approve

#### `analyze_transactions`
- **Prerequisites**: `budgetId` (from `list_budgets`)
- **Parameters**: Filters like `payee_name`, `category_id`, date range, etc.
- **Usage**: Search transactions with flexible criteria
- **Returns**: Transaction details matching filters
- **Next Steps**: Use returned transaction IDs to update/delete

#### `analyze_spending_by_category`
- **Prerequisites**: `budgetId` (from `list_budgets`)
- **Parameters**: Date range (start_date, end_date)
- **Usage**: See total spending per category
- **Returns**: Category names and spending amounts
- **When to use**: Answer "Where does my money go?"
- **Related**: Use `generate_spending_report` for trends instead

#### `generate_spending_report`
- **Prerequisites**: `budgetId` (from `list_budgets`)
- **Parameters**: Date range (start_date, end_date)
- **Usage**: See income/expense trends month-by-month
- **Returns**: Monthly income, expenses, net balance
- **When to use**: Answer "How is my spending trending?"
- **Related**: Use `analyze_spending_by_category` for breakdown instead

---

### Create Tools (Write operations)

#### `create_transaction`
- **Prerequisites**: 
  - `budgetId` (from `list_budgets`)
  - `accountId` (from `list_accounts`)
- **Parameters**:
  - Required: `accountId`, `date`, `amount`
  - Optional: `payeeName` or `payeeId`, `categoryId`, `memo`, `approved`
- **Usage**: Add a single transaction
- **Returns**: Created transaction ID
- **Next Steps**: Call `approve_transaction` if not auto-approved
- **When to use**: Single transaction; use `create_multiple_transactions` for bulk

#### `create_multiple_transactions`
- **Prerequisites**:
  - `budgetId` (from `list_budgets`)
  - `accountId` (from `list_accounts`)
- **Parameters**: Array of transaction objects
- **Usage**: Bulk import multiple transactions
- **Returns**: Array of created transaction IDs, duplicate count
- **Next Steps**: Check for duplicates, approve if needed
- **When to use**: Batch import; use `create_transaction` for single

#### `create_split_transaction`
- **Prerequisites**:
  - `budgetId` (from `list_budgets`)
  - `accountId` (from `list_accounts`)
- **Parameters**:
  - Single transaction amount
  - Array of splits with category and amount per category
- **Usage**: One purchase split across multiple categories
- **Example**: $100 at Target → $60 groceries + $40 household
- **Returns**: Created transaction ID
- **When to use**: Purchase spans multiple categories
- **Why**: Ensures accurate spending analysis per category

#### `create_transfer`
- **Prerequisites**:
  - `budgetId` (from `list_budgets`)
  - `accountId` (from `list_accounts`) for both source and dest
- **Parameters**: Source account, destination account, amount
- **Usage**: Move money between accounts
- **Example**: Transfer $500 from Checking to Savings
- **Returns**: Created transaction ID
- **Why**: Transfers are auto-linked in YNAB

#### `create_scheduled_transaction`
- **Prerequisites**:
  - `budgetId` (from `list_budgets`)
  - `accountId` (from `list_accounts`)
- **Parameters**: 
  - Required: `accountId`, `amount`, `nextDate`, `frequency`
  - Optional: `payeeName`, `categoryId`, `memo`
- **Usage**: Set up recurring transactions
- **Example**: Monthly $1500 rent on 1st of month
- **Returns**: Scheduled transaction ID
- **Next Steps**: Call `list_scheduled_transactions` to verify

---

### Update/Approve Tools (Write operations)

#### `approve_transaction`
- **Prerequisites**:
  - `budgetId` (from `list_budgets`)
  - `transactionId` (from `create_transaction`, `create_multiple_transactions`, or `get_unapproved_transactions`)
- **Usage**: Mark a transaction as approved
- **Returns**: Updated transaction details
- **Why needed**: Newly imported or unapproved transactions need approval
- **Batch alternative**: Use `update_multiple_transactions` to approve multiple at once

#### `update_single_transaction`
- **Prerequisites**:
  - `budgetId` (from `list_budgets`)
  - `transactionId` (from search via `analyze_transactions` or `get_unapproved_transactions`)
- **Parameters**: Only include fields to change (others preserve original)
- **Usage**: Fix transaction details
- **Example**: Change $20 to $25, or move to different category
- **Returns**: Updated transaction details
- **Warning**: Must have transaction ID first; use search to find it

#### `update_multiple_transactions`
- **Prerequisites**:
  - `budgetId` (from `list_budgets`)
  - Array of transaction IDs and updates
- **Usage**: Batch update multiple transactions
- **Example**: Approve 10 transactions at once
- **Returns**: Array of updated transaction details

#### `clear_transaction`
- **Prerequisites**:
  - `budgetId` (from `list_budgets`)
  - `transactionId` (from search)
- **Usage**: Mark transaction as cleared/reconciled (matched to bank)
- **Returns**: Updated transaction details
- **When to use**: After bank reconciliation

---

### Budget Management Tools

#### `move_funds`
- **Prerequisites**: `budgetId` (from `list_budgets`)
- **Parameters**: Source category ID, destination category ID, amount
- **Usage**: Reallocate budget between categories
- **Example**: Move $100 from Entertainment (overspent) to Savings
- **Returns**: Updated category balances
- **Why needed**: Category has overspent? Call `budget_summary` first

#### `update_category_budget`
- **Prerequisites**: `budgetId` (from `list_budgets`)
- **Parameters**: `categoryId` (from `budget_summary`), new amount
- **Usage**: Change category budget target
- **Example**: Increase Groceries budget from $400 to $500
- **Returns**: Updated category details
- **Related**: `move_funds` adjusts available; this adjusts the target

---

### Delete Tools (Destructive - use with caution)

#### `delete_transaction`
- **Prerequisites**: `budgetId`, `transactionId` (from search)
- **Usage**: Permanently delete a transaction
- **⚠️ WARNING**: Cannot be undone
- **When to use**: Only after confirming with user
- **How to find ID**: Use `analyze_transactions` or `get_unapproved_transactions`

#### `delete_scheduled_transaction`
- **Prerequisites**: `budgetId`, `scheduledTransactionId` (from `list_scheduled_transactions`)
- **Usage**: Remove a scheduled/recurring transaction
- **⚠️ WARNING**: Cannot be undone
- **When to use**: Only after confirming with user

---

## Dependency Flow Diagrams

### Workflow: Add & Approve Transaction
```
list_budgets
    ↓ (select one)
list_accounts
    ↓ (select account)
create_transaction (need: budgetId, accountId)
    ↓ (if not auto-approved)
approve_transaction (need: transactionId)
```

### Workflow: Check Budget & Rebalance
```
list_budgets
    ↓ (select one)
budget_summary (need: budgetId)
    ↓ (identify overspent category)
move_funds (need: budgetId, categoryIds)
```

### Workflow: Find & Fix Transaction
```
list_budgets
    ↓ (select one)
analyze_transactions (need: budgetId, filters)
    ↓ (find transaction)
update_single_transaction (need: budgetId, transactionId)
```

### Workflow: Bulk Approve Pending
```
list_budgets
    ↓ (select one)
get_unapproved_transactions (need: budgetId)
    ↓ (returns transactionIds)
approve_transaction OR update_multiple_transactions
```

---

## Error Recovery by Prerequisite

### "Budget ID not found" error
**Cause**: `budgetId` parameter is invalid or not set
**Recovery**:
1. Call `list_budgets`
2. Verify the budget you want is in the list
3. Retry with correct `budgetId`

### "Account ID not found" error
**Cause**: Creating transaction without valid `accountId`
**Recovery**:
1. Call `list_accounts` with correct `budgetId`
2. Verify account name matches user's intent
3. Retry with correct `accountId`

### "Transaction not found" error
**Cause**: Trying to approve/update/delete with invalid `transactionId`
**Recovery**:
1. Call `get_unapproved_transactions` OR `analyze_transactions` with filters
2. Find the correct transaction ID
3. Retry with correct `transactionId`

### "Payee not found" error
**Cause**: Using `payeeId` that doesn't exist (or invalid `categoryId`)
**Recovery**:
1. Use `payeeName` instead (YNAB creates if not exists)
2. OR call `get_payees` to find correct ID
3. Retry

### "Category not found" error
**Cause**: Using invalid `categoryId`
**Recovery**:
1. Call `budget_summary` to see all categories
2. Use `id` from the returned categories
3. Retry

---

## Quick Decision Tree

**Q: Which tool do I call first?**
A: Always `list_budgets` unless you already have a `budgetId`

**Q: I want to create a transaction, what do I need?**
A: 
1. `budgetId` (from `list_budgets`)
2. `accountId` (from `list_accounts`)
3. Amount, date, and either `payeeName` or `payeeId`

**Q: I want to find a transaction, which search tool?**
A:
- Unapproved only → `get_unapproved_transactions`
- Specific filters (payee, date range, category) → `analyze_transactions`

**Q: I want to analyze spending, which report?**
A:
- By category (where money goes) → `analyze_spending_by_category`
- Over time (trending) → `generate_spending_report`
- By month detail → `get_month_detail`

**Q: How do I approve multiple transactions?**
A:
1. Get transaction IDs from `get_unapproved_transactions`
2. Call `update_multiple_transactions` with array of IDs and `approved: true`
3. OR loop and call `approve_transaction` for each (slower)
