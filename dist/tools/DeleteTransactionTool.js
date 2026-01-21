import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
/**
 * DeleteTransactionTool - Permanently remove a transaction
 *
 * WHEN TO USE:
 * - User asks: "Delete this transaction", "Remove duplicate entry", "Get rid of wrong transaction"
 * - User wants: Undo duplicate, remove mistake, clean up
 * - User is: Fixing errors, removing accidental entries
 *
 * WORKFLOW:
 * 1. MUST HAVE: transactionId (get from analyze_transactions())
 * 2. Call this tool with transaction ID
 * 3. Transaction is PERMANENTLY deleted (cannot be undone)
 * 4. Returns: Confirmation
 *
 * COMMON CLAUDE PATTERNS:
 * User: "Delete that transaction" → analyze_transactions() → delete_transaction(transactionId)
 * User: "Remove duplicate" → analyze_transactions() → delete_transaction()
 *
 * ⚠️ DANGER: This is PERMANENT and CANNOT be undone. Use cautiously!
 *
 * IMPORTANT:
 * - IRREVERSIBLE - deleted transactions cannot be recovered
 * - Removes all related data (splits, approval status, etc.)
 * - Updates all analytics and reports immediately
 * - If unsure, use update_single_transaction() to correct instead
 * - Not recommended unless dealing with duplicates or clear errors
 */
class DeleteTransactionTool extends MCPTool {
    name = "delete_transaction";
    description = "CAUTION: Permanently delete an existing transaction. This action CANNOT be undone. Only use for removing duplicate entries or clear errors. For corrections, use update_single_transaction instead. Must provide budgetId and transactionId.";
    schema = {
        budgetId: {
            type: z.string().optional(),
            description: "The ID of the budget (optional, defaults to env var). Get from list_budgets() if needed.",
        },
        transactionId: {
            type: z.string(),
            description: "REQUIRED: The ID of the transaction to delete. Get from analyze_transactions().",
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
        try {
            logger.info(`Deleting transaction ${input.transactionId} from budget ${budgetId}`);
            // YNAB API has deleteTransaction
            const response = await this.api.transactions.deleteTransaction(budgetId, input.transactionId);
            return {
                success: true,
                message: `Successfully deleted transaction ${input.transactionId}. NOTE: This action cannot be undone.`
            };
        }
        catch (error) {
            logger.error(`Error deleting transaction:`);
            logger.error(JSON.stringify(error, null, 2));
            return `ERROR deleting transaction: ${JSON.stringify(error)}`;
        }
    }
}
export default DeleteTransactionTool;
