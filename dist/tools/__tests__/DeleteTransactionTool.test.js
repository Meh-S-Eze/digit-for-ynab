import { describe, it, expect, vi, beforeEach } from 'vitest';
import DeleteTransactionTool from '../DeleteTransactionTool';
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
describe('DeleteTransactionTool', () => {
    let tool;
    let mockApi;
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.YNAB_API_TOKEN;
        delete process.env.YNAB_BUDGET_ID;
        mockApi = {
            transactions: {
                deleteTransaction: vi.fn(),
            },
        };
        ynab.API.mockImplementation(() => mockApi);
        tool = new DeleteTransactionTool();
    });
    it('should delete a transaction correctly', async () => {
        process.env.YNAB_API_TOKEN = 'test-token';
        const input = {
            budgetId: 'test-budget',
            transactionId: 't1'
        };
        mockApi.transactions.deleteTransaction.mockResolvedValue({});
        const result = await tool.execute(input);
        expect(mockApi.transactions.deleteTransaction).toHaveBeenCalledWith('test-budget', 't1');
        expect(result.success).toBe(true);
    });
});
