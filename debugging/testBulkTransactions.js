const { CreateMultipleTransactionsTool } = require('../dist/tools/CreateMultipleTransactionsTool');

async function testBulkTransactions() {
  console.log('Testing CreateMultipleTransactionsTool with live YNAB API...');
  
  const tool = new CreateMultipleTransactionsTool();
  
  // Test data - using small amounts to avoid affecting real budget
  const testTransactions = [
    {
      account_id: process.env.YNAB_BUDGET_ID ? 'test-account' : 'demo-account',
      date: '2024-12-19',
      amount: 100, // $1.00 in milliunits
      payee_name: 'Test Bulk Import 1',
      memo: 'Test transaction from bulk import tool',
    },
    {
      account_id: process.env.YNAB_BUDGET_ID ? 'test-account' : 'demo-account',
      date: '2024-12-19',
      amount: 250, // $2.50 in milliunits
      payee_name: 'Test Bulk Import 2',
      memo: 'Second test transaction from bulk import tool',
    },
  ];

  try {
    console.log('Input transactions:', JSON.stringify(testTransactions, null, 2));
    
    const result = await tool.execute({
      budgetId: process.env.YNAB_BUDGET_ID || 'demo-budget',
      transactions: testTransactions,
    });
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (typeof result === 'object' && result.transaction_ids) {
      console.log('✅ Success! Created transactions:', result.transaction_ids);
      console.log('Summary:', result.summary);
    } else {
      console.log('❌ Error:', result);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBulkTransactions(); 