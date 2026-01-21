import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateSplitTransactionTool from '../CreateSplitTransactionTool';
import * as ynab from 'ynab';
// Mock the ynab module
vi.mock('ynab', () => ({
    API: vi.fn(),
}));
// Mock the mcp-framework logger
vi.mock('mcp-framework', () => ({
    MCPTool: class MockMCPTool {
        constructor() { }
    },
    logger: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));
describe('Verify User Scenario', () => {
    let tool;
    let mockApi;
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.YNAB_API_TOKEN;
        mockApi = {
            transactions: {
                updateTransaction: vi.fn(),
            },
        };
        ynab.API.mockImplementation(() => mockApi);
        tool = new CreateSplitTransactionTool();
    });
    it('should handle the user provided scenario', async () => {
        process.env.YNAB_API_TOKEN = 'test-token';
        const mockTransaction = {
            id: '5133990b-7f4a-4fd4-a540-e778cfa20faa',
            date: '2025-12-13',
            amount: 82570, // Positive for inflow? Or negative for outflow?
            // User input has positive amount 82.57. Usually expenses are negative.
            // But let's assume the user input is what they want.
            // Wait, the user input has positive amounts for subtransactions too.
            // If it's an expense, they should be negative.
            // But maybe it's income? Or maybe the tool handles sign?
            // The tool schema says: "Use negative values for expenses (e.g. -50.00) and positive values for income"
            // The user input has positive values.
            // Let's see if the tool passes them through.
            payee_name: 'Kroger',
            memo: 'December 13, 2025 Kroger purchase split across categories',
            account_name: 'Test Account',
            subtransactions: [
                { id: 's1', amount: 44970, category_name: 'Food', memo: 'Food items' },
                { id: 's2', amount: 27480, category_name: 'Household', memo: 'Household items' },
                { id: 's3', amount: 10120, category_name: 'Tax', memo: 'Tax' }
            ]
        };
        mockApi.transactions.updateTransaction.mockResolvedValue({
            data: {
                transaction: mockTransaction,
            },
        });
        const input = {
            accountId: "e89e7356-b76b-4c42-b143-8a4e52aeb1fc",
            amount: 82.57,
            budgetId: "af0df6a7-e6c6-4e7a-ba66-7c2d4abda6f0",
            date: "2025-12-13",
            memo: "December 13, 2025 Kroger purchase split across categories",
            payeeId: "Kroger",
            payeeName: "Kroger",
            subtransactions: [
                {
                    amount: 44.97,
                    categoryId: "49dede93-54e8-4dff-a32a-fe763ae1d800",
                    memo: "Food items: Dr Pepper, OREO cookies, dog food"
                },
                {
                    amount: 27.48,
                    categoryId: "96d4f2d5-e847-42c7-a63e-2e3b86b3671b",
                    memo: "Household items: laundry detergent, storage bags"
                },
                {
                    amount: 10.12,
                    categoryId: "49dede93-54e8-4dff-a32a-fe763ae1d800",
                    memo: "Tax and additional items"
                }
            ],
            transactionId: "5133990b-7f4a-4fd4-a540-e778cfa20faa"
        };
        const result = await tool.execute(input);
        expect(mockApi.transactions.updateTransaction).toHaveBeenCalledWith("af0df6a7-e6c6-4e7a-ba66-7c2d4abda6f0", "5133990b-7f4a-4fd4-a540-e778cfa20faa", {
            transaction: {
                account_id: "e89e7356-b76b-4c42-b143-8a4e52aeb1fc",
                date: "2025-12-13",
                amount: 82570, // 82.57 * 1000
                payee_id: "Kroger",
                payee_name: "Kroger",
                memo: "December 13, 2025 Kroger purchase split across categories",
                category_id: null,
                subtransactions: [
                    {
                        amount: 44970,
                        category_id: "49dede93-54e8-4dff-a32a-fe763ae1d800",
                        memo: "Food items: Dr Pepper, OREO cookies, dog food",
                        payee_id: undefined,
                        payee_name: undefined
                    },
                    {
                        amount: 27480,
                        category_id: "96d4f2d5-e847-42c7-a63e-2e3b86b3671b",
                        memo: "Household items: laundry detergent, storage bags",
                        payee_id: undefined,
                        payee_name: undefined
                    },
                    {
                        amount: 10120,
                        category_id: "49dede93-54e8-4dff-a32a-fe763ae1d800",
                        memo: "Tax and additional items",
                        payee_id: undefined,
                        payee_name: undefined
                    }
                ]
            }
        });
        expect(result).toContain('Successfully updated transaction 5133990b-7f4a-4fd4-a540-e778cfa20faa');
    });
});
