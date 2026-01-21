import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import CreateSplitTransactionTool from '../CreateSplitTransactionTool';
import * as ynab from 'ynab';
import * as fs from 'fs';
import * as path from 'path';
// Manually load .env if needed
const envPath = path.resolve(process.cwd(), '.env');
console.log("Looking for .env at:", envPath);
if (fs.existsSync(envPath)) {
    console.log("Found .env file");
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}
describe('CreateSplitTransactionTool Live Integration', () => {
    let tool;
    let api;
    let budgetId;
    let accountId;
    let categoryId1;
    let categoryId2;
    let createdTransactionId;
    beforeAll(async () => {
        if (!process.env.YNAB_API_TOKEN) {
            console.warn("YNAB_API_TOKEN not found in environment or .env file. Skipping live tests.");
            return;
        }
        api = new ynab.API(process.env.YNAB_API_TOKEN);
        try {
            const budgetsResponse = await api.budgets.getBudgets();
            const budgets = budgetsResponse.data.budgets;
            console.log("Available budgets:", budgets.map(b => ({ id: b.id, name: b.name })));
            const envBudgetId = process.env.YNAB_BUDGET_ID;
            if (envBudgetId && budgets.find(b => b.id === envBudgetId)) {
                budgetId = envBudgetId;
                console.log("Using budget from .env:", budgetId);
            }
            else {
                budgetId = budgets[0].id;
                console.log("Using first available budget:", budgetId);
            }
        }
        catch (e) {
            console.error("Failed to fetch budgets:", e);
            throw e;
        }
        tool = new CreateSplitTransactionTool();
        try {
            // Get an account
            console.log("Fetching accounts for budget:", budgetId);
            const accountsResponse = await api.accounts.getAccounts(budgetId);
            if (accountsResponse.data.accounts.length === 0) {
                throw new Error("No accounts found in budget");
            }
            accountId = accountsResponse.data.accounts[0].id;
            // Get categories
            const categoriesResponse = await api.categories.getCategories(budgetId);
            const categoryGroups = categoriesResponse.data.category_groups;
            let categories = [];
            if (categoryGroups) {
                categories = categoryGroups.flatMap(g => g.categories);
            }
            const validCategories = categories.filter(c => !c.deleted && !c.hidden && c.name !== "Uncategorized");
            if (validCategories.length < 2) {
                throw new Error("Need at least 2 categories for split test");
            }
            categoryId1 = validCategories[0].id;
            categoryId2 = validCategories[1].id;
            console.log("Setup complete:", { budgetId, accountId, categoryId1, categoryId2 });
        }
        catch (e) {
            console.error("Setup failed:", e);
            throw e;
        }
    });
    it('should update an existing transaction to be a split transaction', async () => {
        if (!process.env.YNAB_API_TOKEN)
            return;
        // 1. Create a transaction
        const createResponse = await api.transactions.createTransaction(budgetId, {
            transaction: {
                account_id: accountId,
                date: new Date().toISOString().split('T')[0],
                amount: -10000, // -10.00
                payee_name: "Test Payee",
                memo: "Original Transaction",
                cleared: ynab.TransactionClearedStatus.Uncleared,
                approved: true
            }
        });
        if (!createResponse.data.transaction)
            throw new Error("Failed to create setup transaction");
        createdTransactionId = createResponse.data.transaction.id;
        console.log("Created transaction:", createdTransactionId);
        // 2. Use tool to split it
        const input = {
            budgetId: budgetId,
            transactionId: createdTransactionId,
            subtransactions: [
                {
                    categoryId: categoryId1,
                    amount: -5.00,
                    memo: "Split 1"
                },
                {
                    categoryId: categoryId2,
                    amount: -5.00,
                    memo: "Split 2"
                }
            ]
        };
        console.log("Executing tool with input:", JSON.stringify(input, null, 2));
        const result = await tool.execute(input);
        console.log("Tool result:", result);
        expect(result).toContain("Successfully updated transaction");
        // 3. Verify
        const verifyResponse = await api.transactions.getTransactionById(budgetId, createdTransactionId);
        const updatedTx = verifyResponse.data.transaction;
        expect(updatedTx.subtransactions.length).toBe(2);
        expect(updatedTx.amount).toBe(-10000);
    });
    afterAll(async () => {
        if (createdTransactionId && process.env.YNAB_API_TOKEN) {
            console.log("Test transaction left in budget:", createdTransactionId);
            // Uncomment to clean up
            // await api.transactions.deleteTransaction(budgetId, createdTransactionId);
        }
    });
});
