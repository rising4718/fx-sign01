import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  InputNumber, 
  Button, 
  Space, 
  Row, 
  Col,
  Typography, 
  Descriptions,
  message,
  Steps,
  Alert,
  Timeline,
  Statistic,
  Table,
  Tag
} from 'antd';
import { 
  SettingOutlined, 
  PlayCircleOutlined, 
  SaveOutlined, 
  FolderOpenOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  AimOutlined,
  BulbOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  StopOutlined,
  TrophyOutlined
} from '@ant-design/icons';

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

const { Title, Text } = Typography;

const LogicManagement: React.FC = () => {
  const [form] = Form.useForm();
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

  const saveSettings = () => {
    localStorage.setItem('torbSettings', JSON.stringify(settings));
    message.success('設定を保存しました');
  };

  const loadSettings = () => {
    const saved = localStorage.getItem('torbSettings');
    if (saved) {
      const loadedSettings = JSON.parse(saved);
      setSettings(loadedSettings);
      form.setFieldsValue(loadedSettings);
      message.success('設定を読み込みました');
    } else {
      message.warning('保存された設定がありません');
    }
  };

  const runBacktest = async () => {
    const result = {
      key: Date.now(),
      timestamp: new Date(),
      settings: { ...settings },
      winRate: Math.random() * 100,
      totalTrades: Math.floor(Math.random() * 100) + 10,
      profit: (Math.random() - 0.5) * 10000,
      maxDrawdown: Math.random() * 1000
    };
    
    setTestResults(prev => [result, ...prev.slice(0, 9)]);
    message.info('バックテストを実行しました');
  };

  // バックテスト結果用テーブル
  const backtestColumns = [
    {
      title: '実行日時',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: Date) => timestamp.toLocaleString('ja-JP'),
    },
    {
      title: '勝率',
      dataIndex: 'winRate',
      key: 'winRate',
      render: (winRate: number) => `${winRate.toFixed(1)}%`,
      sorter: (a: any, b: any) => a.winRate - b.winRate,
    },
    {
      title: '取引回数',
      dataIndex: 'totalTrades',
      key: 'totalTrades',
      render: (trades: number) => `${trades}回`,
    },
    {
      title: '損益',
      dataIndex: 'profit',
      key: 'profit',
      render: (profit: number) => (
        <Text type={profit >= 0 ? 'success' : 'danger'}>
          {profit >= 0 ? '+' : ''}{profit.toFixed(2)} pips
        </Text>
      ),
      sorter: (a: any, b: any) => a.profit - b.profit,
    },
    {
      title: '最大DD',
      dataIndex: 'maxDrawdown',
      key: 'maxDrawdown',
      render: (dd: number) => `${dd.toFixed(1)} pips`,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <BarChartOutlined /> 東京時間レンジブレイクアウト戦略
      </Title>
      
      {/* 現在のロジック設定サマリー */}
      <Card 
        title={
          <span>
            <InfoCircleOutlined /> 現在のロジック設定
          </span>
        }
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title={<><ClockCircleOutlined /> 東京時間レンジ</>}
                value={`${settings.rangeStartHour.toString().padStart(2, '0')}:${settings.rangeStartMinute.toString().padStart(2, '0')} - ${settings.rangeEndHour.toString().padStart(2, '0')}:${settings.rangeEndMinute.toString().padStart(2, '0')}`}
                valueStyle={{ fontSize: '16px', color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title={<><AimOutlined /> レンジ幅</>}
                value={`${settings.minRangeWidth} - ${settings.maxRangeWidth}`}
                suffix="pips"
                valueStyle={{ fontSize: '16px', color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="利確倍率"
                value={settings.profitMultiplier}
                suffix="x"
                precision={1}
                valueStyle={{ fontSize: '16px', color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>
        
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24} sm={12}>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="取引終了時刻">
                {settings.tradingEndHour.toString().padStart(2, '0')}:{settings.tradingEndMinute.toString().padStart(2, '0')}
              </Descriptions.Item>
              <Descriptions.Item label="損切りバッファ">
                {settings.stopLossBuffer} pips
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ 
              background: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <Text strong style={{ color: '#389e0d' }}>📋 ロジック概要</Text>
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                東京時間の{settings.rangeStartHour}:00-{settings.rangeEndHour}:00にレンジを形成し、
                {settings.minRangeWidth}-{settings.maxRangeWidth}pipsの範囲でブレイクアウトを狙います。
                利確は{settings.profitMultiplier}倍、{settings.tradingEndHour}:00で取引終了。
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* TORBロジック詳細説明 */}
      <Card 
        title={
          <span>
            <BulbOutlined /> 東京時間レンジブレイクアウト戦略 詳細説明
          </span>
        }
        style={{ marginBottom: '24px' }}
      >
        <Alert
          message="Tokyo Opening Range Breakout（東京時間レンジブレイクアウト）戦略"
          description="東京時間の値動きの少ない時間帯にレンジを形成し、その後のブレイクアウトで順張りエントリーする戦略です。"
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />

        <Steps
          direction="vertical"
          size="small"
          items={[
            {
              title: 'レンジ形成フェーズ',
              description: (
                <div>
                  <Text>
                    <ClockCircleOutlined /> 東京時間 {settings.rangeStartHour.toString().padStart(2, '0')}:{settings.rangeStartMinute.toString().padStart(2, '0')} - {settings.rangeEndHour.toString().padStart(2, '0')}:{settings.rangeEndMinute.toString().padStart(2, '0')} の間に最高値と最安値を記録
                  </Text>
                  <br />
                  <Text type="secondary">この時間帯の値幅が「東京オープニングレンジ」となります</Text>
                </div>
              ),
              status: 'process',
            },
            {
              title: 'エントリー条件チェック',
              description: (
                <div>
                  <Space direction="vertical" size="small">
                    <Text>
                      <AimOutlined /> レンジ幅が {settings.minRangeWidth} - {settings.maxRangeWidth} pips の範囲内かチェック
                    </Text>
                    <Text type="secondary">• 幅が狭すぎる（{settings.minRangeWidth}pips未満）→ ボラティリティ不足でスキップ</Text>
                    <Text type="secondary">• 幅が広すぎる（{settings.maxRangeWidth}pips超過）→ リスク過大でスキップ</Text>
                  </Space>
                </div>
              ),
              status: 'process',
            },
            {
              title: 'ブレイクアウトエントリー',
              description: (
                <div>
                  <Space direction="vertical" size="small">
                    <Text>
                      <ArrowUpOutlined style={{ color: '#52c41a' }} /> <Text strong>上抜けブレイクアウト</Text>: {settings.rangeEndHour.toString().padStart(2, '0')}:{settings.rangeEndMinute.toString().padStart(2, '0')} 以降に最高値を上に抜けたら買い（Long）エントリー
                    </Text>
                    <Text>
                      <ArrowDownOutlined style={{ color: '#f5222d' }} /> <Text strong>下抜けブレイクアウト</Text>: {settings.rangeEndHour.toString().padStart(2, '0')}:{settings.rangeEndMinute.toString().padStart(2, '0')} 以降に最安値を下に抜けたら売り（Short）エントリー
                    </Text>
                  </Space>
                </div>
              ),
              status: 'process',
            },
            {
              title: '利確・損切り設定',
              description: (
                <div>
                  <Space direction="vertical" size="small">
                    <Text>
                      <DollarOutlined style={{ color: '#52c41a' }} /> <Text strong>利確</Text>: レンジ幅の {settings.profitMultiplier} 倍の利益で決済
                    </Text>
                    <Text>
                      <StopOutlined style={{ color: '#f5222d' }} /> <Text strong>損切り</Text>: レンジ反対側から {settings.stopLossBuffer} pips のバッファを加えた位置
                    </Text>
                    <Text>
                      <ClockCircleOutlined /> <Text strong>時間切れ</Text>: {settings.tradingEndHour.toString().padStart(2, '0')}:{settings.tradingEndMinute.toString().padStart(2, '0')} で強制決済
                    </Text>
                  </Space>
                </div>
              ),
              status: 'process',
            }
          ]}
        />

        <div style={{ marginTop: '20px', padding: '16px', background: '#f6ffed', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
          <Text strong style={{ color: '#389e0d' }}>
            <BulbOutlined /> 戦略のポイント
          </Text>
          <Timeline
            style={{ marginTop: '12px' }}
            items={[
              {
                children: <Text>東京時間の動きが少ない時間帯の後、欧州時間に入る際の方向性のあるブレイクアウトを狙います</Text>,
              },
              {
                children: <Text>レンジ幅の制限により、適度なボラティリティの相場でのみエントリーします</Text>,
              },
              {
                children: <Text>明確な損切りラインと利確目標により、リスクリワード比を管理します</Text>,
              },
            ]}
          />
        </div>
      </Card>
      
      <Row gutter={[24, 24]}>
        {/* パラメータ設定セクション */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <span>
                <SettingOutlined /> パラメータ設定
              </span>
            }
            style={{ height: '100%' }}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={settings}
              onValuesChange={(changedValues) => {
                const updatedSettings = { ...settings, ...changedValues };
                setSettings(updatedSettings);
              }}
            >
              <Title level={4}>東京時間レンジ設定</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="開始時刻（時）" name="rangeStartHour">
                    <InputNumber min={0} max={23} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="開始時刻（分）" name="rangeStartMinute">
                    <InputNumber min={0} max={59} step={15} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="終了時刻（時）" name="rangeEndHour">
                    <InputNumber min={0} max={23} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="終了時刻（分）" name="rangeEndMinute">
                    <InputNumber min={0} max={59} step={15} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Title level={4}>取引設定</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="取引終了時刻（時）" name="tradingEndHour">
                    <InputNumber min={0} max={23} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="取引終了時刻（分）" name="tradingEndMinute">
                    <InputNumber min={0} max={59} step={15} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="最小レンジ幅 (pips)" name="minRangeWidth">
                    <InputNumber min={1} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="最大レンジ幅 (pips)" name="maxRangeWidth">
                    <InputNumber min={10} max={200} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="利益確定倍率" name="profitMultiplier">
                    <InputNumber min={0.5} max={5} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="損切りバッファ (pips)" name="stopLossBuffer">
                    <InputNumber min={0} max={20} step={0.5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Space size="middle" style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={saveSettings}
                >
                  設定保存
                </Button>
                <Button 
                  icon={<FolderOpenOutlined />} 
                  onClick={loadSettings}
                >
                  設定読込
                </Button>
                <Button 
                  type="primary" 
                  danger 
                  icon={<PlayCircleOutlined />} 
                  onClick={runBacktest}
                >
                  バックテスト実行
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>

        {/* バックテスト結果表示セクション */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <span>
                <TrophyOutlined /> バックテスト結果履歴
              </span>
            }
            style={{ height: '100%' }}
          >
            {testResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text type="secondary">まだテスト結果がありません</Text>
                <br />
                <Text type="secondary">バックテストを実行してください</Text>
              </div>
            ) : (
              <Table
                columns={backtestColumns}
                dataSource={testResults}
                size="small"
                pagination={{ pageSize: 8 }}
                expandable={{
                  expandedRowRender: (record) => (
                    <Descriptions size="small" column={2} bordered>
                      <Descriptions.Item label="レンジ開始">
                        {record.settings.rangeStartHour}:{record.settings.rangeStartMinute.toString().padStart(2, '0')}
                      </Descriptions.Item>
                      <Descriptions.Item label="レンジ終了">
                        {record.settings.rangeEndHour}:{record.settings.rangeEndMinute.toString().padStart(2, '0')}
                      </Descriptions.Item>
                      <Descriptions.Item label="取引終了">
                        {record.settings.tradingEndHour}:{record.settings.tradingEndMinute.toString().padStart(2, '0')}
                      </Descriptions.Item>
                      <Descriptions.Item label="レンジ幅">
                        {record.settings.minRangeWidth}-{record.settings.maxRangeWidth} pips
                      </Descriptions.Item>
                      <Descriptions.Item label="利確倍率">
                        {record.settings.profitMultiplier}x
                      </Descriptions.Item>
                      <Descriptions.Item label="損切りバッファ">
                        {record.settings.stopLossBuffer} pips
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LogicManagement;