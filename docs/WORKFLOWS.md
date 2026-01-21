# YNAB MCP Workflows

This document maps common user intents to the correct sequences of MCP tools. Use this to understand the proper order of operations when using the YNAB MCP.

## Core Concepts

### Budget ID
Many tools require a `budgetId`. This can be provided in two ways:
1. **Environment variable**: Set `YNAB_BUDGET_ID` when starting the MCP
2. **Per-call parameter**: Pass `budgetId` to individual tool calls

If neither is provided, you must call `list_budgets` first.

### Account ID
When creating transactions, you need an `accountId`. Always call `list_accounts` first to get available accounts.

### Category ID
When creating transactions in specific categories, you need a `categoryId`. Call `list_budgets` or `budget_summary` to discover available categories.

### Payee ID vs Payee Name
When creating transactions, you can either:
- Use `payeeId` (retrieved from `get_payees`)
- Use `payeeName` (string - YNAB will create if it doesn't exist)

---

## Workflow 1: First-Time Setup

**User Intent**: "Set up the MCP with my YNAB account"

### Steps
1. **Call** `list_budgets`
   - Returns: All available budgets with IDs and names
   - AI Action: Present list to user for selection

2. **User selects a budget**

3. **Store the budget ID**
   - AI Action: Save to `YNAB_BUDGET_ID` environment variable or remember for session
   - This avoids requiring `budgetId` parameter in subsequent calls

4. **Optional: Call** `list_accounts`
   - Returns: All accounts in the selected budget
   - AI Action: Show user their account structure

5. **Ready to proceed** to other workflows

### Example Flow
```
User: "Set up my YNAB budget"
AI: list_budgets()
AI: "Which budget? (1) Personal (2) Family"
User: "Personal"
AI: [Store budgetId: abc123]
AI: "Setup complete. Your accounts are: Checking, Savings, Credit Card"
```

---

## Workflow 2: Add & Approve a Single Transaction

**User Intent**: "I spent $15 at Starbucks, add it to my budget and approve it"

### Steps
1. **Ensure budget ID is set**
   - If not, call `list_budgets` and have user select

2. **Get available accounts** (if not cached)
   - Call: `list_accounts`
   - Returns: Accounts with IDs (e.g., "Checking" → id: abc123)
   - AI Action: Match user's statement to an account name

3. **Create the transaction**
   - Call: `create_transaction` (or `create_multiple_transactions` if batch)
   - Parameters:
     - `budgetId`: From environment or previous call
     - `accountId`: From step 2
     - `payeeName`: "Starbucks"
     - `categoryId`: Optional (if specified by user)
     - `amount`: -15.00 (negative for expense)
     - `memo`: Optional user note
   - Returns: `transactionId` and confirmation message

4. **Approve the transaction**
   - Call: `approve_transaction`
   - Parameters:
     - `transactionId`: From step 3 response
     - `budgetId`: Same as before
   - Returns: Confirmation of approval

### Example Flow
```
User: "I spent $15 at Starbucks on my checking account"
AI: create_transaction({
  budgetId: "abc123",
  accountId: "checking_id",
  payeeName: "Starbucks",
  amount: -15.00,
  approved: false
})
AI: approve_transaction(transactionId: "xyz789")
AI: "✓ Added and approved $15 Starbucks transaction"
```

---

## Workflow 3: Add Multiple Transactions (Bulk Import)

**User Intent**: "I have 10 credit card charges to add"

### Steps
1. **Gather transaction data** from user
   - Date, amount, payee, category (optional), memo (optional)

2. **Get account ID** (if not cached)
   - Call: `list_accounts`
   - AI Action: Match user's description to account

3. **Create multiple transactions**
   - Call: `create_multiple_transactions`
   - Parameters:
     - `budgetId`: From environment
     - `transactions`: Array of transaction objects
   - Returns: Count of created transactions, any duplicate IDs

4. **Optional: Approve bulk transactions**
   - Call: `get_unapproved_transactions` to see all pending
   - Then either:
     - Approve individually with `approve_transaction`
     - Or ask user for approval

### Example Flow
```
User: "Add these 10 credit card charges"
AI: create_multiple_transactions({
  budgetId: "abc123",
  transactions: [
    { accountId: "cc_id", date: "2026-01-01", amount: -50.00, payeeName: "Amazon" },
    { accountId: "cc_id", date: "2026-01-02", amount: -25.50, payeeName: "Target" },
    ...
  ]
})
AI: "Created 10 transactions. 8 are unapproved, 2 were duplicates."
AI: get_unapproved_transactions()
AI: "Ready to approve these transactions?"
```

---

## Workflow 4: Check Budget Status

**User Intent**: "How much can I spend this month? Which categories are overspent?"

### Steps
1. **Ensure budget ID is set**
   - If not, call `list_budgets`

2. **Get budget summary**
   - Call: `budget_summary`
   - Parameters:
     - `budgetId`: From environment
     - `month`: "current" or ISO date (e.g., "2026-01-01")
   - Returns: Monthly income, budgeted, activity, overspent categories, account balances

3. **Interpret the data**
   - AI Action: Highlight categories with `overspent: true`
   - Show user the `to_be_budgeted` amount (ready to assign)

### Example Flow
```
User: "What's my budget status?"
AI: budget_summary({ budgetId: "abc123", month: "current" })
AI: "This month:
  Ready to Assign: $500
  Overspent Categories: Dining ($45 over), Entertainment ($120 over)
  Low Accounts: Savings account at $50"
```

---

## Workflow 5: Analyze Spending

**User Intent**: "How much did I spend on groceries last month?"

### Decision Tree
- **User wants**: Category breakdown? → Use `analyze_spending_by_category`
- **User wants**: Spending trends over time? → Use `generate_spending_report`
- **User wants**: Specific transaction details? → Use `analyze_transactions`

### Option A: Category Breakdown

**Call**: `analyze_spending_by_category`
- Returns: Total spent per category for the period
- Best for: "Where does my money go?"

```
User: "Show me my spending by category last month"
AI: analyze_spending_by_category({
  budgetId: "abc123",
  start_date: "2025-12-01",
  end_date: "2025-12-31"
})
AI: "Groceries: $450, Dining: $200, Entertainment: $150..."
```

### Option B: Spending Trends

**Call**: `generate_spending_report`
- Returns: Month-by-month income, expenses, net balance
- Best for: "How is my spending trending?"

```
User: "Show me my spending trend over the last 6 months"
AI: generate_spending_report({
  budgetId: "abc123",
  start_date: "2025-07-01",
  end_date: "2025-12-31"
})
AI: "July: +$2000 (income) -$1800 (expenses) = $200 net
      August: +$2000 -$2100 = -$100
      ..."
```

### Option C: Specific Transactions

**Call**: `analyze_transactions`
- Returns: Individual transaction details with filtering
- Best for: "Show me all Starbucks transactions"

```
User: "Show me all my Starbucks charges"
AI: analyze_transactions({
  budgetId: "abc123",
  payee_name: "Starbucks"
})
AI: "Found 12 Starbucks transactions totaling $125.50"
```

---

## Workflow 6: Move Money Between Categories

**User Intent**: "I have $200 extra in Entertainment, move it to Savings"

### Steps
1. **Call**: `move_funds`
   - Parameters:
     - `budgetId`: From environment
     - `fromCategoryId`: Source category ID
     - `toCategoryId`: Destination category ID
     - `amount`: Amount in dollars (e.g., 200.00)
   - Returns: Success confirmation and new category balances

2. **Optional: Verify change**
   - Call: `budget_summary` to see updated balances

### Example Flow
```
User: "Move $200 from Entertainment to Savings category"
AI: move_funds({
  budgetId: "abc123",
  fromCategoryId: "entertainment_id",
  toCategoryId: "savings_id",
  amount: 200.00
})
AI: "✓ Moved $200 from Entertainment to Savings"
AI: "Entertainment new balance: $50, Savings new balance: $1200"
```

---

## Workflow 7: Update a Transaction

**User Intent**: "I need to fix a transaction - wrong amount or category"

### Steps
1. **Find the transaction**
   - If you know the ID: skip to step 3
   - If not, call: `analyze_transactions` with filters
   - Or call: `get_unapproved_transactions` if it's unapproved

2. **Identify what to change**
   - Amount, category, memo, date, cleared status, etc.

3. **Update the transaction**
   - Call: `update_single_transaction`
   - Parameters:
     - `transactionId`: From search results
     - `budgetId`: From environment
     - Only include fields you're changing (other fields preserve original values)
   - Returns: Updated transaction details

4. **Optional: Re-approve if needed**
   - If update changed approval status, call: `approve_transaction`

### Example Flow
```
User: "That transaction should be $25, not $20"
AI: update_single_transaction({
  transactionId: "xyz789",
  budgetId: "abc123",
  amount: -25.00
})
AI: "✓ Updated transaction to $25"
```

---

## Workflow 8: Create a Split Transaction

**User Intent**: "I spent $100 at Target - $60 on groceries, $40 on household items"

### Steps
1. **Ensure you know the account**
   - Call: `list_accounts` if needed

2. **Identify the categories**
   - Groceries category ID and Household category ID

3. **Create split transaction**
   - Call: `create_split_transaction`
   - Parameters:
     - `budgetId`: From environment
     - `accountId`: Target account
     - `payeeName`: "Target"
     - `date`: Transaction date
     - `splits`: Array of category splits with amounts
   - Returns: Created transaction ID and confirmation

### Example Flow
```
User: "I spent $100 at Target: $60 groceries, $40 household"
AI: create_split_transaction({
  budgetId: "abc123",
  accountId: "checking_id",
  payeeName: "Target",
  date: "2026-01-01",
  amount: -100.00,
  splits: [
    { categoryId: "groceries_id", amount: -60.00 },
    { categoryId: "household_id", amount: -40.00 }
  ]
})
AI: "✓ Created split transaction: $60 groceries + $40 household"
```

---

## Workflow 9: Create a Scheduled/Recurring Transaction

**User Intent**: "My rent is $1500 every month on the 1st"

### Steps
1. **Get account ID**
   - Call: `list_accounts` if needed

2. **Create scheduled transaction**
   - Call: `create_scheduled_transaction`
   - Parameters:
     - `budgetId`: From environment
     - `accountId`: Rent payment account
     - `payeeName`: "Landlord"
     - `categoryId`: Rent category (optional)
     - `amount`: -1500.00
     - `nextDate`: Next occurrence date (ISO format)
     - `frequency`: "monthly", "weekly", etc.
   - Returns: Scheduled transaction ID

3. **View scheduled transactions**
   - Call: `list_scheduled_transactions` to confirm setup

### Example Flow
```
User: "Set up my monthly $1500 rent payment on the 1st"
AI: create_scheduled_transaction({
  budgetId: "abc123",
  accountId: "checking_id",
  payeeName: "Landlord",
  amount: -1500.00,
  nextDate: "2026-02-01",
  frequency: "monthly"
})
AI: "✓ Scheduled: $1500 monthly rent starting Feb 1"
```

---

## Workflow 10: Approve Multiple Pending Transactions

**User Intent**: "Approve all my pending credit card transactions"

### Steps
1. **Get unapproved transactions**
   - Call: `get_unapproved_transactions`
   - Returns: Array of unapproved transactions

2. **Review with user**
   - AI Action: Present list for user confirmation

3. **Approve in bulk**
   - Option A: Loop through and call `approve_transaction` for each
   - Option B: Call `update_multiple_transactions` to approve all at once

### Example Flow
```
User: "Approve all my pending transactions"
AI: get_unapproved_transactions({ budgetId: "abc123" })
AI: "Found 5 unapproved transactions: Amazon ($50), Target ($25)..."
User: "Approve all"
AI: [Call approve_transaction for each]
AI: "✓ Approved all 5 transactions"
```

---

## Common Decision Points

### When to use which Create tool?
| Scenario | Tool |
|----------|------|
| Single transaction | `create_transaction` |
| Multiple independent transactions | `create_multiple_transactions` |
| One purchase split across categories | `create_split_transaction` |
| Money transfer between accounts | `create_transfer` |
| Recurring payment setup | `create_scheduled_transaction` |

### When to use which Analysis tool?
| Question | Tool |
|----------|------|
| "Where did my money go?" (by category) | `analyze_spending_by_category` |
| "How is my spending trending?" (over time) | `generate_spending_report` |
| "Show me specific transactions" | `analyze_transactions` |
| "What's my budget status?" | `budget_summary` |

### Error Recovery
If a tool call fails:
1. Check if `budgetId` is missing → call `list_budgets`
2. Check if `accountId` is needed → call `list_accounts`
3. Check if `categoryId` is needed → call `budget_summary`
4. Check if transaction was deleted → call `get_unapproved_transactions` or `analyze_transactions`
5. If token is invalid → user must restart MCP with correct `YNAB_API_TOKEN`

---

## Tips for AI Implementation

1. **Always cache budget ID** after user selects one in workflow 1
2. **Prefer explicit parameters** over environment variables for reliability
3. **Check for required fields** before calling tools (budgetId, accountId, etc.)
4. **Transform amounts correctly**: YNAB uses milliunits internally, but these tools handle conversion
5. **Handle duplicates**: When bulk importing, check `duplicate_import_ids` in response
6. **Confirm destructive actions**: Always ask before calling `delete_transaction` or `delete_scheduled_transaction`
