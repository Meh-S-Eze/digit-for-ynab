import { SerializingMCPTool } from "./base/SerializingMCPTool.js";
import { logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
/**
 * Reallocate budgeted money between two categories for a given month.
 *
 * This does **not** move money between bank accounts or change actual
 * transactions – it only adjusts budgeted amounts within the same budget
 * month (similar to "Move Money" in YNAB's UI).
 *
 * Use this when the user says things like:
 * - "Move $200 from Entertainment to Groceries"
 * - "Cover overspending in Dining with money from Miscellaneous"
 */
class MoveFundsTool extends SerializingMCPTool {
    name = "move_funds";
    description = "Move money between categories in a specific month by adjusting their budgeted amounts. Use this for intra-budget reallocation, not for moving between bank accounts.";
    schema = {
        budgetId: z.string().optional().describe("The ID of the budget (optional, defaults to env var). Use list_budgets to discover budgets."),
        month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("The budget month in ISO format (e.g. 2025-01-01). Must be the first day of the month."),
        sourceCategoryId: z.string().describe("The ID of the category to move money FROM (the category that will lose budgeted funds). Get this from budget_summary or YNAB's categories API."),
        destinationCategoryId: z.string().describe("The ID of the category to move money TO (the category that will gain budgeted funds)."),
        amount: z.number().describe("The amount of money to move in dollars (e.g. 200.00 to move $200). Must be positive."),
    };
    api;
    budgetId;
    constructor() {
        super();
        this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
        this.budgetId = process.env.YNAB_BUDGET_ID || "";
    }
    async executeInternal(input) {
        const budgetId = input.budgetId || this.budgetId;
        if (!process.env.YNAB_API_TOKEN) {
            return "YNAB API Token is not set";
        }
        if (!budgetId) {
            return "No budget ID provided.";
        }
        if (input.sourceCategoryId === input.destinationCategoryId) {
            return "Source and destination categories must be different.";
        }
        if (input.amount <= 0) {
            return "Amount must be a positive number in dollars (e.g. 50.00).";
        }
        try {
            logger.info(`Moving $${input.amount} from ${input.sourceCategoryId} to ${input.destinationCategoryId} in month ${input.month}`);
            // 1. Get current budgeted amounts for both categories
            const sourceCategoryResponse = await this.api.categories.getMonthCategoryById(budgetId, input.month, input.sourceCategoryId);
            const destCategoryResponse = await this.api.categories.getMonthCategoryById(budgetId, input.month, input.destinationCategoryId);
            const sourceCategory = sourceCategoryResponse.data.category;
            const destCategory = destCategoryResponse.data.category;
            const moveMilliunits = Math.round(input.amount * 1000);
            // 2. Perform both updates
            await this.api.categories.updateMonthCategory(budgetId, input.month, input.sourceCategoryId, {
                category: {
                    budgeted: sourceCategory.budgeted - moveMilliunits,
                },
            });
            await this.api.categories.updateMonthCategory(budgetId, input.month, input.destinationCategoryId, {
                category: {
                    budgeted: destCategory.budgeted + moveMilliunits,
                },
            });
            return {
                success: true,
                message: `Successfully moved $${input.amount.toFixed(2)} from '${sourceCategory.name}' to '${destCategory.name}' in ${input.month}.`,
                new_source_budgeted: (sourceCategory.budgeted - moveMilliunits) / 1000,
                new_destination_budgeted: (destCategory.budgeted + moveMilliunits) / 1000,
            };
        }
        catch (error) {
            logger.error("Error moving funds:");
            logger.error(JSON.stringify(error, null, 2));
            return `Error moving funds: ${JSON.stringify(error)}`;
        }
    }
}
export default MoveFundsTool;
