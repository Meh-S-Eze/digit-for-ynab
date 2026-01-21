# 🚀 Claude Desktop Quick Start - YNAB MCP

**If you're Claude (or another AI using this MCP), read this first.**

---

## ⚡ The Golden Rule

**Always call `list_budgets()` first if you don't have a `budgetId`.** Then store it for the session.

---

## 🔧 First Time Setup

### Step 1: Get a Budget ID
```
Call: list_budgets()
Returns: { budgets: [{id: "abc123", name: "My Budget"}, ...] }
Store: budgetId = "abc123" (or get from YNAB_BUDGET_ID env var)
```

### Step 2: Get Account IDs (if creating transactions)
```
Call: list_accounts(budgetId: "abc123")
Returns: { accounts: [{id: "acc1", name: "Checking", balance: 5000}, ...] }
Store: accountId = "acc1" (you'll need this for create_transaction)
```

### Step 3: You're Ready!
Now you can create transactions, approve them, analyze spending, move funds, etc.

---

## 📋 Common Task Checklist

| Task | Call This Tool(s) | Notes |
|------|-------------------|-------|
| **Check budget status** | `budget_summary` | High-level view: income, budgeted, activity, overspending |
| **See pending transactions** | `get_unapproved_transactions` | Then use `approve_transaction` to approve them |
| **Add 1 transaction** | `create_transaction` (NOT create_multiple) | For a single charge (e.g., \"I spent $25 at Starbucks\") |
| **Add multiple transactions** | `create_multiple_transactions` | For bulk import / CSV of transactions |
| **Approve 1 transaction** | `approve_transaction` | Mark a single transaction as finalized |
| **Where does money go?** | `analyze_spending_by_category` | Spending breakdown by category |
| **Spending trends** | `generate_spending_report` | Month-by-month trends |
| **Find specific transactions** | `analyze_transactions` | Filter by payee, date range, amount, etc. |
| **Move money between categories** | `move_funds` | Rebudget available funds (same budget, different categories) |
| **Split a transaction** | `create_split_transaction` | One purchase, multiple categories (e.g., $100 at Target = $60 groceries + $40 household) |

---

## 💰 Critical Amount Rules

| Situation | Format |
|-----------|--------|
| **User spends $25** | amount: **-25.00** (NEGATIVE) |
| **User earns $3500** | amount: **3500.00** (POSITIVE) |
| **User transfers between accounts** | Use `create_transfer`, NOT negative amount |

**Never use:**
- Milliunits (1000 = $1.00) — always use dollars
- Scientific notation
- Comma separators

---

## 📅 Critical Date Rules

| Format | Example | ✅ Correct |
|--------|---------|-----------|
| ISO 8601 | "2026-01-02" | ✅ Yes |
| US MM/DD/YYYY | "01/02/2026" | ❌ No |
| Month string | "January" | ❌ No |
| Word format | "today" | ❌ No |

**Always use:** `YYYY-MM-DD`

---

## ⚠️ Dangerous Operations (Need User Confirmation)

These are **PERMANENT** and cannot be undone:

- `delete_transaction` — Removes the transaction entirely
- `delete_scheduled_transaction` — Removes a recurring transaction

**Before calling:** Always ask the user "Are you sure? This cannot be undone."

---

## 🔄 Tool Relationships (Which to Call After Which)

```
list_budgets()
    ↓
list_accounts()  (if creating transactions)
    ↓
create_transaction() or create_multiple_transactions()
    ↓
approve_transaction() or get_unapproved_transactions()

---

budget_summary()  ← Use directly (no prerequisites)
    ↓
If overspent: move_funds()

---

analyze_spending_by_category() ← Use directly (no prerequisites)
analyze_transactions()          ← Use directly (no prerequisites)
generate_spending_report()      ← Use directly (no prerequisites)
```

---

## 🆘 Error Recovery

| Error | Fix |
|-------|-----|
| "No budget ID provided" | Call `list_budgets()` first |
| "Account ID not found" | Call `list_accounts()` and match the account name |
| "Transaction not found" | Call `get_unapproved_transactions()` or `analyze_transactions()` to find it |
| "Category not found" | Call `budget_summary()` to see all categories and their IDs |
| "Invalid date format" | Convert to YYYY-MM-DD (e.g., "2026-01-02") |
| "Invalid amount" | Use negative for expenses (-25.50), positive for income (3500.00) |
| "401 Unauthorized" | YNAB_API_TOKEN is invalid/expired. Get a new one from https://app.ynab.com/settings/developer |
| "429 Too Many Requests" | Rate limited (120/hour). Wait and retry. Use caching when possible. |

---

## 🎯 Real-World Workflows

### Workflow 1: User wants to add & approve a transaction
```
User: "I spent $15 at Starbucks from my checking account"

1. Do you have budgetId?
   ├─ No? → list_budgets(), store budgetId
   └─ Yes? → Go to step 2

2. Do you have the checking account ID?
   ├─ No? → list_accounts(budgetId), find "Checking"
   └─ Yes? → Go to step 3

3. create_transaction({
     budgetId: "...",
     accountId: "...",
     date: "2026-01-02",
     amount: -15.00,
     payeeName: "Starbucks"
   })

4. approve_transaction({
     budgetId: "...",
     transactionId: "..." (from step 3)
   })

5. Respond: "✓ Added and approved $15 Starbucks transaction"
```

### Workflow 2: User asks "What's my budget status?"
```
User: "What's my budget status for January?"

1. budget_summary({
     budgetId: "...",
     month: "2026-01-01"
   })

2. Parse the response:
   - to_be_budgeted: unbudgeted income
   - Find any categories with overspent: true
   - List low-balance accounts

3. Respond with a human-friendly summary
```

### Workflow 3: Bulk transaction import
```
User: "Add these 10 credit card charges from my statement"

1. list_accounts() to get accountId
2. Prepare transaction array with date, amount, payeeName, etc.
3. create_multiple_transactions({
     budgetId: "...",
     transactions: [...]
   })
4. Optionally: get_unapproved_transactions() to show what was created
5. Optionally: Ask user if they want to approve all
```

---

## 📚 Full Documentation

For detailed information, see:
- `docs/WORKFLOWS.md` — Step-by-step guides for common tasks
- `docs/TOOL_DEPENDENCIES.md` — Which tools depend on which
- `docs/RETURN_VALUE_SCHEMAS.md` — Exact structure of tool returns
- `docs/ERROR_HANDLING.md` — Detailed error recovery strategies

---

## ✅ You're Good to Go!

You now know:
1. ✅ Always call `list_budgets()` first
2. ✅ Always call `list_accounts()` before creating transactions
3. ✅ Use negative amounts for expenses, positive for income
4. ✅ Use YYYY-MM-DD format for dates
5. ✅ Confirm before calling destructive operations
6. ✅ Which tools to call in what order

**Start using the YNAB MCP with confidence!** 🎉
