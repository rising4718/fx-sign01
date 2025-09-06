import React, { useState } from 'react';
import { type CurrencyPair } from '../types';
import { CURRENCY_PAIRS, getCurrentSessionPairs } from '../constants/currencyPairs';

interface CurrencySelectorProps {
  selectedPairs: CurrencyPair[];
  onPairsChange: (pairs: CurrencyPair[]) => void;
  activePair: CurrencyPair;
  onActivePairChange: (pair: CurrencyPair) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedPairs,
  onPairsChange,
  activePair,
  onActivePairChange
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const currentSessionPairs = getCurrentSessionPairs();

  const togglePairSelection = (pair: CurrencyPair) => {
    if (selectedPairs.includes(pair)) {
      // 最低1つは選択状態を保持
      if (selectedPairs.length > 1) {
        const newPairs = selectedPairs.filter(p => p !== pair);
        onPairsChange(newPairs);
        
        // アクティブペアが削除された場合は別のペアをアクティブにする
        if (activePair === pair) {
          onActivePairChange(newPairs[0]);
        }
      }
    } else {
      onPairsChange([...selectedPairs, pair]);
    }
  };

  const setCurrentSessionPairs = () => {
    const sessionPairs = getCurrentSessionPairs();
    onPairsChange(sessionPairs);
    if (!sessionPairs.includes(activePair)) {
      onActivePairChange(sessionPairs[0]);
    }
  };

  return (
    <div className="currency-selector">
      <div className="active-pair-display">
        <h2 className="active-pair-title">
          {CURRENCY_PAIRS[activePair].displayName}
        </h2>
        <button
          className="pair-dropdown-toggle"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          ⚙️ 通貨ペア設定
        </button>
      </div>

      {showDropdown && (
        <div className="pair-dropdown">
          <div className="dropdown-header">
            <h3>通貨ペア選択</h3>
            <button
              className="session-auto-btn"
              onClick={setCurrentSessionPairs}
            >
              📊 現在のセッション
            </button>
          </div>

          <div className="pair-list">
            {Object.keys(CURRENCY_PAIRS).map(pair => {
              const currencyPair = pair as CurrencyPair;
              const pairInfo = CURRENCY_PAIRS[currencyPair];
              const isSelected = selectedPairs.includes(currencyPair);
              const isActive = activePair === currencyPair;
              const isSessionPair = currentSessionPairs.includes(currencyPair);

              return (
                <div
                  key={pair}
                  className={`pair-item ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
                >
                  <label className="pair-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePairSelection(currencyPair)}
                    />
                    <span className="pair-name">
                      {pairInfo.displayName}
                      {isSessionPair && <span className="session-indicator">🔥</span>}
                    </span>
                  </label>

                  {isSelected && (
                    <button
                      className={`activate-btn ${isActive ? 'active' : ''}`}
                      onClick={() => onActivePairChange(currencyPair)}
                      disabled={isActive}
                    >
                      {isActive ? '表示中' : '表示'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="dropdown-footer">
            <small>🔥 = 現在のセッション時間</small>
          </div>
        </div>
      )}

      {/* 選択中のペア一覧 */}
      <div className="selected-pairs-tabs">
        {selectedPairs.map(pair => (
          <button
            key={pair}
            className={`pair-tab ${pair === activePair ? 'active' : ''}`}
            onClick={() => onActivePairChange(pair)}
          >
            {CURRENCY_PAIRS[pair].displayName}
          </button>
        ))}
      </div>

      <style jsx>{`
        .currency-selector {
          background: #1a1a1a;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .active-pair-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .active-pair-title {
          color: #ffd700;
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;
        }

        .pair-dropdown-toggle {
          background: #333;
          border: 1px solid #555;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .pair-dropdown-toggle:hover {
          background: #444;
        }

        .pair-dropdown {
          background: #2a2a2a;
          border: 1px solid #555;
          border-radius: 6px;
          padding: 16px;
          margin: 12px 0;
          position: relative;
        }

        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .dropdown-header h3 {
          color: white;
          margin: 0;
          font-size: 1.1rem;
        }

        .session-auto-btn {
          background: #4a90e2;
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .session-auto-btn:hover {
          background: #357abd;
        }

        .pair-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pair-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid transparent;
        }

        .pair-item.selected {
          background: #333;
          border-color: #555;
        }

        .pair-item.active {
          background: #1a4a1a;
          border-color: #2d7a2d;
        }

        .pair-checkbox {
          display: flex;
          align-items: center;
          cursor: pointer;
          color: white;
        }

        .pair-checkbox input {
          margin-right: 8px;
        }

        .pair-name {
          font-weight: 500;
        }

        .session-indicator {
          margin-left: 6px;
        }

        .activate-btn {
          background: #28a745;
          border: none;
          color: white;
          padding: 4px 8px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .activate-btn:hover:not(:disabled) {
          background: #218838;
        }

        .activate-btn.active {
          background: #6c757d;
          cursor: not-allowed;
        }

        .dropdown-footer {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px solid #555;
          color: #888;
          text-align: center;
        }

        .selected-pairs-tabs {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .pair-tab {
          background: #333;
          border: 1px solid #555;
          color: white;
          padding: 6px 12px;
          border-radius: 4px 4px 0 0;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .pair-tab:hover {
          background: #444;
        }

        .pair-tab.active {
          background: #ffd700;
          color: #000;
          border-color: #ffd700;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};