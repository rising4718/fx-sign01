export interface TradingSettings {
  mode: 'demo' | 'real';
  autoTrading: boolean;
  maxPositions: number;
  forceCloseTime: string;
}

export interface DemoSettings {
  initialBalance: number;
  currentBalance: number;
  lotSize: number;
  riskPercentage: number;
  pipValue: number; // 1pip = ¥100
}

export interface RealSettings {
  brokerId: string;
  apiKey: string;
  secretKey: string;
  accountType: 'live' | 'sandbox';
}

export interface NotificationSettings {
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

export interface RiskSettings {
  maxDrawdown: number;
  dailyLossLimit: number;
  maxDailyTrades: number;
  emergencyStop: boolean;
}

export interface AppSettings {
  trading: TradingSettings;
  demo: DemoSettings;
  real: RealSettings;
  notifications: NotificationSettings;
  risk: RiskSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
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