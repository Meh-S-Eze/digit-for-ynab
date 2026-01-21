import { describe, it, expect, vi, beforeEach } from 'vitest';
import AnalyzeSpendingTool from '../AnalyzeSpendingTool';
import * as ynab from 'ynab';
import { Cache } from '../../utils/Cache';
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
// Mock the Cache
vi.mock('../../utils/Cache', () => ({
    Cache: {
        getInstance: vi.fn(),
    },
}));
describe('AnalyzeSpendingTool', () => {
    let tool;
    let mockApi;
    let mockCache;
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.YNAB_API_TOKEN;
        delete process.env.YNAB_BUDGET_ID;
        mockApi = {
            transactions: {
                getTransactions: vi.fn(),
            },
        };
        ynab.API.mockImplementation(() => mockApi);
        mockCache = {
            get: vi.fn(),
            set: vi.fn(),
        };
        Cache.getInstance.mockReturnValue(mockCache);
        tool = new AnalyzeSpendingTool();
    });
    it('should return error when YNAB API token is not set', async () => {
        const result = await tool.execute({
            budgetId: 'test-budget',
            monthsBack: 1
        });
        expect(result).toBe('YNAB API Token is not set');
    });
    it('should return cached results if available', async () => {
        process.env.YNAB_API_TOKEN = 'test-token';
        const cachedData = { some: 'cached data' };
        mockCache.get.mockReturnValue(cachedData);
        const result = await tool.execute({
            budgetId: 'test-budget',
            monthsBack: 1
        });
        expect(result).toBe(cachedData);
        expect(mockCache.get).toHaveBeenCalled();
        expect(mockApi.transactions.getTransactions).not.toHaveBeenCalled();
    });
    it('should analyze spending correctly and cache results', async () => {
        process.env.YNAB_API_TOKEN = 'test-token';
        mockCache.get.mockReturnValue(null);
        const mockTransactions = [
            { amount: -50000, category_name: 'Food', category_id: 'c1', transfer_account_id: null, deleted: false, subtransactions: [] },
            { amount: -30000, category_name: 'Food', category_id: 'c1', transfer_account_id: null, deleted: false, subtransactions: [] },
            { amount: -100000, category_name: 'Rent', category_id: 'c2', transfer_account_id: null, deleted: false, subtransactions: [] },
            { amount: 50000, category_name: 'Salary', category_id: 'c3', transfer_account_id: null, deleted: false, subtransactions: [] }, // Income
            { amount: -20000, category_name: 'Transfer', category_id: 'c4', transfer_account_id: 'acc2', deleted: false, subtransactions: [] }, // Transfer
            {
                amount: -150000,
                category_name: 'Split',
                category_id: 'split-id',
                transfer_account_id: null,
                deleted: false,
                subtransactions: [
                    { amount: -100000, category_id: 'c2', category_name: 'Rent', deleted: false },
                    { amount: -50000, category_id: 'c1', category_name: 'Food', deleted: false }
                ]
            },
        ];
        mockApi.transactions.getTransactions.mockResolvedValue({
            data: {
                transactions: mockTransactions
            }
        });
        const result = await tool.execute({
            budgetId: 'test-budget',
            monthsBack: 1
        });
        expect(result.total_spending).toBe(330.00); // 50+30+100 + 100+50
        expect(result.category_breakdown).toHaveLength(2);
        expect(result.category_breakdown.find((r) => r.category === 'Rent').total).toBe(200.00);
        expect(result.category_breakdown.find((r) => r.category === 'Food').total).toBe(130.00);
        expect(mockCache.set).toHaveBeenCalled();
    });
    it('should handle YNAB API errors gracefully and return structured error', async () => {
        process.env.YNAB_API_TOKEN = 'test-token';
        mockCache.get.mockReturnValue(null);
        const mockApiError = {
            error: {
                detail: 'Invalid budget ID'
            },
            status: 400
        };
        mockApi.transactions.getTransactions.mockRejectedValue(mockApiError);
        const result = await tool.execute({
            budgetId: 'invalid-budget',
            monthsBack: 1
        });
        expect(result).toContain('Error analyzing spending');
        expect(result).toContain('Invalid budget ID');
        expect(mockCache.set).not.toHaveBeenCalled();
    });
});
