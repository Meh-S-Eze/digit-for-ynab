import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
/**
 * Discover all unapproved (pending) transactions in a budget.
 *
 * Use this when the user says:
 * - "Show me pending transactions"
 * - "What do I need to approve?"
 * - "List transactions waiting for approval"
 *
 * After reviewing with the user, use approve_transaction to mark
 * individual transactions as approved.
 *
 * Returns transactions with IDs so you can approve them.
 */
class GetUnapprovedTransactionsTool extends MCPTool {
    name = "get_unapproved_transactions";
    description = "Fetch all unapproved (pending) transactions in a budget. Use this to discover transactions needing approval, then use approve_transaction to approve individual items.";
    schema = {
        budgetId: {
            type: z.string().optional(),
            description: "The ID of the budget to fetch transactions for (optional, defaults to YNAB_BUDGET_ID env var). Get this from list_budgets.",
        },
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
        if (!budgetId) {
            return "No budget ID provided. Please provide a budget ID or set the YNAB_BUDGET_ID environment variable. Use the list_budgets tool to get a list of available budgets.";
        }
        try {
            logger.info(`Getting unapproved transactions for budget ${budgetId}`);
            const response = await this.api.transactions.getTransactions(budgetId, undefined, ynab.GetTransactionsTypeEnum.Unapproved);
            // Transform the transactions to a more readable format
            const transactions = this.transformTransactions(response.data.transactions);
            return {
                transactions,
                transaction_count: transactions.length,
            };
        }
        catch (error) {
            logger.error(`Error getting unapproved transactions for budget ${budgetId}:`);
            logger.error(JSON.stringify(error, null, 2));
            return `Error getting unapproved transactions: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
        }
    }
    transformTransactions(transactions) {
        return transactions
            .filter((transaction) => !transaction.deleted)
            .map((transaction) => ({
            id: transaction.id,
            date: transaction.date,
            amount: (transaction.amount / 1000).toFixed(2), // Convert milliunits to actual currency with 2 decimals
            payee_name: transaction.payee_name || null,
            account_name: transaction.account_name,
            category_name: transaction.category_name || null,
            memo: transaction.memo || null,
            approved: transaction.approved,
            import_id: transaction.import_id || null,
        }));
    }
}
export default GetUnapprovedTransactionsTool;
