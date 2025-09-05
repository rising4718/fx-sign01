import React, { useState } from 'react';

interface TORBSettings {
  rangeStartHour: number;
  rangeStartMinute: number;
  rangeEndHour: number;
  rangeEndMinute: number;
  tradingEndHour: number;
  tradingEndMinute: number;
  minRangeWidth: number;
  maxRangeWidth: number;
  profitMultiplier: number;
  stopLossBuffer: number;
}

const LogicManagement: React.FC = () => {
  const [settings, setSettings] = useState<TORBSettings>({
    rangeStartHour: 9,
    rangeStartMinute: 0,
    rangeEndHour: 10,
    rangeEndMinute: 0,
    tradingEndHour: 17,
    tradingEndMinute: 0,
    minRangeWidth: 5,
    maxRangeWidth: 50,
    profitMultiplier: 1.5,
    stopLossBuffer: 2
  });

  const [testResults, setTestResults] = useState<any[]>([]);

  const handleSettingChange = (key: keyof TORBSettings, value: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    localStorage.setItem('torbSettings', JSON.stringify(settings));
    alert('設定を保存しました');
  };

  const loadSettings = () => {
    const saved = localStorage.getItem('torbSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
      alert('設定を読み込みました');
    }
  };

  const runBacktest = async () => {
    // バックテスト実行のプレースホルダー
    const result = {
      timestamp: new Date(),
      settings: { ...settings },
      winRate: Math.random() * 100,
      totalTrades: Math.floor(Math.random() * 100) + 10,
      profit: (Math.random() - 0.5) * 10000,
      maxDrawdown: Math.random() * 1000
    };
    
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // 最新10件を保持
  };

  return (
    <div className="logic-management">
      <h2>📊 TORBロジック管理</h2>
      
      <div className="management-container">
        <div className="settings-panel">
          <h3>⚙️ パラメータ設定</h3>
          
          <div className="setting-group">
            <h4>東京時間レンジ設定</h4>
            <div className="time-input">
              <label>開始時刻:</label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.rangeStartHour}
                onChange={(e) => handleSettingChange('rangeStartHour', parseInt(e.target.value))}
              />
              :
              <input
                type="number"
                min="0"
                max="59"
                step="15"
                value={settings.rangeStartMinute}
                onChange={(e) => handleSettingChange('rangeStartMinute', parseInt(e.target.value))}
              />
            </div>
            
            <div className="time-input">
              <label>終了時刻:</label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.rangeEndHour}
                onChange={(e) => handleSettingChange('rangeEndHour', parseInt(e.target.value))}
              />
              :
              <input
                type="number"
                min="0"
                max="59"
                step="15"
                value={settings.rangeEndMinute}
                onChange={(e) => handleSettingChange('rangeEndMinute', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="setting-group">
            <h4>取引設定</h4>
            <div className="setting-item">
              <label>取引終了時刻:</label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.tradingEndHour}
                onChange={(e) => handleSettingChange('tradingEndHour', parseInt(e.target.value))}
              />
              :
              <input
                type="number"
                min="0"
                max="59"
                step="15"
                value={settings.tradingEndMinute}
                onChange={(e) => handleSettingChange('tradingEndMinute', parseInt(e.target.value))}
              />
            </div>
            
            <div className="setting-item">
              <label>最小レンジ幅 (pips):</label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.minRangeWidth}
                onChange={(e) => handleSettingChange('minRangeWidth', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="setting-item">
              <label>最大レンジ幅 (pips):</label>
              <input
                type="number"
                min="10"
                max="200"
                value={settings.maxRangeWidth}
                onChange={(e) => handleSettingChange('maxRangeWidth', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="setting-item">
              <label>利益確定倍率:</label>
              <input
                type="number"
                min="0.5"
                max="5"
                step="0.1"
                value={settings.profitMultiplier}
                onChange={(e) => handleSettingChange('profitMultiplier', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="setting-item">
              <label>損切りバッファ (pips):</label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={settings.stopLossBuffer}
                onChange={(e) => handleSettingChange('stopLossBuffer', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="button-group">
            <button onClick={saveSettings} className="save-btn">💾 設定保存</button>
            <button onClick={loadSettings} className="load-btn">📁 設定読込</button>
            <button onClick={runBacktest} className="test-btn">🧪 バックテスト実行</button>
          </div>
        </div>

        <div className="results-panel">
          <h3>📈 テスト結果履歴</h3>
          
          {testResults.length === 0 ? (
            <p>まだテスト結果がありません。バックテストを実行してください。</p>
          ) : (
            <div className="results-list">
              {testResults.map((result, index) => (
                <div key={index} className="result-card">
                  <div className="result-header">
                    <span className="timestamp">
                      {result.timestamp.toLocaleString('ja-JP')}
                    </span>
                    <span className={`profit ${result.profit >= 0 ? 'positive' : 'negative'}`}>
                      {result.profit >= 0 ? '+' : ''}{result.profit.toFixed(2)} pips
                    </span>
                  </div>
                  
                  <div className="result-stats">
                    <div className="stat">
                      <span className="label">勝率:</span>
                      <span className="value">{result.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="stat">
                      <span className="label">取引回数:</span>
                      <span className="value">{result.totalTrades}回</span>
                    </div>
                    <div className="stat">
                      <span className="label">最大DD:</span>
                      <span className="value">{result.maxDrawdown.toFixed(1)} pips</span>
                    </div>
                  </div>
                  
                  <details className="settings-details">
                    <summary>使用パラメータ</summary>
                    <div className="settings-summary">
                      <p>レンジ: {result.settings.rangeStartHour}:{result.settings.rangeStartMinute.toString().padStart(2, '0')} - {result.settings.rangeEndHour}:{result.settings.rangeEndMinute.toString().padStart(2, '0')}</p>
                      <p>取引終了: {result.settings.tradingEndHour}:{result.settings.tradingEndMinute.toString().padStart(2, '0')}</p>
                      <p>レンジ幅: {result.settings.minRangeWidth}-{result.settings.maxRangeWidth} pips</p>
                      <p>利確倍率: {result.settings.profitMultiplier}x</p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .logic-management {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .management-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-top: 20px;
        }
        
        .settings-panel, .results-panel {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .setting-group {
          margin-bottom: 25px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .setting-group h4 {
          margin-top: 0;
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 5px;
        }
        
        .time-input, .setting-item {
          display: flex;
          align-items: center;
          margin: 10px 0;
          gap: 10px;
        }
        
        .time-input label, .setting-item label {
          min-width: 150px;
          font-weight: 500;
        }
        
        input {
          padding: 8px 12px;
          border: 2px solid #ddd;
          border-radius: 6px;
          width: 80px;
        }
        
        input:focus {
          border-color: #3498db;
          outline: none;
        }
        
        .button-group {
          display: flex;
          gap: 15px;
          margin-top: 25px;
        }
        
        button {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .save-btn {
          background: #27ae60;
          color: white;
        }
        
        .load-btn {
          background: #3498db;
          color: white;
        }
        
        .test-btn {
          background: #e74c3c;
          color: white;
        }
        
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .results-list {
          max-height: 600px;
          overflow-y: auto;
        }
        
        .result-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
          border: 1px solid #dee2e6;
        }
        
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .timestamp {
          color: #666;
          font-size: 14px;
        }
        
        .profit.positive {
          color: #27ae60;
          font-weight: bold;
        }
        
        .profit.negative {
          color: #e74c3c;
          font-weight: bold;
        }
        
        .result-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 10px;
        }
        
        .stat {
          display: flex;
          flex-direction: column;
          text-align: center;
        }
        
        .stat .label {
          font-size: 12px;
          color: #666;
          margin-bottom: 2px;
        }
        
        .stat .value {
          font-weight: bold;
          font-size: 14px;
        }
        
        .settings-details {
          margin-top: 10px;
        }
        
        .settings-details summary {
          cursor: pointer;
          color: #3498db;
          font-size: 14px;
        }
        
        .settings-summary {
          margin-top: 10px;
          padding: 10px;
          background: white;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
        }
        
        .settings-summary p {
          margin: 5px 0;
        }
      `}</style>
    </div>
  );
};

export default LogicManagement;