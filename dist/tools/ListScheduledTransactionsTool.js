import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
import { Cache } from "../utils/Cache.js";
/**
 * ListScheduledTransactionsTool - List all recurring transactions
 *
 * WHEN TO USE:
 * - User asks: "Show my recurring transactions", "What's my next bill?", "List subscriptions"
 * - User wants: Overview of scheduled payments, recurring income, subscriptions
 * - User is: Reviewing recurring bills, managing subscriptions, planning for future
 *
 * WORKFLOW:
 * 1. Optional: Call list_budgets() if user hasn't specified a budget
 * 2. Call this tool with budget ID
 * 3. Returns: All scheduled (recurring) transactions
 * 4. Can then use create_scheduled_transaction() to add more or delete_scheduled_transaction() to remove
 *
 * COMMON CLAUDE PATTERNS:
 * User: "Show scheduled transactions" → list_scheduled_transactions() → show list
 * User: "Cancel subscription for Netflix" → list_scheduled_transactions() → find Netflix → delete_scheduled_transaction()
 * User: "What's coming up?" → list_scheduled_transactions() → show upcoming by date_next
 * User: "How much recurring?" → list_scheduled_transactions() → sum all amounts
 *
 * COMMON PATTERNS IN RESPONSE:
 * - Sort by date_next (upcoming first)
 * - Sum by frequency to show recurring totals (e.g., $X/month)
 * - Identify high-value recurring items
 * - Find monthly vs annual recurring
 *
 * IMPORTANT:
 * - These are SCHEDULED/REMINDERS, not actual transactions
 * - Shows: first occurrence, next occurrence, frequency, amount
 * - Use delete_scheduled_transaction(id) to stop recurring
 * - Use create_scheduled_transaction() to add new recurring
 * - Results cached for 5 minutes
 * - Sorted by date_next (earliest first) is helpful for user
 */
class ListScheduledTransactionsTool extends MCPTool {
    name = "list_scheduled_transactions";
    description = "WORKING: List all scheduled (recurring) transactions in your budget. Shows bills, subscriptions, and recurring income with their frequencies and next occurrence dates. Use to review upcoming payments or identify subscriptions to cancel.";
    schema = {
        budgetId: {
            type: z.string().optional(),
            description: "The ID of the budget (optional, defaults to env var). Get from list_budgets() if needed.",
        }
    };
    api;
    budgetId;
    constructor() {
        super();
        this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
        this.budgetId = process.env.YNAB_BUDGET_ID || "";
    }
    async execute(input) {
        const budgetId = input.budgetId || this.budgetId;
        if (!process.env.YNAB_API_TOKEN) {
            return "ERROR: YNAB API Token is not set. Please set YNAB_API_TOKEN environment variable.";
        }
        if (!budgetId) {
            return "ERROR: No budget ID provided. Call list_budgets() first.";
        }
        const cacheKey = `scheduled_transactions:${budgetId}`;
        const cachedResults = Cache.getInstance().get(cacheKey);
        if (cachedResults) {
            logger.info(`Returning cached scheduled transactions for ${cacheKey}`);
            return cachedResults;
        }
        try {
            logger.info(`Listing scheduled transactions for budget ${budgetId}`);
            const response = await this.api.scheduledTransactions.getScheduledTransactions(budgetId);
            const scheduledTransactions = response.data.scheduled_transactions;
            const result = scheduledTransactions
                .filter(t => !t.deleted)
                .map(t => ({
                id: t.id,
                date_first: t.date_first,
                date_next: t.date_next,
                frequency: t.frequency,
                amount: t.amount / 1000,
                memo: t.memo ?? null,
                account_name: t.account_name,
                payee_name: t.payee_name ?? null,
                category_name: t.category_name || "Uncategorized"
            }))
                .sort((a, b) => a.date_next.localeCompare(b.date_next)); // Sort by next occurrence
            Cache.getInstance().set(cacheKey, result);
            return result;
        }
        catch (error) {
            logger.error(`Error listing scheduled transactions:`);
            logger.error(JSON.stringify(error, null, 2));
            return `ERROR listing scheduled transactions: ${JSON.stringify(error)}`;
        }
    }
}
export default ListScheduledTransactionsTool;
