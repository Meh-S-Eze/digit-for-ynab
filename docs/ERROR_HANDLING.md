# YNAB MCP Error Handling Guide

This document provides guidance on how to handle errors when using the YNAB MCP tools. It covers common error patterns, their causes, and recovery strategies.

## Error Categories

Errors from YNAB MCP tools fall into these categories:

1. **Configuration Errors** - Missing or invalid setup (API token, budget ID)
2. **Not Found Errors** - Resource doesn't exist (invalid ID, deleted item)
3. **Validation Errors** - Invalid input parameters
4. **API Errors** - YNAB API returned an error
5. **Network Errors** - Connectivity issues

---

## Configuration Errors

### Error: "YNAB API Token is not set"

**Cause**: The `YNAB_API_TOKEN` environment variable is missing or empty.

**What happened**: The tool tried to authenticate with YNAB but no API token was provided.

**Recovery Steps**:
1. **Verify token exists**: Check that `YNAB_API_TOKEN` environment variable is set
2. **Get a token**: If missing, go to https://api.ynab.com/#personal-access-tokens
3. **Set the environment variable**:
   - Linux/macOS: `export YNAB_API_TOKEN="your-token-here"`
   - Windows: `set YNAB_API_TOKEN=your-token-here`
4. **Restart the MCP server** with the token set
5. **Retry the operation**

**Prevention**: 
- Always set `YNAB_API_TOKEN` before starting the MCP server
- Use a startup script that verifies the token is set
- Store token in a `.env` file (do not commit to git)

---

### Error: "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable."

**Cause**: The tool needs a `budgetId` but none was provided in the parameters or environment.

**What happened**: You tried to use a tool without specifying which budget to work with.

**Recovery Steps**:
1. **Call `list_budgets`** to get all available budgets
   ```
   Call: list_budgets()
   Returns: Array of {id, name} pairs
   ```
2. **Select a budget** from the list (user confirms choice)
3. **Set the environment variable** (optional, for convenience):
   - `export YNAB_BUDGET_ID="budget-id-from-step-1"`
   - OR pass `budgetId` parameter to every tool call
4. **Retry the operation** with the budget ID

**Prevention**:
- Always call `list_budgets` first if you don't have a budget ID
- Ask user to select a budget and remember it for the session
- Set `YNAB_BUDGET_ID` environment variable for convenience

**Implementation Pattern**:
```javascript
if (!budgetId && !process.env.YNAB_BUDGET_ID) {
  const budgets = await call('list_budgets');
  // Prompt user to select budget
  budgetId = userSelectedBudgetId; // From list above
}
```

---

## Not Found Errors

### Error: "Budget ID not found" or "Budget not found"

**Cause**: The `budgetId` you provided doesn't exist or has been deleted.

**What happened**: YNAB API returned a 404 error for the budget.

**Recovery Steps**:
1. **List all budgets**:
   ```
   Call: list_budgets()
   ```
2. **Verify the budget exists** in the returned list
3. **Check the budget ID** - Did you type it correctly? Copy/paste from the list
4. **If budget was deleted**: User must select a different budget from the list
5. **Retry with the correct budget ID**

**When to display to user**:
- "I couldn't find the budget '{budgetId}'. Available budgets are: [list]"
- Ask user to select from the list

---

### Error: "Account ID not found" or "Account not found"

**Cause**: The `accountId` you provided doesn't exist in the budget.

**What happened**: You're trying to create a transaction in an account that doesn't exist.

**Recovery Steps**:
1. **List accounts in the budget**:
   ```
   Call: list_accounts(budgetId: "correct-budget-id")
   ```
2. **Find the account** user intended (check names: "Checking", "Savings", etc.)
3. **Extract the correct ID** from the list
4. **Retry with correct accountId**

**When to display to user**:
- "I couldn't find the '{accountName}' account. Available accounts are: [list with names]"
- Ask user to confirm which account to use

