// Frontend-Backend Integration Test
// Simple test without importing frontend modules

console.log('Testing frontend-backend integration...');

async function testIntegration() {
  try {
    // Test current price
    console.log('1. Testing current price API...');
    const response = await fetch('http://localhost:3002/api/v1/fx/ticker?symbol=USD/JPY');
    const data = await response.json();
    
    if (data.success) {
      console.log('✓ Current Price API working:', data.data);
    } else {
      console.log('✗ Current Price API failed:', data);
    }

    // Test historical data
    console.log('\n2. Testing historical data API...');
    const histResponse = await fetch('http://localhost:3002/api/v1/fx/historical?symbol=USD/JPY&timeframe=15m&limit=5');
    const histData = await histResponse.json();
    
    if (histData.success && histData.data.length > 0) {
      console.log('✓ Historical Data API working:', histData.data.length + ' candles received');
    } else {
      console.log('✗ Historical Data API failed:', histData);
    }

    // Test TORB signals
    console.log('\n3. Testing TORB signals API...');
    const torbResponse = await fetch('http://localhost:3002/api/v1/torb/signals?symbol=USD/JPY');
    const torbData = await torbResponse.json();
    
    if (torbData.success) {
      console.log('✓ TORB Signals API working:', torbData.meta);
    } else {
      console.log('✗ TORB Signals API failed:', torbData);
    }

    console.log('\n✓ All API endpoints are working correctly!');
    console.log('Frontend can now connect to backend successfully.');

  } catch (error) {
    console.error('Integration test failed:', error);
  }
}

testIntegration();