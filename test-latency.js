// GMOコイン FX API レイテンシテスト
const https = require('https');

async function measureLatency() {
  console.log('=== GMOコイン FX API レイテンシ測定 ===\n');
  
  const measurements = [];
  const iterations = 5;
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    await new Promise((resolve, reject) => {
      https.get('https://forex-api.coin.z.com/public/v1/ticker', (res) => {
        let data = '';
        
        // データ受信開始
        const firstByteTime = Date.now();
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const endTime = Date.now();
          const totalTime = endTime - startTime;
          const firstByteLatency = firstByteTime - startTime;
          
          try {
            const parsed = JSON.parse(data);
            const parseTime = Date.now() - endTime;
            
            console.log(`測定 ${i + 1}:`);
            console.log(`  - API呼び出し〜最初のバイト: ${firstByteLatency}ms`);
            console.log(`  - 全データ受信: ${totalTime}ms`);
            console.log(`  - JSON解析: ${parseTime}ms`);
            console.log(`  - 合計: ${totalTime + parseTime}ms`);
            
            measurements.push({
              firstByte: firstByteLatency,
              total: totalTime,
              parse: parseTime,
              combined: totalTime + parseTime
            });
            
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
    
    // 次の測定まで1秒待機
    if (i < iterations - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 統計計算
  console.log('\n=== 統計情報 ===');
  const avgCombined = measurements.reduce((sum, m) => sum + m.combined, 0) / iterations;
  const minCombined = Math.min(...measurements.map(m => m.combined));
  const maxCombined = Math.max(...measurements.map(m => m.combined));
  
  console.log(`平均レイテンシ: ${avgCombined.toFixed(1)}ms`);
  console.log(`最小レイテンシ: ${minCombined}ms`);
  console.log(`最大レイテンシ: ${maxCombined}ms`);
  
  // 想定される描画までの総時間
  console.log('\n=== 描画までの想定時間 ===');
  console.log(`API取得: ${avgCombined.toFixed(1)}ms`);
  console.log(`データ処理（React setState等）: 5-10ms`);
  console.log(`チャート描画（lightweight-charts）: 10-20ms`);
  console.log(`----------------------------------------`);
  console.log(`合計想定時間: ${(avgCombined + 15 + 30).toFixed(0)}ms（約${((avgCombined + 15 + 30) / 1000).toFixed(2)}秒）`);
}

measureLatency().catch(console.error);