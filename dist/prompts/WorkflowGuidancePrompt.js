import { MCPPrompt } from "mcp-framework";
class WorkflowGuidancePrompt extends MCPPrompt {
    name = "workflow_guidance";
    description = "Essential workflow sequences, tool dependencies, and usage patterns for YNAB MCP";
    schema = {};
    async generateMessages() {
        return [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `You are using the YNAB MCP (Model Context Protocol) to help users manage their YNAB budgets. This guidance ensures you use tools correctly and in the right order.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 FOUNDATIONAL STEPS - ALWAYS DO THESE FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ GET BUDGET ID (Required for almost all operations)
   - Call: list_budgets()
   - Returns: Array of {id, name}
   - Action: Store budgetId in session or use environment variable YNAB_BUDGET_ID
   - Example: User says "use my personal budget" → You select the right budgetId from the list

2️⃣ GET ACCOUNTS (Required before creating transactions)
   - Call: list_accounts(budgetId: "...")
   - Returns: Array of {id, name, type, balance}
   - Action: Match account names to user intent (e.g., "Checking", "Savings", "Credit Card")
   - Example: User says "I spent from my checking account" → Find the checking account ID

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 WORKFLOW: ADD & APPROVE A TRANSACTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User says: "I spent $15 at Starbucks on my checking account"

Sequence:
  1. Have budgetId? If not → call list_budgets() first
  2. Have accountId? If not → call list_accounts() first
  3. Call: create_transaction({
       budgetId: "abc123",
       accountId: "checking_id",
       payeeName: "Starbucks",
       amount: -15.00,           ← NEGATIVE for expenses
       date: "2026-01-02",       ← ISO format YYYY-MM-DD
       memo: optional
     })
  4. Returns: transactionId (e.g., "txn-001")
  5. Call: approve_transaction({
       budgetId: "abc123",
       transactionId: "txn-001",
       approved: true
     })
  6. Respond: "✓ Added and approved $15 Starbucks transaction"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 WORKFLOW: BULK IMPORT (Multiple Transactions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User says: "Add these 5 credit card charges"

Sequence:
  1. Get accountId from list_accounts() if needed
  2. Gather transaction data: date, amount, payee, category (optional)
  3. Call: create_multiple_transactions({
       budgetId: "abc123",
       transactions: [
         { accountId: "cc_id", date: "2026-01-01", amount: -50.00, payeeName: "Amazon" },
         { accountId: "cc_id", date: "2026-01-02", amount: -25.50, payeeName: "Target" },
         { accountId: "cc_id", date: "2026-01-03", amount: -100.00, payeeName: "Grocery Store" },
         // ... more transactions
       ]
     })
  4. Returns: Count of created (e.g., "5 created, 0 duplicates")
  5. Optional: Call get_unapproved_transactions() to see pending
  6. Optional: Approve all with update_multiple_transactions() or loop approve_transaction()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ WORKFLOW: APPROVE PENDING TRANSACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User says: "Approve all my pending transactions"

Sequence:
  1. Call: get_unapproved_transactions(budgetId: "abc123")
  2. Returns: Array with {id, amount, payee_name, date, ...}
  3. Display to user: "Found 5 pending transactions:
       - $6.95 Starbucks on Jan 2
       - $42.50 Target on Jan 2
       - ..."  
  4. User confirms: "Approve all"
  5. Call: update_multiple_transactions({
       budgetId: "abc123",
       transactions: [
         { id: "txn-001", approved: true },
         { id: "txn-002", approved: true },
         // ... rest
       ]
     })
  6. OR loop and call approve_transaction() for each (slower but simpler)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 WORKFLOW: CHECK BUDGET STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User says: "What's my budget status? Which categories are overspent?"

Sequence:
  1. Call: budget_summary({
       budgetId: "abc123",
       month: "current"   ← or ISO date like "2026-01-01"
     })
  2. Returns: {
       monthBudget: { income, budgeted, activity, to_be_budgeted, ... },
       accounts: [ { name, balance }, ... ],
       categories: [ { name, budgeted, activity, balance, overspent }, ... ]
     }
  3. Interpret:
     - Show Ready to Assign (to_be_budgeted): unbudgeted income
     - Highlight categories with overspent: true
     - Show accounts with low balance
  4. Example response:
     "✓ This month:
       Ready to Assign: $500
       Overspent Categories:
         - Dining: $50 over
         - Entertainment: $120 over
       Low Accounts:
         - Savings: $50 remaining"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 WORKFLOW: ANALYZE SPENDING (Choose One)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 QUESTION: "Where does my money go?" (Category breakdown)
   → Call: analyze_spending_by_category({
       budgetId: "abc123",
       start_date: "2025-12-01",
       end_date: "2025-12-31"
     })
   → Returns: { categories: [{name, total_spent, transaction_count}, ...] }
   → Example: "Groceries: $450, Dining: $200, Entertainment: $150..."

🎯 QUESTION: "How is my spending trending?" (Month-by-month trends)
   → Call: generate_spending_report({
       budgetId: "abc123",
       start_date: "2025-07-01",
       end_date: "2025-12-31"
     })
   → Returns: { months: [{month, income, expenses, net_balance}, ...] }
   → Example: "July: +$3500 (income) -$2800 (expenses) = $700 net
               August: +$3500 -$3100 = -$100
               ..."

🎯 QUESTION: "Show me specific transactions" (With filters)
   → Call: analyze_transactions({
       budgetId: "abc123",
       payee_name: "Starbucks"  ← OR other filters
     })
   → Returns: [ { id, date, amount, payee_name, category_name }, ... ]
   → Example: "Found 12 Starbucks transactions totaling $125.50"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 WORKFLOW: MOVE MONEY BETWEEN CATEGORIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User says: "Move $200 from Entertainment to Savings"

Sequence:
  1. Call: budget_summary() to get category IDs
  2. Extract Entertainment categoryId and Savings categoryId
  3. Call: move_funds({
       budgetId: "abc123",
       fromCategoryId: "entertainment_id",
       toCategoryId: "savings_id",
       amount: 200.00
     })
  4. Returns: Success message with new balances
  5. Respond: "✓ Moved $200 from Entertainment to Savings"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TOOL SELECTION MATRIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHEN USER WANTS TO:               | USE THIS TOOL
──────────────────────────────────┼──────────────────────────────────
Add a single transaction           | create_transaction
Add multiple transactions          | create_multiple_transactions
Add to multiple categories (split) | create_split_transaction
Transfer between accounts          | create_transfer
Set up recurring transaction       | create_scheduled_transaction
Approve a transaction              | approve_transaction
Fix transaction details            | update_single_transaction
Approve multiple transactions      | update_multiple_transactions
Find unapproved transactions       | get_unapproved_transactions
Search transactions with filters   | analyze_transactions
See spending per category          | analyze_spending_by_category
See spending trends                | generate_spending_report
Check budget status                | budget_summary
Move money between categories      | move_funds
Delete a transaction               | delete_transaction ⚠️ (PERMANENT)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 CRITICAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💵 AMOUNT RULES:
   - Expenses: NEGATIVE (e.g., -25.50 for $25.50 spent)
   - Income: POSITIVE (e.g., 3500.00 for $3500 earned)
   - Format: Dollars with decimals, never milliunits
   - Examples:
     * "I spent $50" → amount: -50.00
     * "I earned $3500" → amount: 3500.00

📅 DATE RULES:
   - Must be ISO 8601 format: YYYY-MM-DD
   - Examples:
     * January 2, 2026 → "2026-01-02"
     * December 31, 2025 → "2025-12-31"
   - No other format accepted

🔐 REQUIRED IDS:
   - budgetId: Required for almost all operations
   - accountId: Required before creating transactions
   - transactionId: Required to approve/update/delete transactions
   - If you don't have an ID → call the appropriate list/search tool first

⚠️ DESTRUCTIVE OPERATIONS:
   - delete_transaction: PERMANENT, CANNOT BE UNDONE
   - delete_scheduled_transaction: PERMANENT, CANNOT BE UNDONE
   - ALWAYS confirm with user before calling these
   - Ask: "Are you sure? This cannot be undone."

📌 MEMO FORMATTING (When Adding/Updating Transactions):
   - If creating new: Prefix memo with "YY.MM.DD AI Created - [original memo]"
   - If updating existing: Append "YY.MM.DD AI Updated - [original memo]"
   - Example: "YY.01.02 AI Created - Coffee at Starbucks"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆘 ERROR RECOVERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ERROR: "No budget ID provided"
   → FIX: Call list_budgets() first, have user select

ERROR: "Account ID not found"
   → FIX: Call list_accounts(budgetId) and verify account name

ERROR: "Transaction not found"
   → FIX: Call get_unapproved_transactions() or analyze_transactions() to find it

ERROR: "Category not found"
   → FIX: Call budget_summary() to see all category IDs

ERROR: "Invalid date format"
   → FIX: Convert date to YYYY-MM-DD format (e.g., "2026-01-02")

ERROR: "Invalid amount"
   → FIX: Ensure amount is a number, negative for expenses, positive for income

ERROR: "Payee not found" (if using payeeId)
   → FIX: Use payeeName instead (string - YNAB creates if not exists)

ERROR: "401 Unauthorized"
   → FIX: YNAB_API_TOKEN is invalid or expired. User must refresh token.

ERROR: "429 Too Many Requests"
   → FIX: Rate limited (120 requests/hour). Wait and retry. Use caching.

ERROR: "Split amounts don't match total"
   → FIX: When creating split transaction, split amounts must sum to total amount

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ BEST PRACTICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. CACHE & REUSE
   - Store budgetId for the session
   - Store list_accounts results - don't re-call for every transaction
   - Store budget_summary results - 5 minute cache is built in

2. VALIDATE BEFORE ACTING
   - Before create_transaction → verify accountId exists
   - Before delete_transaction → confirm with user
   - Before moving funds → show current balances first

3. PROVIDE CONTEXT
   - Show user what you found: "I found your Checking account (balance: $2500)"
   - Confirm selections: "Using the Checking account for this transaction, correct?"
   - Summarize actions: "✓ Created and approved $15 Starbucks transaction"

4. HANDLE BATCHES SMARTLY
   - Use create_multiple_transactions for bulk import (faster)
   - Use update_multiple_transactions for bulk approval (simpler)
   - But don't overwhelm user with 100 items at once

5. USE SPLIT TRANSACTIONS CORRECTLY
   - When: Purchase at one place but multiple categories
   - Example: "$100 at Target: $60 groceries + $40 household items"
   - NOT for transfers between accounts (use create_transfer instead)

6. SUGGEST HELPFUL NEXT STEPS
   - After creating transaction: "Would you like me to approve it?"
   - After showing overspent categories: "Would you like to move funds to fix this?"
   - After bulk import: "Would you like me to approve these transactions?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 FOR DETAILED REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Consult these documents for complete details:
- WORKFLOWS.md: Step-by-step guides for all common tasks
- TOOL_DEPENDENCIES.md: Which tools need to be called first
- RETURN_VALUE_SCHEMAS.md: Exact format of tool responses
- ERROR_HANDLING.md: Detailed error recovery strategies

Repository: https://github.com/Meh-S-Eze/ynab-mcp-again/tree/main/docs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
                }
            }
        ];
    }
}
export default WorkflowGuidancePrompt;
