import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
/**
 * DeleteScheduledTransactionTool - Remove a scheduled (recurring) transaction
 *
 * WHEN TO USE:
 * - User asks: "Cancel monthly subscription", "Remove recurring bill", "Delete scheduled transaction"
 * - User wants: Stop recurring payments, remove old scheduled items
 * - User is: Unsubscribing, canceling services, cleaning up old schedules
 *
 * WORKFLOW:
 * 1. MUST HAVE: scheduledTransactionId (get from list_scheduled_transactions())
 * 2. Call this tool with scheduled transaction ID
 * 3. Removes the scheduled (recurring) transaction
 * 4. Does NOT delete past actual transactions
 * 5. Returns: Confirmation
 *
 * COMMON CLAUDE PATTERNS:
 * User: "Cancel subscription" → list_scheduled_transactions() → find subscription → delete_scheduled_transaction()
 * User: "Remove this recurring" → list_scheduled_transactions() → delete_scheduled_transaction()
 *
 * ⚠️ DANGER: This is PERMANENT and CANNOT be undone. Removes the recurring definition only.
 *
 * IMPORTANT:
 * - Removes the SCHEDULED transaction (recurring definition)
 * - Does NOT remove past instances that already occurred
 * - Does NOT remove actual posted transactions (only the reminder/schedule)
 * - Once deleted, you won't get reminders for future occurrences
 * - Safe to delete if you've already set up a reminder elsewhere
 * - Cannot be undone
 */
class DeleteScheduledTransactionTool extends MCPTool {
    name = "delete_scheduled_transaction";
    description = "CAUTION: Permanently delete a scheduled (recurring) transaction. This removes the recurring definition ONLY - it does not delete past transactions that already posted. Use when canceling subscriptions or removing old recurring reminders. This action CANNOT be undone.";
    schema = {
        budgetId: {
            type: z.string().optional(),
            description: "The ID of the budget (optional, defaults to env var). Get from list_budgets() if needed.",
        },
        scheduledTransactionId: {
            type: z.string(),
            description: "REQUIRED: The ID of the scheduled transaction to delete. Get from list_scheduled_transactions().",
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
            logger.info(`Deleting scheduled transaction ${input.scheduledTransactionId} from budget ${budgetId}`);
            // Note: In ynab-sdk-js, it is on scheduledTransactions object.
            await this.api.scheduledTransactions.deleteScheduledTransaction(budgetId, input.scheduledTransactionId);
            return {
                success: true,
                message: `Successfully deleted scheduled transaction ${input.scheduledTransactionId}. NOTE: This action cannot be undone.`
            };
        }
        catch (error) {
            logger.error(`Error deleting scheduled transaction:`);
            logger.error(JSON.stringify(error, null, 2));
            return `ERROR deleting scheduled transaction: ${JSON.stringify(error)}`;
        }
    }
}
export default DeleteScheduledTransactionTool;
