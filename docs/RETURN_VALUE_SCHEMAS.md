# YNAB MCP Tool Return Value Schemas

This document defines the return value format for each tool. Use this to understand what data you'll receive from tool responses.

## Return Value Categories

Tools return one of three types:
1. **String response** - Simple text message (for diagnostic/confirmation messages)
2. **Structured object** - JSON object with specific fields
3. **Array** - Array of objects

---

## List/Read Tools

### `list_budgets`
**Returns**: Array of budget objects

```typescript
Budget[] = [
  {
    id: string;              // Budget unique identifier
    name: string;            // Budget display name
  },
  ...
]
```

**Example**:
```json
[
  {
    "id": "abc123-def456",
    "name": "Personal Budget"
  },
  {
    "id": "xyz789-uvw012",
    "name": "Family Budget"
  }
]
```

---

### `list_accounts`
**Returns**: Array of account objects

```typescript
Account[] = [
  {
    id: string;              // Account unique identifier
    name: string;            // Account display name (e.g., "Checking", "Savings")
    type: string;            // Account type ("checking", "savings", "creditCard", etc.)
    balance: number;         // Current balance in dollars
  },
  ...
]
```

**Example**:
```json
[
  {
    "id": "acc-checking-123",
    "name": "Chase Checking",
    "type": "checking",
    "balance": 2500.50
  },
  {
    "id": "acc-savings-456",
    "name": "High Yield Savings",
    "type": "savings",
    "balance": 15000.00
  },
  {
    "id": "acc-cc-789",
    "name": "Amex Blue",
    "type": "creditCard",
    "balance": -450.25
  }
]
```

---

### `budget_summary`
**Returns**: Structured object with month and category data

```typescript
BudgetSummary = {
  monthBudget: {
    month: string;           // Month in ISO format (e.g., "2026-01-01")
    income: number;          // Total income for month in dollars
    budgeted: number;        // Total amount budgeted in dollars
    activity: number;        // Total spending/activity in dollars
    to_be_budgeted: number;  // Ready to assign (unbudgeted income) in dollars
    age_of_money: number;    // Age of money value (days)
    note: string | null;     // Month note if set
  };
  accounts: Array<{
    id: string;              // Account ID
    name: string;            // Account name
    type: string;            // Account type
    balance: number;         // Balance in dollars
  }>;
  categories: Array<{
    id: string;              // Category ID
    name: string;            // Category name
    budgeted: number;        // Budgeted amount in dollars
    activity: number;        // Spent amount in dollars
    balance: number;         // Remaining balance (budgeted - activity)
    overspent: boolean;      // True if balance < 0
  }>;
}
```

**Example**:
```json
{
  "monthBudget": {
    "month": "2026-01-01",
    "income": 3500.00,
    "budgeted": 3200.00,
    "activity": 2800.50,
    "to_be_budgeted": 300.00,
    "age_of_money": 45,
    "note": null
  },
  "accounts": [
    {
      "id": "acc-123",
      "name": "Checking",
      "type": "checking",
      "balance": 2500.50
    }
  ],
  "categories": [
    {
      "id": "cat-groceries",
      "name": "Groceries",
      "budgeted": 500.00,
      "activity": -450.00,
      "balance": 50.00,
      "overspent": false
    },
    {
      "id": "cat-dining",
      "name": "Dining Out",
      "budgeted": 200.00,
      "activity": -250.00,
      "balance": -50.00,
      "overspent": true
    }
  ]
}
```

---

### `get_month_detail`
**Returns**: Structured object with detailed category information for a month

```typescript
MonthDetail = {
  month: string;             // Month in ISO format
  income: number;            // Total income in dollars
  budgeted: number;          // Total budgeted in dollars
  activity: number;          // Total activity in dollars
  to_be_budgeted: number;    // Ready to assign in dollars
  categories: Array<{
    id: string;              // Category ID
    name: string;            // Category name
    budgeted: number;        // Budgeted amount in dollars
    activity: number;        // Activity in dollars
    balance: number;         // Remaining balance
    overspent: boolean;      // True if overspent
  }>;
}
```