**Prevention**:
- Always call `list_accounts` before creating transactions
- Display account names to user and confirm selection
- Never hardcode account IDs

---

### Error: "Transaction not found"

**Cause**: The `transactionId` doesn't exist or has been deleted.

**What happened**: You're trying to approve/update/delete a transaction that doesn't exist.

**Recovery Steps**:
1. **Search for the transaction**:
   ```
   If approving: Call: get_unapproved_transactions(budgetId)
   If updating/deleting: Call: analyze_transactions(budgetId, filters)
   ```
2. **Find the correct transaction** from results
3. **Get the transaction ID** from the search results
4. **Retry with the correct transactionId**

**When to display to user**:
- If approving: "I couldn't find that unapproved transaction. Here are your pending transactions: [list]"
- If updating: "I need to find that transaction first. Can you describe it? (amount, payee, date)"

---

### Error: "Category not found" or "Category ID not found"

**Cause**: The `categoryId` doesn't exist or is invalid.

**What happened**: You're trying to assign a transaction to a category that doesn't exist.

**Recovery Steps**:
1. **Get available categories**:
   ```
   Call: budget_summary(budgetId, month: "current")
   Returns: List of categories with IDs
   ```
2. **Find the correct category** (e.g., "Groceries", "Dining", "Utilities")
3. **Use the correct categoryId** from the list
4. **Retry with correct categoryId**

**When to display to user**:
- "I couldn't find that category. Available categories are: [list]"
- Ask user to pick from the list

**Prevention**:
- Always call `budget_summary` before creating transactions with specific categories
- Display category names and let user select
- Provide category suggestions based on payee name

---

### Error: "Payee not found" (if using payeeId)

**Cause**: The `payeeId` doesn't exist in the budget.

**What happened**: You specified a payeeId that isn't valid.

**Recovery Steps**:
1. **List payees**:
   ```
   Call: get_payees(budgetId)
   ```
2. **Find the correct payee** from the list
3. **Use correct payeeId**
4. **OR use payeeName instead** (easier - YNAB creates if not exists):
   ```
   create_transaction(
     accountId: "...",
     payeeName: "Starbucks",  // Just use the name
     // Don't provide payeeId
   )
   ```

**Prevention**:
- Prefer `payeeName` over `payeeId` (simpler for AI)
- Only use `payeeId` if you have it from `get_payees`
- If payee doesn't exist, YNAB creates it automatically with `payeeName`

---

## Validation Errors

### Error: "Transactions array is required and must not be empty"

**Cause**: Called `create_multiple_transactions` with an empty or missing transactions array.

**What happened**: Tried to bulk-create transactions but provided no transactions.

**Recovery Steps**:
1. **Verify you have transactions to create**
2. **Format the array correctly**:
   ```javascript
   transactions: [
     {
       accountId: "...",
       date: "2026-01-02",
       amount: -25.50,
       payeeName: "Starbucks"
     },
     // ... more transactions
   ]
   ```
3. **Ensure array has at least 1 transaction**
4. **Retry**

**When to display to user**:
- "No transactions to create. Please provide at least one transaction."

---

### Error: "Invalid date format"

**Cause**: Date parameter is not in ISO 8601 format (YYYY-MM-DD).

**What happened**: You provided a date like "January 2, 2026" instead of "2026-01-02".

**Recovery Steps**:
1. **Convert date to ISO format**: YYYY-MM-DD
   - January 2, 2026 → "2026-01-02"
   - 1/2/26 → "2026-01-02"
   - 2 Jan 2026 → "2026-01-02"
2. **Verify the format** matches YYYY-MM-DD
3. **Retry with correct format**

**When to display to user**:
- "Please provide the date in YYYY-MM-DD format (e.g., 2026-01-02 for January 2, 2026)"

**Prevention**:
- Always parse user dates to ISO format before calling tools
- Validate format matches /^\d{4}-\d{2}-\d{2}$/
- Use a date parsing library

