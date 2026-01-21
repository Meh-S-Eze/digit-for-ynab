import { MCPTool, logger } from "mcp-framework";
import * as ynab from "ynab";
import { z } from "zod";
class GetSinglePayeeTool extends MCPTool {
    name = "get_single_payee";
    description = "Get detailed information about a specific payee";
    schema = {
        budgetId: {
            type: z.string(),
            description: "The ID of the budget containing the payee",
        },
        payeeId: {
            type: z.string(),
            description: "The ID of the payee to retrieve details for",
        },
    };
    api;
    constructor() {
        super();
        this.api = new ynab.API(process.env.YNAB_API_TOKEN || "");
    }
    async execute(input) {
        if (!process.env.YNAB_API_TOKEN) {
            return "YNAB API Token is not set";
        }
        if (!input.budgetId) {
            return "Budget ID is required. Please provide a budget ID.";
        }
        if (!input.payeeId) {
            return "Payee ID is required. Please provide a payee ID.";
        }
        try {
            logger.info(`Getting payee details for budget ${input.budgetId}, payee ${input.payeeId}`);
            const payeeResponse = await this.api.payees.getPayeeById(input.budgetId, input.payeeId);
            logger.info(`Successfully retrieved payee: ${payeeResponse.data.payee.name}`);
            const payee = {
                id: payeeResponse.data.payee.id,
                name: payeeResponse.data.payee.name,
                transfer_account_id: payeeResponse.data.payee.transfer_account_id,
                deleted: payeeResponse.data.payee.deleted,
            };
            return payee;
        }
        catch (error) {
            logger.error(`Error getting payee ${input.payeeId} for budget ${input.budgetId}:`);
            logger.error(JSON.stringify(error, null, 2));
            return `Error getting payee ${input.payeeId} for budget ${input.budgetId}: ${JSON.stringify(error)}`;
        }
    }
}
export default GetSinglePayeeTool;