---

### `get_payees`
**Returns**: Array of payee objects

```typescript
Payee[] = [
  {
    id: string;              // Payee unique identifier
    name: string;            // Payee name (e.g., "Starbucks", "Landlord")
    transfer_account_id?: string; // If payee is transfer, linked account ID
  },
  ...
]
```

**Example**:
```json
[
  {
    "id": "payee-001",
    "name": "Starbucks"
  },
  {
    "id": "payee-002",
    "name": "Amazon"
  },
  {
    "id": "payee-transfer-123",
    "name": "Transfer: Savings Account",
    "transfer_account_id": "acc-savings-456"
  }
]
```

---

### `get_single_payee`
**Returns**: Payee object with recent transaction history

```typescript
PayeeDetail = {
  id: string;                // Payee ID
  name: string;              // Payee name
  transfer_account_id?: string; // If transfer payee
  recent_transactions?: Array<{
    id: string;              // Transaction ID
    date: string;            // Transaction date (ISO format)
    amount: number;          // Amount in dollars
  }>;
}
```

---

### `list_scheduled_transactions`
**Returns**: Array of scheduled transaction objects

```typescript
ScheduledTransaction[] = [
  {
    id: string;              // Scheduled transaction ID
    account_id: string;      // Account ID
    payee_name: string;      // Payee name
    category_name: string;   // Category name
    frequency: string;       // Recurrence ("daily", "weekly", "monthly", etc.)
    amount: number;          // Amount in dollars
    next_date: string;       // Next occurrence date (ISO format)
    memo?: string;           // Optional memo
  },
  ...
]
```

---

## Search/Analysis Tools

### `get_unapproved_transactions`
**Returns**: Object with transactions array and count

```typescript
UnapprovedResponse = {
  transactions: Array<{
    id: string;              // Transaction ID
    date: string;            // Transaction date (ISO format)
    amount: string;          // Amount in dollars (as string, e.g., "-25.50")
    memo: string | null;     // Transaction memo if set
    approved: boolean;       // Always false for this tool
    account_name: string;    // Account name (e.g., "Checking")
    payee_name: string | null; // Payee name if set
    category_name: string | null; // Category name if set
    transfer_account_id?: string; // If transfer
    transfer_transaction_id?: string; // If transfer
    matched_transaction_id?: string; // If matched to import
    import_id?: string;      // If imported
  }>;
  transaction_count: number; // Total unapproved count
}
```

**Example**:
```json
{
  "transactions": [
    {
      "id": "txn-001",
      "date": "2026-01-02",
      "amount": "-6.95",
      "memo": "Coffee",
      "approved": false,
      "account_name": "Checking",
      "payee_name": "Starbucks",
      "category_name": "Dining Out"
    },
    {
      "id": "txn-002",
      "date": "2026-01-02",
      "amount": "-42.50",
      "memo": null,
      "approved": false,
      "account_name": "Checking",
      "payee_name": "Target",
      "category_name": "Groceries"
    }
  ],
  "transaction_count": 2
}
```

---

### `analyze_transactions`
**Returns**: Array of transaction details matching filters

```typescript
Transaction[] = [
  {
    id: string;              // Transaction ID
    date: string;            // Transaction date (ISO format)
    amount: string;          // Amount in dollars
    memo: string | null;     // Memo if set
    payee_name: string | null; // Payee if set
    category_name: string | null; // Category if set
    account_name: string;    // Account name
    approved: boolean;       // Whether approved
    cleared: string;         // Cleared status ("cleared", "uncleared", "reconciled")
    transfer_account_id?: string; // If transfer
    matched_transaction_id?: string; // If matched
    import_id?: string;      // If imported
  },
  ...
]
```

---

### `analyze_spending_by_category`
**Returns**: Object with category spending breakdown

