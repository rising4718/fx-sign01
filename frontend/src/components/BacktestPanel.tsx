import React, { useState } from 'react';
import { type BacktestResult, type BacktestParameters, type DailyPnL } from '../utils/backtestEngine';
import { type CurrencyPair, type TORBSettings } from '../types';
import { DEFAULT_TORB_SETTINGS } from '../utils/torbLogic';
import { CURRENCY_PAIRS } from '../constants/currencyPairs';

interface BacktestPanelProps {
  onRunBacktest: (parameters: BacktestParameters) => Promise<void>;
  result: BacktestResult | null;
  isRunning: boolean;
}

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  subtitle?: string;
  color?: 'green' | 'red' | 'blue' | 'gray';
}> = ({ title, value, subtitle, color = 'gray' }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-title">{title}</div>
    <div className="stat-value">{value}</div>
    {subtitle && <div className="stat-subtitle">{subtitle}</div>}
  </div>
);

const TradeList: React.FC<{ trades: BacktestResult['trades']; maxRows?: number }> = ({ 
  trades, 
  maxRows = 10 
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayTrades = showAll ? trades : trades.slice(-maxRows);

  return (
    <div className="trade-list">
      <div className="trade-header">
        <span>日付</span>
        <span>ペア</span>
        <span>方向</span>
        <span>結果</span>
        <span>Pips</span>
        <span>時間</span>
      </div>
      
      <div className="trade-rows">
        {displayTrades.map((trade, index) => (
          <div key={index} className={`trade-row ${trade.isWin ? 'win' : 'loss'}`}>
            <span className="trade-date">
              {new Date(trade.date).toLocaleDateString('ja-JP')}
            </span>
            <span className="trade-pair">
              {CURRENCY_PAIRS[trade.pair].displayName}
            </span>
            <span className={`trade-direction ${trade.signal.type.toLowerCase()}`}>
              {trade.signal.type === 'BUY' ? '📈' : '📉'}
            </span>
            <span className={`trade-result ${trade.exitReason.toLowerCase()}`}>
              {trade.exitReason === 'TARGET' ? '利確' : 
               trade.exitReason === 'STOP_LOSS' ? '損切' : '時間'}
            </span>
            <span className={`trade-pips ${trade.pips >= 0 ? 'positive' : 'negative'}`}>
              {trade.pips >= 0 ? '+' : ''}{trade.pips.toFixed(1)}
            </span>
            <span className="trade-duration">
              {Math.floor(trade.duration / 60)}h{Math.floor(trade.duration % 60)}m
            </span>
          </div>
        ))}
      </div>

      {trades.length > maxRows && (
        <button 
          className="toggle-trades-btn"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? '少なく表示' : `全${trades.length}件を表示`}
        </button>
      )}
    </div>
  );
};

