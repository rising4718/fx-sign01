import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 型定義を直接ファイル内で定義
interface TradingSettings {
  mode: 'demo' | 'real';
  autoTrading: boolean;
  maxPositions: number;
  forceCloseTime: string;
}

interface DemoSettings {
  initialBalance: number;
  currentBalance: number;
  lotSize: number;
  riskPercentage: number;
  pipValue: number;
}

interface RealSettings {
  brokerId: string;
  apiKey: string;
  secretKey: string;
  accountType: 'live' | 'sandbox';
}

interface NotificationSettings {
  discord: {
    enabled: boolean;
    webhookUrl: string;
  };
  email: {
    enabled: boolean;
    address: string;
  };
  sound: {
    enabled: boolean;
    volume: number;
  };
}

interface RiskSettings {
  maxDrawdown: number;
  dailyLossLimit: number;
  maxDailyTrades: number;
  emergencyStop: boolean;
}

interface AppSettings {
  trading: TradingSettings;
  demo: DemoSettings;
  real: RealSettings;
  notifications: NotificationSettings;
  risk: RiskSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  trading: {
    mode: 'demo',
    autoTrading: false,
    maxPositions: 1,
    forceCloseTime: '15:00',
  },
  demo: {
    initialBalance: 300000,
    currentBalance: 300000,
    lotSize: 10000,
    riskPercentage: 2,
    pipValue: 100,
  },
  real: {
    brokerId: '',
    apiKey: '',
    secretKey: '',
    accountType: 'sandbox',
  },
  notifications: {
    discord: {
      enabled: false,
      webhookUrl: '',
    },
    email: {
      enabled: false,
      address: '',
    },
    sound: {
      enabled: true,
      volume: 0.5,
    },
  },
  risk: {
    maxDrawdown: 50000,
    dailyLossLimit: 30000,
    maxDailyTrades: 10,
    emergencyStop: true,
  },
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  isDemo: boolean;
  toggleTradingMode: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('fxSignToolSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // マイグレーション：新しい設定項目のデフォルト値をマージ
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  });

  // 設定変更時にローカルストレージに保存
  useEffect(() => {
    try {
      localStorage.setItem('fxSignToolSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      
      // ネストしたオブジェクトの更新をサポート
      Object.keys(updates).forEach(key => {
        const typedKey = key as keyof AppSettings;
        if (typeof updates[typedKey] === 'object' && updates[typedKey] !== null) {
          newSettings[typedKey] = { 
            ...prev[typedKey], 
            ...updates[typedKey] 
          } as any;
        } else {
          newSettings[typedKey] = updates[typedKey] as any;
        }
      });
      
      return newSettings;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('fxSignToolSettings');
  };

  const toggleTradingMode = () => {
    updateSettings({
      trading: {
        ...settings.trading,
        mode: settings.trading.mode === 'demo' ? 'real' : 'demo'
      }
    });
  };

  const isDemo = settings.trading.mode === 'demo';

  const contextValue: SettingsContextType = {
    settings,
    updateSettings,
    resetSettings,
    isDemo,
    toggleTradingMode,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};