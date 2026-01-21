import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
import { Cache } from "../utils/Cache.js";
/**
 * Fetch all accounts in a budget.
 *
 * Use this **before creating transactions** to get the accountId
 * for the account the money moved in/out of.
 *
 * Example:
 * - User says "I spent from my checking account"
 * - Call list_accounts to find the "Checking" account's ID
 * - Use that ID in create_transaction
 */
class ListAccountsTool extends MCPTool {
    name = "list_accounts";
    description = "CRITICAL STEP 2: Fetch all accounts in a budget. You need an accountId before creating transactions. Returns accounts with their types and balances.";
    schema = {
        budgetId: {
            type: z.string().optional(),
            description: "The ID of the budget (optional, defaults to env var YNAB_BUDGET_ID). Get this from list_budgets.",
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
        if (!process.env.YNAB_API_TOKEN) {
            return "YNAB API Token is not set. Please set the YNAB_API_TOKEN environment variable.";
        }
        if (!budgetId) {
            return "No budget ID provided. Call list_budgets first to get a budgetId, then call list_accounts with that budgetId.";
        }
        const cacheKey = `list_accounts:${budgetId}`;
        const cachedResults = Cache.getInstance().get(cacheKey);
        if (cachedResults) {
            logger.info(`Returning cached account list for ${cacheKey}`);
            return cachedResults;
        }
        try {
            logger.info(`Listing accounts for budget ${budgetId}`);
            const response = await this.api.accounts.getAccounts(budgetId);
            const accounts = response.data.accounts;
            const result = {
                accounts: accounts
                    .filter((a) => !a.deleted)
                    .map((a) => ({
                    id: a.id,
                    name: a.name,
                    type: a.type,
                    balance: a.balance / 1000,
                    on_budget: a.on_budget,
                    closed: a.closed,
                })),
            };
            Cache.getInstance().set(cacheKey, result);
            return result;
        }
        catch (error) {
            logger.error("Error listing accounts:");
            logger.error(JSON.stringify(error, null, 2));
            return `Error listing accounts: ${JSON.stringify(error)}`;
        }
    }
}
export default ListAccountsTool;