---

### Error: "Amount is invalid" or "Amount must be a number"

**Cause**: The `amount` parameter is not a valid number.

**What happened**: You provided amount as a string "25.50" or invalid like "$25.50".

**Recovery Steps**:
1. **Clean the amount** - remove currency symbols and commas
   - "$25.50" → 25.50
   - "1,000.00" → 1000.00
2. **Convert to number**: `parseFloat(amount)`
3. **Verify sign is correct**:
   - Expenses: negative (e.g., -25.50)
   - Income: positive (e.g., 1000.00)
4. **Retry with numeric amount**

**Prevention**:
- Always parse amounts to numbers before sending to tools
- Use `parseFloat()` and validate with `Number.isFinite()`
- Be clear about sign convention: negative for expenses, positive for income

---

## API Errors

### Error: "401 Unauthorized"

**Cause**: API token is invalid, expired, or has insufficient permissions.

**What happened**: YNAB rejected the API token.

**Recovery Steps**:
1. **Verify the token is correct**
   - Copy/paste from https://api.ynab.com/#personal-access-tokens
   - Ensure no extra spaces or characters
2. **Check if token expired**
   - Go to https://app.ynab.com/settings/developer
   - Generate a new token if expired
3. **Set the new token**:
   - `export YNAB_API_TOKEN="new-token"`
4. **Restart the MCP server**
5. **Retry the operation**

**When to display to user**:
- "I'm having trouble authenticating with YNAB. Please check that your API token is valid."
- "Would you like to refresh your API token?"

---

### Error: "429 Too Many Requests"

**Cause**: Rate limit exceeded - too many API calls in a short time.

**What happened**: YNAB rate-limited the request (typically 120 requests per hour per token).

**Recovery Steps**:
1. **Wait**: YNAB rate limits reset every hour
2. **Back off**: Implement exponential backoff for retries
3. **Use caching**: Some tools cache results (list_budgets, budget_summary)
4. **Optimize**: Avoid redundant calls
5. **Retry after delay** (e.g., wait 60 seconds, then retry)

**Prevention**:
- Cache results from read operations
- Don't call `list_budgets` repeatedly - cache the result
- Don't call `budget_summary` multiple times - cache per budget/month
- Batch operations when possible (use `create_multiple_transactions`)

---

### Error: "500 Internal Server Error"

**Cause**: YNAB API is having issues (not a problem with your request).

**What happened**: YNAB server encountered an error.

**Recovery Steps**:
1. **Wait a few seconds**
2. **Retry the same operation**
3. **If still failing**:
   - Check https://status.ynab.com for service issues
   - Wait for YNAB to recover
   - Inform user: "YNAB servers are temporarily unavailable. Please try again later."
4. **Don't retry aggressively** - this could make things worse

**Prevention**:
- Implement exponential backoff for retries
- Don't retry more than 3-5 times
- Surface error to user after a few failed attempts

---

## Network Errors

### Error: "Network timeout" or "Connection refused"

**Cause**: Can't reach YNAB API (network issue or server down).

**What happened**: The HTTP request to YNAB didn't complete.

**Recovery Steps**:
1. **Check network connectivity** - Can you reach https://api.ynab.com?
2. **Check YNAB status** - https://status.ynab.com
3. **Retry with backoff**:
   ```javascript
   async function retryWithBackoff(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await sleep(1000 * Math.pow(2, i)); // Exponential backoff
       }
     }
   }
   ```
4. **Inform user** of the issue if retries fail

**When to display to user**:
- "I'm having trouble connecting to YNAB. Please check your internet connection."
- "YNAB servers appear to be unavailable. Please try again in a moment."

---

## Special Cases

### Duplicate Import IDs

**Scenario**: Called `create_multiple_transactions` and got "duplicates_found"

**What happened**: Some of the transactions you tried to import already exist (same import_id).