```typescript
SpendingByCategory = {
  period_start: string;      // Start date (ISO format)
  period_end: string;        // End date (ISO format)
  categories: Array<{
    category_id: string;     // Category ID
    category_name: string;   // Category name
    total_spent: number;     // Total spending in dollars (absolute value)
    transaction_count: number; // Number of transactions
  }>;
  total_spending: number;    // Sum of all spending in dollars
}
```

**Example**:
```json
{
  "period_start": "2025-12-01",
  "period_end": "2025-12-31",
  "categories": [
    {
      "category_id": "cat-groceries",
      "category_name": "Groceries",
      "total_spent": 450.00,
      "transaction_count": 8
    },
    {
      "category_id": "cat-dining",
      "category_name": "Dining Out",
      "total_spent": 220.50,
      "transaction_count": 12
    }
  ],
  "total_spending": 670.50
}
```

---

### `generate_spending_report`
**Returns**: Object with month-by-month spending trends

```typescript
SpendingReport = {
  period_start: string;      // Start date
  period_end: string;        // End date
  months: Array<{
    month: string;           // Month in ISO format
    income: number;          // Total income in dollars
    expenses: number;        // Total expenses in dollars (absolute value)
    net_balance: number;     // income - expenses
  }>;
  summary: {
    total_income: number;    // Total income for period
    total_expenses: number;  // Total expenses for period
    average_monthly_income: number;  // Average per month
    average_monthly_expenses: number; // Average per month
  };
}
```

**Example**:
```json
{
  "period_start": "2025-07-01",
  "period_end": "2025-12-31",
  "months": [
    {
      "month": "2025-07-01",
      "income": 3500.00,
      "expenses": 2800.00,
      "net_balance": 700.00
    },
    {
      "month": "2025-08-01",
      "income": 3500.00,
      "expenses": 3100.00,
      "net_balance": 400.00
    }
  ],
  "summary": {
    "total_income": 21000.00,
    "total_expenses": 18200.00,
    "average_monthly_income": 3500.00,
    "average_monthly_expenses": 3033.33
  }
}
```

---

## Create Tools

### `create_transaction`
**Returns**: Success/error message or string confirmation

```typescript
string;
// Example: "Successfully created transaction #abc123"
```

**On success**:
```
"Transaction created successfully"
```

**On error**:
```
"Error creating transaction: [error details]"
```

---

### `create_multiple_transactions`
**Returns**: String summary of batch creation

```typescript
string;
// Example: "Successfully created 8 out of 10 transactions. Transaction IDs: txn-001, txn-002, ... (2 duplicates found)"
```

**On success**:
```
"Successfully created 8 out of 10 transactions. Transaction IDs: txn-001, txn-002, txn-003, txn-004, txn-005, txn-006, txn-007, txn-008 (2 duplicates found)"
```

**On error**:
```
"Error creating multiple transactions for budget abc123: [error details]"
```

---

### `create_split_transaction`
**Returns**: String confirmation or error

```typescript
string;
// Example: "Successfully created split transaction (total $100)"
```

---

### `create_transfer`
**Returns**: String confirmation or error

```typescript
string;
// Example: "Successfully created transfer of $500 from Checking to Savings"
```

---

### `create_scheduled_transaction`
**Returns**: String confirmation or error

```typescript
string;
// Example: "Successfully created scheduled transaction: monthly rent on 2026-02-01"
```

---

## Approval/Update Tools

### `approve_transaction`
**Returns**: Object with success status and transaction details

```typescript
ApprovalResult = {
  success: boolean;          // Whether operation succeeded
  transactionId?: string;    // Transaction ID if success=true
  error?: string;            // Error message if success=false
  message: string;           // Status message (e.g., "Transaction updated successfully")
}
```

**Example success**:
```json
{
  "success": true,
  "transactionId": "txn-001",
  "message": "Transaction updated successfully"
}
```

**Example error**:
```json
{
  "success": false,
  "error": "Transaction not found",
  "message": "An error occurred while approving the transaction."
}
```

---

### `update_single_transaction`
**Returns**: Object with updated transaction or error