const EquityCurve: React.FC<{ dailyPnL: DailyPnL[] }> = ({ dailyPnL }) => {
  if (dailyPnL.length === 0) return <div>データがありません</div>;

  const maxPips = Math.max(...dailyPnL.map(d => d.cumulativePips));
  const minPips = Math.min(...dailyPnL.map(d => d.cumulativePips));
  const range = maxPips - minPips;

  return (
    <div className="equity-curve">
      <svg width="100%" height="200" viewBox="0 0 400 200">
        <defs>
          <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4caf50" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4caf50" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        <g stroke="#e0e0e0" strokeWidth="1">
          {[0, 50, 100, 150, 200].map(y => (
            <line key={y} x1="0" y1={y} x2="400" y2={y} />
          ))}
          {[0, 100, 200, 300, 400].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="200" />
          ))}
        </g>

        {/* Equity curve */}
        <path
          d={dailyPnL.map((point, index) => {
            const x = (index / (dailyPnL.length - 1)) * 380 + 10;
            const y = 190 - ((point.cumulativePips - minPips) / range) * 180;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')}
          stroke="#4caf50"
          strokeWidth="2"
          fill="url(#equityGradient)"
        />

        {/* Zero line */}
        {minPips < 0 && maxPips > 0 && (
          <line
            x1="10"
            y1={190 - ((-minPips) / range) * 180}
            x2="390"
            y2={190 - ((-minPips) / range) * 180}
            stroke="#666"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        )}
      </svg>
      
      <div className="curve-labels">
        <span>開始: {dailyPnL[0]?.date}</span>
        <span>終了: {dailyPnL[dailyPnL.length - 1]?.date}</span>
      </div>
    </div>
  );
};

export const BacktestPanel: React.FC<BacktestPanelProps> = ({
  onRunBacktest,
  result,
  isRunning
}) => {
  const [parameters, setParameters] = useState<BacktestParameters>({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90日前
    endDate: new Date(),
    pairs: ['USDJPY', 'EURUSD'],
    settings: DEFAULT_TORB_SETTINGS,
    initialBalance: 100000,
    riskPerTrade: 2
  });

  const [activeTab, setActiveTab] = useState<'settings' | 'results' | 'trades' | 'chart'>('settings');

  const handleRunBacktest = () => {
    if (!isRunning) {
      onRunBacktest(parameters);
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatNumber = (value: number, decimals: number = 1) => value.toFixed(decimals);

  return (
    <div className="backtest-panel">
      {/* タブナビゲーション */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ 設定
        </button>
        <button 
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
          disabled={!result}
        >
          📊 結果
        </button>
        <button 
          className={`tab-btn ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('trades')}
          disabled={!result}
        >
          📝 取引履歴
        </button>
        <button 
          className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
          onClick={() => setActiveTab('chart')}
          disabled={!result}
        >
          📈 チャート
        </button>
      </div>

      {/* 設定タブ */}
      {activeTab === 'settings' && (
        <div className="backtest-settings">
          <div className="settings-section">
            <h4>📅 期間設定</h4>
            <div className="date-inputs">
              <div className="input-group">
                <label>開始日</label>
                <input
                  type="date"
                  value={parameters.startDate.toISOString().split('T')[0]}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    startDate: new Date(e.target.value)
                  }))}
                />
              </div>
              <div className="input-group">
                <label>終了日</label>
                <input
                  type="date"
                  value={parameters.endDate.toISOString().split('T')[0]}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    endDate: new Date(e.target.value)
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h4>💱 通貨ペア</h4>
            <div className="pair-checkboxes">
              {Object.keys(CURRENCY_PAIRS).map(pair => (
                <label key={pair} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={parameters.pairs.includes(pair as CurrencyPair)}
                    onChange={(e) => {
                      const pairKey = pair as CurrencyPair;
                      setParameters(prev => ({
                        ...prev,
                        pairs: e.target.checked
                          ? [...prev.pairs, pairKey]
                          : prev.pairs.filter(p => p !== pairKey)
                      }));
                    }}
                  />
                  {CURRENCY_PAIRS[pair as CurrencyPair].displayName}
                </label>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h4>💰 資金管理</h4>
            <div className="money-inputs">
              <div className="input-group">
                <label>初期資金 (円)</label>
                <input
                  type="number"
                  value={parameters.initialBalance}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    initialBalance: Number(e.target.value)
                  }))}
                />
              </div>
              <div className="input-group">
                <label>1取引あたりリスク (%)</label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={parameters.riskPerTrade}
                  onChange={(e) => setParameters(prev => ({
                    ...prev,
                    riskPerTrade: Number(e.target.value)
                  }))}
                />
              </div>
            </div>
          </div>

          <button 
            className="run-backtest-btn"
            onClick={handleRunBacktest}
            disabled={isRunning || parameters.pairs.length === 0}
          >
            {isRunning ? '🔄 実行中...' : '🚀 バックテスト実行'}
          </button>
        </div>
      )}

      {/* 結果タブ */}
      {activeTab === 'results' && result && (
        <div className="backtest-results">
          <div className="stats-grid">
            <StatCard 
              title="総取引数" 
              value={result.totalTrades} 
              color="blue"
            />
            <StatCard 
              title="勝率" 
              value={formatPercentage(result.winRate)} 
              subtitle={`勝: ${result.winningTrades} / 負: ${result.losingTrades}`}
              color={result.winRate > 0.5 ? 'green' : 'red'}
            />
            <StatCard 
              title="総獲得Pips" 
              value={`${result.totalPips >= 0 ? '+' : ''}${formatNumber(result.totalPips)}`}
              color={result.totalPips >= 0 ? 'green' : 'red'}
            />
            <StatCard 
              title="プロフィットファクター" 
              value={formatNumber(result.profitFactor, 2)}
              subtitle={`${formatNumber(result.avgWinPips)} / ${formatNumber(result.avgLossPips)}`}
              color={result.profitFactor > 1 ? 'green' : 'red'}
            />
            <StatCard 
              title="最大ドローダウン" 
              value={`${formatNumber(result.maxDrawdown)} pips`}
              color="red"
            />
            <StatCard 
              title="最大連勝" 
              value={result.maxConsecutiveWins}
              subtitle={`最大連敗: ${result.maxConsecutiveLosses}`}
              color="green"
            />
          </div>

          <div className="monthly-stats">
            <h4>📅 月次統計</h4>
            <div className="monthly-grid">
              {result.monthlyStats.map(month => (
                <div key={month.month} className="monthly-card">
                  <div className="month-header">{month.month}</div>
                  <div className="month-stats">
                    <div>取引: {month.trades}</div>
                    <div>勝率: {formatPercentage(month.winRate)}</div>
                    <div className={month.totalPips >= 0 ? 'positive' : 'negative'}>
                      {month.totalPips >= 0 ? '+' : ''}{formatNumber(month.totalPips)} pips
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 取引履歴タブ */}
      {activeTab === 'trades' && result && (
        <div className="trade-history">
          <h4>📝 取引履歴 ({result.trades.length}件)</h4>
          <TradeList trades={result.trades} />
        </div>
      )}

      {/* チャートタブ */}
      {activeTab === 'chart' && result && (
        <div className="backtest-chart">
          <h4>📈 累積損益チャート</h4>
          <EquityCurve dailyPnL={result.dailyPnL} />
          
          <div className="chart-stats">
            <div>開始: {formatNumber(result.dailyPnL[0]?.cumulativePips || 0)} pips</div>
            <div>終了: {formatNumber(result.dailyPnL[result.dailyPnL.length - 1]?.cumulativePips || 0)} pips</div>
            <div>期間: {result.dailyPnL.length} 日間</div>
          </div>
        </div>
      )}

      <style jsx>{`
        .backtest-panel {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .tab-navigation {
          display: flex;
          gap: 4px;
          margin-bottom: 1rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .tab-btn {
          padding: 0.5rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
          border-radius: 4px 4px 0 0;
          font-size: 0.9rem;
        }

        .tab-btn:hover:not(:disabled) {
          background: #f5f5f5;
        }

        .tab-btn.active {
          background: #2196f3;
          color: white;
        }

        .tab-btn:disabled {
          color: #ccc;
          cursor: not-allowed;
        }

        .backtest-settings {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .settings-section h4 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1rem;
        }

        .date-inputs, .money-inputs {
          display: flex;
          gap: 1rem;
        }

        .input-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .input-group label {
          font-size: 0.85rem;
          color: #666;
          font-weight: 500;
        }

        .input-group input {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .pair-checkboxes {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.25rem;
        }

        .run-backtest-btn {
          background: #4caf50;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: bold;
          align-self: center;
        }

        .run-backtest-btn:hover:not(:disabled) {
          background: #45a049;
        }

        .run-backtest-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          padding: 1rem;
          border-radius: 6px;
          text-align: center;
          border: 1px solid #e0e0e0;
        }

        .stat-card.green {
          background: linear-gradient(135deg, #e8f5e8, #f1f8e9);
          border-color: #c8e6c9;
        }

        .stat-card.red {
          background: linear-gradient(135deg, #ffebee, #fce4ec);
          border-color: #f8bbd9;
        }

        .stat-card.blue {
          background: linear-gradient(135deg, #e3f2fd, #e8f4fd);
          border-color: #bbdefb;
        }

        .stat-title {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
        }

        .stat-subtitle {
          font-size: 0.75rem;
          color: #999;
          margin-top: 0.25rem;
        }

        .monthly-stats h4 {
          margin-bottom: 1rem;
          color: #333;
        }

        .monthly-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }

        .monthly-card {
          padding: 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          background: #fafafa;
        }

        .month-header {
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .month-stats {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.85rem;
        }

        .month-stats .positive {
          color: #4caf50;
          font-weight: bold;
        }

        .month-stats .negative {
          color: #f44336;
          font-weight: bold;
        }

        .trade-history h4 {
          margin-bottom: 1rem;
          color: #333;
        }

        .trade-list {
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
        }

        .trade-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background: #f5f5f5;
          font-weight: bold;
          font-size: 0.85rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .trade-rows {
          max-height: 400px;
          overflow-y: auto;
        }

        .trade-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 0.5rem 1rem;
          border-bottom: 1px solid #f0f0f0;
          font-size: 0.8rem;
          align-items: center;
        }

        .trade-row.win {
          background: rgba(76, 175, 80, 0.05);
        }

        .trade-row.loss {
          background: rgba(244, 67, 54, 0.05);
        }

        .trade-direction.buy {
          color: #4caf50;
        }

        .trade-direction.sell {
          color: #f44336;
        }

        .trade-pips.positive {
          color: #4caf50;
          font-weight: bold;
        }

        .trade-pips.negative {
          color: #f44336;
          font-weight: bold;
        }

        .toggle-trades-btn {
          width: 100%;
          padding: 0.75rem;
          border: none;
          background: #f5f5f5;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .toggle-trades-btn:hover {
          background: #e0e0e0;
        }

        .backtest-chart h4 {
          margin-bottom: 1rem;
          color: #333;
        }

        .equity-curve {
          margin-bottom: 1rem;
        }

        .curve-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #666;
          margin-top: 0.5rem;
        }

        .chart-stats {
          display: flex;
          justify-content: space-around;
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 4px;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};