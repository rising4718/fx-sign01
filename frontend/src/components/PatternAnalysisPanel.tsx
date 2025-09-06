import React from 'react';
import { type PatternAnalysis, type PatternMatch } from '../types';

interface PatternAnalysisPanelProps {
  analysis: PatternAnalysis | null;
  isLoading?: boolean;
}

const PatternTypeIcon: React.FC<{ type: PatternMatch['patternType'] }> = ({ type }) => {
  const icons = {
    'FLAG': '🏳️',
    'PENNANT': '🚩',
    'TRIANGLE': '📐',
    'RANGE_BREAKOUT': '💥'
  };
  return <span>{icons[type]}</span>;
};

const ConfidenceStars: React.FC<{ confidence: number }> = ({ confidence }) => {
  return (
    <span className="confidence-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < confidence ? 'star filled' : 'star'}>
          ⭐
        </span>
      ))}
    </span>
  );
};

const DirectionArrow: React.FC<{ direction: 'UP' | 'DOWN' }> = ({ direction }) => {
  return (
    <span className={`direction-arrow ${direction.toLowerCase()}`}>
      {direction === 'UP' ? '📈' : '📉'}
    </span>
  );
};

export const PatternAnalysisPanel: React.FC<PatternAnalysisPanelProps> = ({
  analysis,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="pattern-panel">
        <div className="pattern-section">
          <h4>🔍 Pattern Analysis</h4>
          <div className="loading-state">
            <p>パターンを分析中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="pattern-panel">
        <div className="pattern-section">
          <h4>🔍 Pattern Analysis</h4>
          <div className="no-pattern">
            <p>データを取得中...</p>
          </div>
        </div>
      </div>
    );
  }

  const { currentPattern, similarPatterns, prediction } = analysis;

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('ja-JP');

  return (
    <div className="pattern-panel">
      {/* 現在のパターン */}
      <div className="pattern-section">
        <h4>🔍 Current Pattern</h4>
        {currentPattern ? (
          <div className="current-pattern">
            <div className="pattern-header">
              <PatternTypeIcon type={currentPattern.patternType} />
              <span className="pattern-name">
                {currentPattern.patternType.replace('_', ' ')}
              </span>
              <ConfidenceStars confidence={currentPattern.confidence} />
            </div>
            
            <div className="pattern-details">
              <div className="pattern-item">
                <span>類似度:</span>
                <span className="similarity-value">
                  {formatPercentage(currentPattern.similarity)}
                </span>
              </div>
              
              <div className="pattern-item">
                <span>予想方向:</span>
                <div className="prediction-direction">
                  <DirectionArrow direction={currentPattern.prediction.direction} />
                  <span>{currentPattern.prediction.direction === 'UP' ? '上昇' : '下降'}</span>
                </div>
              </div>
              
              <div className="pattern-item">
                <span>確率:</span>
                <span className="probability-value">
                  {formatPercentage(currentPattern.prediction.probability)}
                </span>
              </div>
              
              <div className="pattern-item">
                <span>目標:</span>
                <span className="target-pips">
                  {currentPattern.prediction.targetPips > 0 ? '+' : ''}{currentPattern.prediction.targetPips} pips
                </span>
              </div>
              
              <div className="pattern-item">
                <span>想定時間:</span>
                <span className="timeframe">
                  {Math.floor(currentPattern.prediction.timeframe / 60)}h {currentPattern.prediction.timeframe % 60}m
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-pattern">
            <p>明確なパターンが検出されていません</p>
            <small>データが蓄積されると、パターン認識精度が向上します</small>
          </div>
        )}
      </div>

      {/* 類似パターン履歴 */}
      <div className="pattern-section">
        <h4>📊 Similar Patterns</h4>
        {similarPatterns.length > 0 ? (
          <div className="similar-patterns">
            {similarPatterns.map((pattern, index) => (
              <div key={index} className="similar-pattern-item">
                <div className="pattern-row">
                  <div className="pattern-info">
                    <PatternTypeIcon type={pattern.patternType} />
                    <span className="pattern-date">{formatDate(pattern.date)}</span>
                    <span className="pattern-similarity">
                      {formatPercentage(pattern.similarity)}
                    </span>
                  </div>
                  
                  <div className="pattern-result">
                    <DirectionArrow direction={pattern.prediction.direction} />
                    <span className="result-pips">
                      {pattern.prediction.targetPips > 0 ? '+' : ''}{pattern.prediction.targetPips}p
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-pattern">
            <p>類似パターンが見つかりませんでした</p>
            <small>データベースにより多くの履歴が必要です</small>
          </div>
        )}
      </div>

      {/* 総合予想 */}
      <div className="pattern-section">
        <h4>🎯 Market Prediction</h4>
        <div className="prediction-summary">
          <div className="prediction-probabilities">
            <div className="prob-item bullish">
              <span className="prob-label">上昇確率</span>
              <div className="prob-bar-container">
                <div 
                  className="prob-bar bullish-bar"
                  style={{ width: `${prediction.bullishProbability * 100}%` }}
                />
                <span className="prob-value">
                  {formatPercentage(prediction.bullishProbability)}
                </span>
              </div>
            </div>
            
            <div className="prob-item bearish">
              <span className="prob-label">下降確率</span>
              <div className="prob-bar-container">
                <div 
                  className="prob-bar bearish-bar"
                  style={{ width: `${prediction.bearishProbability * 100}%` }}
                />
                <span className="prob-value">
                  {formatPercentage(prediction.bearishProbability)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="expected-range">
            <h5>Expected Range</h5>
            <div className="range-values">
              <div className="range-item">
                <span>High:</span>
                <span className="range-high">{prediction.expectedRange.high.toFixed(5)}</span>
              </div>
              <div className="range-item">
                <span>Low:</span>
                <span className="range-low">{prediction.expectedRange.low.toFixed(5)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pattern-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .pattern-section {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .pattern-section h4 {
          margin: 0 0 1rem 0;
          color: #1e3c72;
          font-size: 1rem;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 0.5rem;
        }

        .current-pattern {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .pattern-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .pattern-name {
          font-weight: bold;
          color: #333;
          flex: 1;
        }

        .confidence-stars {
          display: flex;
          gap: 2px;
        }

        .confidence-stars .star {
          font-size: 0.7rem;
          opacity: 0.3;
        }

        .confidence-stars .star.filled {
          opacity: 1;
        }

        .pattern-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .pattern-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }

        .similarity-value {
          font-weight: bold;
          color: #2196f3;
        }

        .prediction-direction {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .direction-arrow.up {
          color: #4caf50;
        }

        .direction-arrow.down {
          color: #f44336;
        }

        .probability-value {
          font-weight: bold;
          color: #ff9800;
        }

        .target-pips {
          font-family: 'Monaco', monospace;
          font-weight: bold;
          color: #333;
        }

        .timeframe {
          color: #666;
          font-size: 0.8rem;
        }

        .similar-patterns {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .similar-pattern-item {
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 4px;
          border-left: 3px solid #e0e0e0;
        }

        .pattern-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pattern-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
        }

        .pattern-date {
          color: #666;
        }

        .pattern-similarity {
          color: #2196f3;
          font-weight: bold;
        }

        .pattern-result {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .result-pips {
          font-family: 'Monaco', monospace;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .prediction-summary {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .prediction-probabilities {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .prob-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .prob-label {
          font-size: 0.8rem;
          font-weight: bold;
        }

        .prob-item.bullish .prob-label {
          color: #4caf50;
        }

        .prob-item.bearish .prob-label {
          color: #f44336;
        }

        .prob-bar-container {
          position: relative;
          background: #e0e0e0;
          height: 20px;
          border-radius: 10px;
          overflow: hidden;
        }

        .prob-bar {
          height: 100%;
          transition: width 0.3s ease;
        }

        .bullish-bar {
          background: linear-gradient(90deg, #4caf50, #66bb6a);
        }

        .bearish-bar {
          background: linear-gradient(90deg, #f44336, #ef5350);
        }

        .prob-value {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.75rem;
          font-weight: bold;
          color: white;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .expected-range h5 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 0.9rem;
        }

        .range-values {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .range-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
        }

        .range-high {
          color: #4caf50;
          font-family: 'Monaco', monospace;
          font-weight: bold;
        }

        .range-low {
          color: #f44336;
          font-family: 'Monaco', monospace;
          font-weight: bold;
        }

        .no-pattern {
          text-align: center;
          padding: 2rem 1rem;
          color: #999;
        }

        .no-pattern p {
          margin: 0 0 0.5rem 0;
        }

        .no-pattern small {
          color: #ccc;
          font-size: 0.75rem;
        }

        .loading-state {
          text-align: center;
          padding: 2rem 1rem;
          color: #666;
        }

        .loading-state p {
          margin: 0;
        }
      `}</style>
    </div>
  );
};