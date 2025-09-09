import React from 'react';
import { Modal, Typography, Card, Row, Col, Tag } from 'antd';
import { ClockCircleOutlined, GlobalOutlined, RiseOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface SessionInfo {
  name: string;
  color: string;
  time: string;
  characteristics: string[];
  tradingTips: string[];
  volatility: 'high' | 'medium' | 'low';
}

const sessionDetails: SessionInfo[] = [
  {
    name: 'シドニー',
    color: '#13c2c2',
    time: '6:00 - 9:00 JST',
    characteristics: [
      'オセアニア市場の開始',
      '流動性は比較的低め',
      'AUD/USD、NZD/USDが活発'
    ],
    tradingTips: [
      'レンジ相場になりやすい',
      'オセアニア通貨ペアに注目',
      '重要指標発表時は注意'
    ],
    volatility: 'low'
  },
  {
    name: '東京',
    color: '#52c41a',
    time: '9:00 - 15:00 JST',
    characteristics: [
      'アジア最大の金融市場',
      'USD/JPY、クロス円が活発',
      '日本の経済指標に敏感'
    ],
    tradingTips: [
      'TORB戦略が有効',
      '9:55の仲値に注目',
      'ランチタイム（12:00-13:00）は動き鈍化'
    ],
    volatility: 'medium'
  },
  {
    name: '東京後場',
    color: '#722ed1',
    time: '15:00 - 16:00 JST',
    characteristics: [
      '東京市場の後場',
      'ヨーロッパ勢参入前',
      '比較的穏やかな動き'
    ],
    tradingTips: [
      '次のセッションへの準備時間',
      'ポジション調整が多い',
      '大きなトレンドは少ない'
    ],
    volatility: 'low'
  },
  {
    name: 'ロンドン',
    color: '#1890ff',
    time: '16:00 - 22:00 JST',
    characteristics: [
      '世界最大の外国為替市場',
      'EUR/USD、GBP/USDが活発',
      '高い流動性とボラティリティ'
    ],
    tradingTips: [
      '16:00のロンドンフィックスに注目',
      'トレンドフォローが有効',
      'ヨーロッパの経済指標要注意'
    ],
    volatility: 'high'
  },
  {
    name: 'NY序盤',
    color: '#fa8c16',
    time: '22:00 - 2:00 JST',
    characteristics: [
      'NY市場開始、最高の流動性',
      '全通貨ペアが活発',
      'US経済指標の影響大'
    ],
    tradingTips: [
      '22:30頃が最も活発',
      'ブレイクアウト狙いが有効',
      '雇用統計等重要指標に注意'
    ],
    volatility: 'high'
  },
  {
    name: 'NY後半',
    color: '#f5222d',
    time: '2:00 - 6:00 JST',
    characteristics: [
      'NY市場後半、流動性低下',
      'ポジション調整が中心',
      '翌日への準備時間'
    ],
    tradingTips: [
      'スキャルピングは避ける',
      'レンジ相場になりやすい',
      'オセアニア指標発表に注意'
    ],
    volatility: 'low'
  }
];

interface SessionHelpModalProps {
  visible: boolean;
  onCancel: () => void;
}

const SessionHelpModal: React.FC<SessionHelpModalProps> = ({ visible, onCancel }) => {
  const getVolatilityTag = (volatility: string) => {
    const config = {
      high: { color: 'red', text: '高' },
      medium: { color: 'orange', text: '中' },
      low: { color: 'green', text: '低' }
    };
    return <Tag color={config[volatility as keyof typeof config].color}>
      ボラティリティ: {config[volatility as keyof typeof config].text}
    </Tag>;
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GlobalOutlined />
          <span>FX取引セッション詳細</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Paragraph>
          外国為替市場は24時間開いており、主要な取引セッションごとに異なる特徴があります。
          各セッションの特性を理解することで、より効果的な取引戦略を立てることができます。
        </Paragraph>

        <Row gutter={[16, 16]}>
          {sessionDetails.map((session, index) => (
            <Col span={12} key={index}>
              <Card
                size="small"
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: session.color,
                        borderRadius: '50%'
                      }}
                    />
                    <span>{session.name}セッション</span>
                  </div>
                }
                extra={getVolatilityTag(session.volatility)}
              >
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>
                    <ClockCircleOutlined /> {session.time}
                  </Text>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <Text strong>特徴:</Text>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {session.characteristics.map((char, idx) => (
                      <li key={idx} style={{ fontSize: '12px' }}>{char}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Text strong>
                    <RiseOutlined /> 取引のコツ:
                  </Text>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {session.tradingTips.map((tip, idx) => (
                      <li key={idx} style={{ fontSize: '12px' }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Card style={{ marginTop: '16px', background: '#f6f8fa' }} size="small">
          <Title level={5}>💡 TORB戦略について</Title>
          <Paragraph style={{ fontSize: '12px', margin: 0 }}>
            Tokyo Open Range Breakout（TORB）は東京市場開始後の値動きを利用した戦略です。
            9:00-11:00の高値・安値を基準に、ブレイクアウトを狙います。
            当システムでは自動的にTORBレベルを監視し、シグナルを提供しています。
          </Paragraph>
        </Card>
      </div>
    </Modal>
  );
};

export default SessionHelpModal;