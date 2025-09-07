import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  InputNumber, 
  Button, 
  Space, 
  Row, 
  Col,
  Statistic,
  Typography,
  Switch,
  Slider,
  Alert,
  Divider,
  message,
  Progress
} from 'antd';
import { 
  DollarOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  CalculatorOutlined,
  RiseOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import FundGrowthChart from './FundGrowthChart';

const { Title, Text } = Typography;

interface FundManagementSettings {
  initialCapital: number;
  riskPerTrade: number;
  lotSize: number;
  compoundInterest: boolean;
  maxDrawdownLimit: number; // 最大ドローダウン制限
  dailyLossLimit: number; // 日次損失制限
  monthlyTarget: number; // 月間目標
}

const FundManagement: React.FC = () => {
  const [fundSettings, setFundSettings] = useState<FundManagementSettings>(() => {
    const saved = localStorage.getItem('fundManagementSettings');
    return saved ? JSON.parse(saved) : {
      initialCapital: 300000,
      riskPerTrade: 2,
      lotSize: 10000,
      compoundInterest: true,
      maxDrawdownLimit: 10,
      dailyLossLimit: 5,
      monthlyTarget: 10
    };
  });

  const [tradingHistory] = useState(() => {
    const saved = localStorage.getItem('tradingHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // 資金推移データ計算
  const calculateFundGrowth = () => {
    const fundData: { date: string, balance: number, drawdown: number, trades: number }[] = [];
    let currentBalance = fundSettings.initialCapital;
    
    const dailyGrouped: { [date: string]: any[] } = {};
    tradingHistory.forEach((trade: any) => {
      if (!dailyGrouped[trade.date]) {
        dailyGrouped[trade.date] = [];
      }
      dailyGrouped[trade.date].push(trade);
    });
    
    const sortedDates = Object.keys(dailyGrouped).sort();
    
    sortedDates.forEach(date => {
      const dayTrades = dailyGrouped[date];
      const completedTrades = dayTrades.filter((t: any) => t.status === 'completed');
      
      let dayPnL = 0;
      completedTrades.forEach((trade: any) => {
        const tradePips = trade.pips || 0;
        const tradePnL = tradePips * 100;
        
        if (fundSettings.compoundInterest) {
          const riskAmount = currentBalance * (fundSettings.riskPerTrade / 100);
          const riskRatio = riskAmount / (fundSettings.lotSize * 100);
          dayPnL += tradePnL * riskRatio;
        } else {
          const riskAmount = fundSettings.initialCapital * (fundSettings.riskPerTrade / 100);
          const riskRatio = riskAmount / (fundSettings.lotSize * 100);
          dayPnL += tradePnL * riskRatio;
        }
      });
      
      currentBalance += dayPnL;
      const drawdown = Math.min(0, currentBalance - fundSettings.initialCapital);
      
      fundData.push({
        date,
        balance: Math.max(0, currentBalance),
        drawdown: Math.abs(drawdown),
        trades: completedTrades.length
      });
    });
    
    return fundData;
  };

  const fundGrowthData = calculateFundGrowth();

  // リスク計算
  const calculateRisk = () => {
    const currentBalance = fundGrowthData.length > 0 
      ? fundGrowthData[fundGrowthData.length - 1].balance 
      : fundSettings.initialCapital;
    
    const riskAmount = fundSettings.compoundInterest 
      ? currentBalance * (fundSettings.riskPerTrade / 100)
      : fundSettings.initialCapital * (fundSettings.riskPerTrade / 100);
    
    const maxDrawdown = fundGrowthData.length > 0 
      ? Math.max(...fundGrowthData.map(d => d.drawdown)) 
      : 0;
    
    const drawdownPercentage = (maxDrawdown / fundSettings.initialCapital) * 100;
    
    const totalReturn = ((currentBalance - fundSettings.initialCapital) / fundSettings.initialCapital) * 100;
    
    return {
      currentBalance,
      riskAmount,
      maxDrawdown,
      drawdownPercentage,
      totalReturn,
      riskPerPip: riskAmount / (fundSettings.lotSize / 1000),
    };
  };

  const riskData = calculateRisk();

  const saveFundSettings = () => {
    localStorage.setItem('fundManagementSettings', JSON.stringify(fundSettings));
    message.success('資金管理設定を保存しました');
  };

  const loadFundSettings = () => {
    const saved = localStorage.getItem('fundManagementSettings');
    if (saved) {
      setFundSettings(JSON.parse(saved));
      message.success('資金管理設定を読み込みました');
    } else {
      message.warning('保存された資金管理設定がありません');
    }
  };

  const resetToDefaults = () => {
    setFundSettings({
      initialCapital: 300000,
      riskPerTrade: 2,
      lotSize: 10000,
      compoundInterest: true,
      maxDrawdownLimit: 10,
      dailyLossLimit: 5,
      monthlyTarget: 10
    });
    message.info('デフォルト設定に戻しました');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <DollarOutlined /> 資金管理
      </Title>

      {/* 現在の資金状況 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="現在資金"
              value={riskData.currentBalance}
              formatter={(value) => `¥${Number(value).toLocaleString()}`}
              valueStyle={{ color: riskData.currentBalance >= fundSettings.initialCapital ? '#52c41a' : '#f5222d' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="総リターン"
              value={riskData.totalReturn}
              suffix="%"
              precision={2}
              valueStyle={{ color: riskData.totalReturn >= 0 ? '#52c41a' : '#f5222d' }}
              prefix={riskData.totalReturn >= 0 ? '+' : ''}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="最大ドローダウン"
              value={riskData.drawdownPercentage}
              suffix="%"
              precision={2}
              valueStyle={{ color: riskData.drawdownPercentage <= fundSettings.maxDrawdownLimit ? '#52c41a' : '#f5222d' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="1取引リスク額"
              value={riskData.riskAmount}
              formatter={(value) => `¥${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
        </Row>

        {/* ドローダウン警告 */}
        {riskData.drawdownPercentage > fundSettings.maxDrawdownLimit && (
          <Alert
            message="ドローダウン制限を超過"
            description={`現在のドローダウン ${riskData.drawdownPercentage.toFixed(2)}% が制限値 ${fundSettings.maxDrawdownLimit}% を超えています。取引を一時停止することを検討してください。`}
            type="error"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </Card>

      <Row gutter={[24, 24]}>
        {/* 基本設定 */}
        <Col xs={24} lg={12}>
          <Card title={<><CalculatorOutlined /> 基本設定</>}>
            <Form layout="vertical">
              <Form.Item label="初期資金 (円)">
                <InputNumber
                  value={fundSettings.initialCapital}
                  min={10000}
                  max={100000000}
                  step={10000}
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\\d))/g, ',')}
                  parser={value => Number(value!.replace(/\$\s?|(,*)/g, ''))}
                  style={{ width: '100%' }}
                  onChange={(value) => setFundSettings(prev => ({ ...prev, initialCapital: value || 300000 }))}
                />
              </Form.Item>

              <Form.Item label={`1取引あたりリスク: ${fundSettings.riskPerTrade}%`}>
                <Slider
                  value={fundSettings.riskPerTrade}
                  min={0.1}
                  max={10}
                  step={0.1}
                  onChange={(value) => setFundSettings(prev => ({ ...prev, riskPerTrade: value }))}
                  marks={{
                    1: '1%',
                    2: '2%',
                    5: '5%',
                    10: '10%'
                  }}
                />
                <Text type="secondary">推奨: 1-3%</Text>
              </Form.Item>

              <Form.Item label="基本ロットサイズ (通貨)">
                <InputNumber
                  value={fundSettings.lotSize}
                  min={1000}
                  max={1000000}
                  step={1000}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\\d))/g, ',')}
                  parser={value => Number(value!.replace(/(,*)/g, ''))}
                  style={{ width: '100%' }}
                  onChange={(value) => setFundSettings(prev => ({ ...prev, lotSize: value || 10000 }))}
                />
                <Text type="secondary">現在: {(fundSettings.lotSize / 10000).toFixed(1)}万通貨</Text>
              </Form.Item>

              <Form.Item label="複利運用">
                <Switch
                  checked={fundSettings.compoundInterest}
                  onChange={(checked) => setFundSettings(prev => ({ ...prev, compoundInterest: checked }))}
                  checkedChildren="ON"
                  unCheckedChildren="OFF"
                />
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">
                    {fundSettings.compoundInterest 
                      ? '利益を元本に加えて運用します（リスク額が増減）' 
                      : '初期資金に対して固定リスクで運用します'}
                  </Text>
                </div>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* リスク管理設定 */}
        <Col xs={24} lg={12}>
          <Card title={<><WarningOutlined /> リスク管理設定</>}>
            <Form layout="vertical">
              <Form.Item label={`最大ドローダウン制限: ${fundSettings.maxDrawdownLimit}%`}>
                <Slider
                  value={fundSettings.maxDrawdownLimit}
                  min={5}
                  max={30}
                  step={1}
                  onChange={(value) => setFundSettings(prev => ({ ...prev, maxDrawdownLimit: value }))}
                  marks={{
                    10: '10%',
                    15: '15%',
                    20: '20%'
                  }}
                />
                <Text type="secondary">この値を超えたら取引停止を検討</Text>
              </Form.Item>

              <Form.Item label={`日次損失制限: ${fundSettings.dailyLossLimit}%`}>
                <Slider
                  value={fundSettings.dailyLossLimit}
                  min={1}
                  max={15}
                  step={0.5}
                  onChange={(value) => setFundSettings(prev => ({ ...prev, dailyLossLimit: value }))}
                  marks={{
                    3: '3%',
                    5: '5%',
                    10: '10%'
                  }}
                />
                <Text type="secondary">1日でこの%以上損失したら取引停止</Text>
              </Form.Item>

              <Form.Item label={`月間目標: ${fundSettings.monthlyTarget}%`}>
                <Slider
                  value={fundSettings.monthlyTarget}
                  min={1}
                  max={50}
                  step={1}
                  onChange={(value) => setFundSettings(prev => ({ ...prev, monthlyTarget: value }))}
                  marks={{
                    5: '5%',
                    10: '10%',
                    20: '20%'
                  }}
                />
                <Text type="secondary">月間リターン目標</Text>
              </Form.Item>

              <Divider />

              <div style={{ 
                padding: '12px', 
                background: '#f0f9ff', 
                border: '1px solid #91d5ff',
                borderRadius: '6px'
              }}>
                <Text strong style={{ color: '#096dd9' }}>
                  <InfoCircleOutlined /> 現在のリスク計算
                </Text>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  <div>• リスク額: ¥{riskData.riskAmount.toLocaleString()}</div>
                  <div>• 1pipあたり: ¥{Math.round(riskData.riskPerPip).toLocaleString()}</div>
                  <div>• 運用方式: {fundSettings.compoundInterest ? '複利' : '単利'}</div>
                  <div>• 推奨SL幅: {Math.round(riskData.riskAmount / riskData.riskPerPip)}pips以内</div>
                </div>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* 資金推移グラフ */}
      {fundGrowthData.length > 0 && (
        <Card 
          title={<><RiseOutlined /> 資金推移グラフ</>}
          style={{ marginTop: '24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <FundGrowthChart 
              data={fundGrowthData}
              initialCapital={fundSettings.initialCapital}
              width={900}
              height={350}
            />
          </div>
          
          {/* 目標達成状況 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div>
                <Text strong>月間目標達成状況</Text>
                <Progress 
                  percent={Math.min(100, Math.max(0, (riskData.totalReturn / fundSettings.monthlyTarget) * 100))}
                  status={riskData.totalReturn >= fundSettings.monthlyTarget ? 'success' : 'active'}
                  format={() => `${riskData.totalReturn.toFixed(1)}% / ${fundSettings.monthlyTarget}%`}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <Text strong>ドローダウン状況</Text>
                <Progress 
                  percent={Math.min(100, (riskData.drawdownPercentage / fundSettings.maxDrawdownLimit) * 100)}
                  status={riskData.drawdownPercentage > fundSettings.maxDrawdownLimit ? 'exception' : 'normal'}
                  format={() => `${riskData.drawdownPercentage.toFixed(1)}% / ${fundSettings.maxDrawdownLimit}%`}
                />
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 操作ボタン */}
      <Card style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={saveFundSettings}
            size="large"
          >
            設定保存
          </Button>
          <Button 
            icon={<FolderOpenOutlined />} 
            onClick={loadFundSettings}
            size="large"
          >
            設定読込
          </Button>
          <Button 
            onClick={resetToDefaults}
            size="large"
          >
            デフォルトに戻す
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default FundManagement;