```typescript
UpdateResult = {
  success: boolean;          // Whether update succeeded
  transaction?: {            // Updated transaction (if success)
    id: string;
    date: string;
    amount: number;
    payee_name: string | null;
    category_name: string | null;
    memo: string | null;
    approved: boolean;
    cleared: string;
  };
  error?: string;            // Error message (if failed)
}
```

---

### `update_multiple_transactions`
**Returns**: Array of updated transactions or error

```typescript
UpdateMultipleResult = {
  success: boolean;
  updated_count: number;     // Number successfully updated
  transactions?: Array<{     // Array of updated transactions (if success)
    id: string;
    date: string;
    amount: number;
    // ... full transaction details
  }>;
  error?: string;            // Error message (if failed)
}
```

---

### `clear_transaction`
**Returns**: String confirmation or error

```typescript
string;
// Example: "Transaction cleared successfully"
```

---

## Budget Management Tools

### `move_funds`
**Returns**: String confirmation with new balances or error

```typescript
string;
// Example: "Successfully moved $200 from Entertainment to Savings. Entertainment new balance: $50, Savings new balance: $1200"
```

---

### `update_category_budget`
**Returns**: String confirmation with new budget or error

```typescript
string;
// Example: "Category budget updated: Groceries new budget is $500"
```

---

## Delete Tools

### `delete_transaction`
**Returns**: String confirmation or error

```typescript
string;
// Example: "Transaction deleted successfully"
```

---

### `delete_scheduled_transaction`
**Returns**: String confirmation or error

```typescript
string;
// Example: "Scheduled transaction deleted successfully"
```

---

## Diagnostic Tools

### `health_check`
**Returns**: Object with server and API status

```typescript
HealthCheckResult = {
  status: string;            // "healthy" or "error"
  message: string;           // Status message
  server_running: boolean;   // MCP server is running
  api_accessible: boolean;   // YNAB API is reachable
  authenticated: boolean;    // API token is valid
  timestamp: string;         // ISO timestamp
}
```

**Example**:
```json
{
  "status": "healthy",
  "message": "MCP server is running and YNAB API is accessible",
  "server_running": true,
  "api_accessible": true,
  "authenticated": true,
  "timestamp": "2026-01-02T01:25:00Z"
}
```

---

## Error Responses

All tools return errors in one of these formats:

### Format 1: String Error
```typescript
"Error creating transaction: API returned 401 Unauthorized"
```

### Format 2: Object with Error Field
```typescript
{
  "success": false,
  "error": "Budget ID not found",
  "message": "An error occurred while approving the transaction."
}
```

### Format 3: Structured Error (Diagnostic)
```typescript
"No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the ListBudgets tool to get a list of available budgets."
```

---

## Amount Formats

### Currency Handling
- **Input**: Dollars with up to 2 decimal places (e.g., `25.99`, `-100.00`)
- **Output**: Varies by tool
  - `get_unapproved_transactions`: Returns as string (e.g., `"-6.95"`)
  - `analyze_transactions`: Returns as string
  - `budget_summary`: Returns as number (e.g., `450.50`)
  - Amounts are always in dollars, NOT milliunits

### Sign Convention
- **Expenses**: Negative (e.g., `-25.99` for a $25.99 purchase)
- **Income**: Positive (e.g., `3500.00` for $3500 income)
- **Balance**: Can be positive (money available) or negative (overspent/credit card debt)

---

## Null/Optional Fields

Some fields are optional and may be `null`:
- `payee_name`: Null if transaction has no payee
- `category_name`: Null for transfer transactions
- `memo`: Null if no memo was set
- `note`: Null if no month note was set
- `transfer_account_id`: Only present for transfer transactions
- `matched_transaction_id`: Only present for matched transactions

---

## Caching Notes

Some tools cache results:
- `list_budgets`: Cached 5 minutes
- `budget_summary`: Cached 5 minutes per budget/month
- Results cached to reduce API calls
- To get fresh data: Call the tool again (cache is checked automatically)