**Recovery Steps**:
1. **Check the response** for `duplicate_import_ids`
2. **This is informational**, not an error - successful transactions were created
3. **Duplicate transactions were skipped** - no action needed
4. **If you need to import them**: Remove the import_id or use a different one

**Example**:
```javascript
// Got response: "Created 8 out of 10, 2 duplicates"
// This means:
// - 8 transactions were successfully created
// - 2 were skipped because they already existed
// - No error occurred
```

---

### Split Transaction Validation

**Error**: "Split amounts don't match total"

**Cause**: When creating a split transaction, the sum of split amounts doesn't equal the total.

**Example**:
```javascript
// Wrong:
create_split_transaction({
  amount: -100.00,  // Total
  splits: [
    { categoryId: "...", amount: -60.00 },
    { categoryId: "...", amount: -30.00 }  // Only 90 total
  ]
})
```

**Recovery**:
1. **Verify the math**: Split amounts must sum to total amount
2. **Adjust splits** to add up correctly
3. **Retry**:
   ```javascript
   splits: [
     { categoryId: "...", amount: -60.00 },
     { categoryId: "...", amount: -40.00 }  // Now 100 total
   ]
   ```

---

## General Error Handling Strategy

### For AI Implementations

1. **Always provide budgetId**
   ```javascript
   // Defensive check
   if (!budgetId && !process.env.YNAB_BUDGET_ID) {
     const budgets = await call('list_budgets');
     // Handle budget selection with user
   }
   ```

2. **Validate IDs before operations**
   ```javascript
   // Before creating transaction, verify account exists
   const accounts = await call('list_accounts', { budgetId });
   if (!accounts.find(a => a.id === accountId)) {
     // Handle: account not found
   }
   ```

3. **Implement retry logic**
   ```javascript
   async function retryOnTransientError(fn, maxRetries = 3) {
     const transientErrors = ['timeout', 'network', '429', '500', '503'];
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (!transientErrors.some(e => error.message.includes(e))) throw error;
         if (i === maxRetries - 1) throw error;
         await sleep(Math.pow(2, i) * 1000);
       }
     }
   }
   ```

4. **Cache read operations**
   ```javascript
   // Don't call list_budgets repeatedly
   const budgets = cache.get('budgets') || await call('list_budgets');
   cache.set('budgets', budgets, { ttl: 5 * 60 * 1000 });
   ```

5. **Always confirm destructive operations**
   ```javascript
   // Before deleting
   if (operation === 'delete') {
     const confirmed = await askUser(`Delete transaction? This cannot be undone.`);
     if (!confirmed) return;
   }
   ```

---

## Error Messages for Users

### Helpful vs Unhelpful

❌ **Unhelpful**: 
```
Error: 404 Not Found
```

✅ **Helpful**:
```
I couldn't find that budget. Your available budgets are:
  1. Personal Budget
  2. Family Budget

Which would you like to use?
```

---

## Debugging Checklist

When a tool call fails:

- [ ] Is `YNAB_API_TOKEN` set?
- [ ] Is `budgetId` valid? (Call `list_budgets` to verify)
- [ ] Is `accountId` valid? (Call `list_accounts` to verify)
- [ ] Is `transactionId` valid? (Call `get_unapproved_transactions` or `analyze_transactions`)
- [ ] Is the date in ISO format (YYYY-MM-DD)?
- [ ] Is the amount a valid number?
- [ ] Are required fields provided?
- [ ] Can you reach api.ynab.com (network/firewall issue)?
- [ ] Check https://status.ynab.com for API outages
- [ ] Have you hit the rate limit (120 requests/hour)?
- [ ] Are split amounts summing to total?

---

## Support Resources

- **YNAB API Documentation**: https://api.ynab.com/
- **YNAB Status Page**: https://status.ynab.com/
- **Personal Access Token Setup**: https://app.ynab.com/settings/developer
- **YNAB Help Center**: https://support.ynab.com/
