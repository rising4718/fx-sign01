import React from 'react';
import { Layout, Card, Form, InputNumber, Switch, TimePicker, Button, Row, Col, Typography, Divider, Space, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import AntHeader from '../components/AntHeader';
import { useSettings } from '../contexts/SettingsContext';

const { Content } = Layout;
const { Title, Text } = Typography;

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetSettings, isDemo } = useSettings();
  const [form] = Form.useForm();

  const handleSave = (values: any) => {
    try {
      const updates = {
        demo: {
          ...settings.demo,
          initialBalance: values.initialBalance,
          lotSize: values.lotSize,
          riskPercentage: values.riskPercentage,
        },
        trading: {
          ...settings.trading,
          autoTrading: values.autoTrading,
          maxPositions: values.maxPositions,
          forceCloseTime: values.forceCloseTime.format('HH:mm'),
        },
        notifications: {
          ...settings.notifications,
          sound: {
            ...settings.notifications.sound,
            enabled: values.soundEnabled,
          },
        },
        risk: {
          ...settings.risk,
          maxDrawdown: values.maxDrawdown,
          dailyLossLimit: values.dailyLossLimit,
          maxDailyTrades: values.maxDailyTrades,
        },
      };

      updateSettings(updates);
      message.success('設定を保存しました');
    } catch (error) {
      message.error('設定の保存に失敗しました');
    }
  };

  const handleReset = () => {
    resetSettings();
    form.resetFields();
    message.info('設定をリセットしました');
  };

  // フォームの初期値設定
  const initialValues = {
    initialBalance: settings.demo.initialBalance,
    lotSize: settings.demo.lotSize,
    riskPercentage: settings.demo.riskPercentage,
    autoTrading: settings.trading.autoTrading,
    maxPositions: settings.trading.maxPositions,
    forceCloseTime: dayjs(settings.trading.forceCloseTime, 'HH:mm'),
    soundEnabled: settings.notifications.sound.enabled,
    maxDrawdown: settings.risk.maxDrawdown,
    dailyLossLimit: settings.risk.dailyLossLimit,
    maxDailyTrades: settings.risk.maxDailyTrades,
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AntHeader />
      <Content style={{ padding: '16px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Title level={2} style={{ color: '#ffffff', marginBottom: '24px' }}>
            ⚙️ システム設定
          </Title>

          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={handleSave}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Card title="💰 デモ取引設定" style={{ marginBottom: '24px' }}>
                  <Form.Item
                    label="初期資金"
                    name="initialBalance"
                    rules={[{ required: true, message: '初期資金を入力してください' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={10000}
                      max={10000000}
                      step={10000}
                      formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => Number(value!.replace(/¥\s?|(,*)/g, '')) as any}
                    />
                  </Form.Item>

                  <Form.Item
                    label="取引ロット数"
                    name="lotSize"
                    rules={[{ required: true, message: '取引ロット数を入力してください' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1000}
                      max={100000}
                      step={1000}
                      formatter={value => `${value} 通貨`}
                      parser={value => Number(value!.replace(' 通貨', '')) as any}
                    />
                  </Form.Item>

                  <Form.Item
                    label="リスク許容度"
                    name="riskPercentage"
                    rules={[{ required: true, message: 'リスク許容度を入力してください' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0.1}
                      max={10}
                      step={0.1}
                      formatter={value => `${value}%`}
                      parser={value => Number(value!.replace('%', '')) as any}
                    />
                  </Form.Item>
                </Card>

                <Card title="🤖 自動取引設定" style={{ marginBottom: '24px' }}>
                  <Form.Item name="autoTrading" valuePropName="checked">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>自動取引を有効にする</Text>
                      <Switch />
                    </div>
                  </Form.Item>

                  <Form.Item
                    label="最大同時ポジション数"
                    name="maxPositions"
                    rules={[{ required: true, message: '最大ポジション数を入力してください' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={5}
                      step={1}
                    />
                  </Form.Item>

                  <Form.Item
                    label="強制決済時刻"
                    name="forceCloseTime"
                    rules={[{ required: true, message: '強制決済時刻を選択してください' }]}
                  >
                    <TimePicker
                      style={{ width: '100%' }}
                      format="HH:mm"
                      placeholder="15:00"
                    />
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="🔔 通知設定" style={{ marginBottom: '24px' }}>
                  <Form.Item name="soundEnabled" valuePropName="checked">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>音声通知を有効にする</Text>
                      <Switch />
                    </div>
                  </Form.Item>
                  
                  <Divider />
                  
                  <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
                    <Text type="secondary">
                      Discord・LINE連携は今後のアップデートで対応予定
                    </Text>
                  </div>
                </Card>

                <Card title="⚠️ リスク管理" style={{ marginBottom: '24px' }}>
                  <Form.Item
                    label="最大ドローダウン"
                    name="maxDrawdown"
                    rules={[{ required: true, message: '最大ドローダウンを入力してください' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={10000}
                      max={100000}
                      step={5000}
                      formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => Number(value!.replace(/¥\s?|(,*)/g, '')) as any}
                    />
                  </Form.Item>

                  <Form.Item
                    label="1日の最大損失額"
                    name="dailyLossLimit"
                    rules={[{ required: true, message: '1日の最大損失額を入力してください' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={5000}
                      max={50000}
                      step={5000}
                      formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => Number(value!.replace(/¥\s?|(,*)/g, '')) as any}
                    />
                  </Form.Item>

                  <Form.Item
                    label="1日の最大取引回数"
                    name="maxDailyTrades"
                    rules={[{ required: true, message: '1日の最大取引回数を入力してください' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </Form.Item>
                </Card>
              </Col>
            </Row>

            <Card style={{ marginTop: '24px' }}>
              <Space size="middle">
                <Button type="primary" htmlType="submit" size="large">
                  設定を保存
                </Button>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleReset}
                  size="large"
                >
                  リセット
                </Button>
              </Space>

              <div style={{ marginTop: '16px', color: '#8c8c8c', fontSize: '12px' }}>
                <Text type="secondary">
                  現在のモード: {isDemo ? 'デモ取引' : 'リアル取引'}
                  <br />
                  設定は自動的にローカルストレージに保存されます
                </Text>
              </div>
            </Card>
          </Form>
        </div>
      </Content>
    </Layout>
  );
};

export default SettingsPage;