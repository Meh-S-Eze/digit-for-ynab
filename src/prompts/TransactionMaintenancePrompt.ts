import { MCPPrompt } from "mcp-framework";
import { z } from "zod";

class TransactionMaintenancePrompt extends MCPPrompt {
    name = "transaction_maintenance_guidance";
    description = "Best practices for managing and maintaining transactions";

    schema = {};

    protected async generateMessages() {
        return [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `Managing transactions requires precision to maintain an accurate view of resources.

Best Practices:
1. **Creation**: Use 'create_multiple_transactions' for adding new transactions (works for both single entries and batches). Always prefer using 'payee_id' or 'category_id' if you've previously retrieved them using 'get_payees' or 'list_budgets'.
2. **Split Transactions**: For purchases that span multiple categories (e.g., grocery store with both food and household items), use 'create_split_transaction' to properly allocate amounts to different categories. This ensures accurate spending analysis.
3. **Recurring Items**: If the user mentions a regular bill or income, suggest 'create_scheduled_transaction'. Use 'list_scheduled_transactions' to see what's already planned.
4. **Approval Flow**: New transactions (especially imported ones) often need approval. Use 'get_unapproved_transactions' to find them and 'approve_transaction' to confirm them.
5. **Hard Deletion**: Use 'delete_transaction' or 'delete_scheduled_transaction' with CAUTION. Always confirm with the user before performing a permanent deletion, as this cannot be undone in the API.
6. **Transfers**: Use 'create_transfer' for moving money between accounts. This automatically handles the linked nature of transfers in the underlying ledger.
7. **Memo Formatting**: When creating new transactions, append the memo with 'YY.MM.DD AI Created - [original memo]' if a memo is provided. When updating existing transactions, append with 'YY.MM.DD AI Updated - [original memo]'.`
                }
            }
        ];
    }
}

export default TransactionMaintenancePrompt;
