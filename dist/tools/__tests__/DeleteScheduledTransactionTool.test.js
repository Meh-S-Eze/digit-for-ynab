import { describe, it, expect, vi, beforeEach } from 'vitest';
import DeleteScheduledTransactionTool from '../DeleteScheduledTransactionTool';
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
describe('DeleteScheduledTransactionTool', () => {
    let tool;
    let mockApi;
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.YNAB_API_TOKEN;
        delete process.env.YNAB_BUDGET_ID;
        mockApi = {
            scheduledTransactions: {
                deleteScheduledTransaction: vi.fn(),
            },
        };
        ynab.API.mockImplementation(() => mockApi);
        tool = new DeleteScheduledTransactionTool();
    });
    it('should delete a scheduled transaction correctly', async () => {
        process.env.YNAB_API_TOKEN = 'test-token';
        const input = {
            budgetId: 'test-budget',
            scheduledTransactionId: 's1'
        };
        mockApi.scheduledTransactions.deleteScheduledTransaction.mockResolvedValue({});
        const result = await tool.execute(input);
        expect(mockApi.scheduledTransactions.deleteScheduledTransaction).toHaveBeenCalledWith('test-budget', 's1');
        expect(result.success).toBe(true);
    });
});
