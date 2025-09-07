import React from 'react';
import { 
  Layout, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Card, 
  Statistic, 
  Timeline, 
  Space,
  Divider,
  Tag,
  Alert
} from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  BarChartOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  HeartOutlined,
  EyeOutlined,
  WarningOutlined
} from '@ant-design/icons';
import AntHeader from '../components/AntHeader';

const { Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const TORBLandingPage: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AntHeader />
      
      {/* Hero Section */}
      <Content style={{ padding: 0 }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
          padding: '80px 0',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={1} style={{ color: 'white', fontSize: '3rem', marginBottom: '24px' }}>
              東京時間レンジブレイクアウト戦略
            </Title>
            <Paragraph style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', marginBottom: '40px' }}>
              毎朝のレンジから大きな流れに乗るシンプル戦略<br/>
              AIが動かす現代相場で、ストップ狩りを避けてルールで戦う
            </Paragraph>
            <Space size="large">
              <Button type="primary" size="large" style={{ height: '50px', fontSize: '16px', padding: '0 30px' }}>
                今すぐ始める
              </Button>
              <Button size="large" style={{ height: '50px', fontSize: '16px', padding: '0 30px', color: 'white', borderColor: 'white', backgroundColor: 'transparent' }}>
                戦略を学ぶ
              </Button>
            </Space>
          </div>
        </div>

        {/* Statistics Section */}
        <div style={{ padding: '60px 0', background: '#f8f9fa' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Row gutter={[32, 32]} justify="center">
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Statistic 
                    title="平均勝率" 
                    value={72} 
                    suffix="%" 
                    valueStyle={{ color: '#52c41a', fontSize: '2.5rem' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Statistic 
                    title="取引時間" 
                    value={2} 
                    suffix="時間/日" 
                    valueStyle={{ color: '#1890ff', fontSize: '2.5rem' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Statistic 
                    title="リスクリワード" 
                    value={1.5} 
                    suffix=":1" 
                    valueStyle={{ color: '#722ed1', fontSize: '2.5rem' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card style={{ textAlign: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Statistic 
                    title="月間収益率" 
                    value={12} 
                    suffix="%" 
                    valueStyle={{ color: '#f5222d', fontSize: '2.5rem' }}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* Strategy Explanation */}
        <div style={{ padding: '80px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '60px' }}>
              東京時間レンジブレイクアウト戦略とは？
            </Title>
            
            <Row gutter={[48, 48]} align="middle">
              <Col xs={24} lg={12}>
                <Title level={3} style={{ color: '#1890ff' }}>
                  <ClockCircleOutlined /> 東京時間の特性を活用
                </Title>
                <Paragraph style={{ fontSize: '16px', lineHeight: '1.8' }}>
                  東京市場の<strong>9:00から11:00の2時間</strong>は観察期間として、相場が静かな時間に形成される<strong>「東京ボックス」（レンジ）</strong>を特定します。
                  実際のエントリーは、大口資金が動く<strong>欧州時間（16:00-18:00）やNY序盤（21:30-23:00）</strong>で、
                  そのレンジをブレイクアウトするタイミングを狙います。つまり<strong>「大口が動く前に準備し、大口が動く時に便乗する」</strong>戦略です。
                </Paragraph>
                
                <Title level={4} style={{ marginTop: '24px' }}>主な特徴：</Title>
                <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
                  <li>明確なエントリーポイント</li>
                  <li>リスク管理がしやすい</li>
                  <li>短時間で結果が出る</li>
                  <li>日本時間で取引しやすい</li>
                </ul>
              </Col>
              
              <Col xs={24} lg={12}>
                <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  <Timeline
                    items={[
                      {
                        dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
                        children: (
                          <div>
                            <Text strong>9:00-11:00</Text>
                            <br />東京ボックス形成<br />
                            レンジの高値・安値を特定
                          </div>
                        ),
                      },
                      {
                        dot: <RiseOutlined style={{ fontSize: '16px', color: '#52c41a' }} />,
                        children: (
                          <div>
                            <Text strong>16:00-18:00</Text>
                            <br />欧州初動時間<br />
                            ブレイクアウトエントリー
                          </div>
                        ),
                      },
                      {
                        dot: <ThunderboltOutlined style={{ fontSize: '16px', color: '#faad14' }} />,
                        children: (
                          <div>
                            <Text strong>21:30-23:00</Text>
                            <br />NY序盤時間<br />
                            第二のエントリーチャンス
                          </div>
                        ),
                      },
                      {
                        dot: <TrophyOutlined style={{ fontSize: '16px', color: '#faad14' }} />,
                        children: (
                          <div>
                            <Text strong>利確・損切り</Text>
                            <br />目標利益達成または<br />
                            ストップロス発動
                          </div>
                        ),
                      },
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* AI and Algorithm Trading Section */}
        <div style={{ padding: '80px 0', background: '#ffffff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
              🤖 相場を動かすのはAIと自動売買システム
            </Title>
            <Row gutter={[48, 32]} align="middle">
              <Col xs={24} lg={12}>
                <Card style={{ padding: '20px', border: 'none' }}>
                  <Paragraph style={{ fontSize: '16px', lineHeight: '1.8' }}>
                    いまの相場は、人間が手で取引しているだけではありません。<br />
                    世界中の銀行や大手ファンドは <strong>AIによって設計された自動売買プログラム（アルゴリズム取引）</strong> を使い、
                    人間では不可能な速さと精度でミリ秒単位の売買を行っています。
                  </Paragraph>
                  <div style={{ marginTop: '20px' }}>
                    <Alert
                      message="重要ポイント"
                      description={
                        <div>
                          <p>• 朝の東京時間は静かで「レンジ」が作られる</p>
                          <p>• 夕方16時、ヨーロッパ市場が開くと <strong>自動売買システムが一斉に稼働し、相場が一気に動き出す</strong></p>
                        </div>
                      }
                      type="info"
                      showIcon
                    />
                  </div>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card style={{ textAlign: 'center', background: '#f0f8ff', border: '2px solid #1890ff' }}>
                  <RobotOutlined style={{ fontSize: '80px', color: '#1890ff', marginBottom: '20px' }} />
                  <Title level={4} style={{ color: '#1890ff' }}>AI駆動の市場</Title>
                  <Paragraph>
                    「静かな時間に形を作り → 動き出す時間に突破する」のが、この戦略の基本です。
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* Stop Hunting Section */}
        <div style={{ padding: '80px 0', background: '#fff2e8' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
              💥 ストップ狩りとは？
            </Title>
            <Row gutter={[48, 32]} align="middle">
              <Col xs={24} lg={12}>
                <Card style={{ background: '#ffebcc', border: '2px solid #faad14' }}>
                  <WarningOutlined style={{ fontSize: '60px', color: '#faad14', display: 'block', textAlign: 'center', marginBottom: '20px' }} />
                  <Paragraph style={{ fontSize: '16px', lineHeight: '1.8' }}>
                    多くの個人トレーダーは、レンジの上下に「逆指値注文（ストップ）」を置きます。<br />
                    大手の自動売買はそれを狙って一度レンジを抜け、損切りを巻き込んで逆方向に戻すことがあります。<br />
                    これが <strong>ストップ狩り</strong>。
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card style={{ padding: '20px' }}>
                  <Title level={4} style={{ color: '#fa541c' }}>初心者が必ず経験する失敗</Title>
                  <Paragraph>
                    「抜けた！と思ったら逆行して負けた…」という経験を必ずします。<br />
                    👉 実はこれが、大口資金が仕掛けている典型的なパターンです。
                  </Paragraph>
                  
                  <Divider />
                  
                  <Title level={4} style={{ color: '#52c41a' }}>🛡️ 対策：二段目で入る</Title>
                  <Paragraph>
                    「東京ボックス戦略」では、<strong>最初の抜けでは入らず</strong>、
                  </Paragraph>
                  <ul>
                    <li>一度戻してから</li>
                    <li>再び突破する「二段目」でエントリーする</li>
                  </ul>
                  <Paragraph>
                    これにより <strong>ストップ狩りに巻き込まれるリスクを大幅に減らせます。</strong><br />
                    👉 つまり <strong>"大口が罠を仕掛けてから動く本流" にだけ乗る</strong>のです。
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* Emotional Trading Problems */}
        <div style={{ padding: '80px 0', background: '#f6f6f6' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
              😓 裁量トレードが勝てない理由
            </Title>
            <Row gutter={[32, 32]}>
              <Col xs={24} lg={8}>
                <Card style={{ textAlign: 'center', height: '100%' }}>
                  <HeartOutlined style={{ fontSize: '60px', color: '#fa541c', marginBottom: '20px' }} />
                  <Title level={4}>感情の罠</Title>
                  <ul style={{ textAlign: 'left' }}>
                    <li>連敗で「取り返したい」と焦って無理なエントリー</li>
                    <li>少し利益が出ると「すぐ利確」してしまう</li>
                    <li>損失は「戻るはず」と我慢してしまう</li>
                    <li><strong>負けた理由が感情的で分析・改善できない</strong></li>
                  </ul>
                  <Alert message="結果: 損大利小で資金減少" type="error" />
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card style={{ textAlign: 'center', height: '100%', background: '#f0f8ff' }}>
                  <SafetyCertificateOutlined style={{ fontSize: '60px', color: '#1890ff', marginBottom: '20px' }} />
                  <Title level={4}>ルール化の強み</Title>
                  <ul style={{ textAlign: 'left' }}>
                    <li><strong>取引する時間と条件を決める</strong> → 無駄なトレードを防ぐ</li>
                    <li><strong>損切り・利確ルールを固定</strong> → 利小損大を防ぎ、リスクリワードを確保</li>
                    <li><strong>結果を毎日記録・公開</strong> → 勝ち負けの理由を分析でき、改善につながる</li>
                    <li><strong>感情ではなくルールで取引</strong> → 負けた時も明確な理由で分析・改善可能</li>
                  </ul>
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card style={{ textAlign: 'center', height: '100%', background: '#f6ffed' }}>
                  <CheckCircleOutlined style={{ fontSize: '60px', color: '#52c41a', marginBottom: '20px' }} />
                  <Title level={4}>データで戦う</Title>
                  <Paragraph>
                    感情ではなく、<strong>ルールとデータで戦うから生き残れる</strong>のです。<br/>
                    負けた時も「なぜ負けたか」が明確なので、<strong>次に活かせる貴重なデータ</strong>になります。
                  </Paragraph>
                  <Tag color="green" style={{ fontSize: '14px', padding: '4px 8px' }}>
                    継続的な成果
                  </Tag>
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ padding: '80px 0', background: '#f8f9fa' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '60px' }}>
              システムの特徴
            </Title>
            
            <Row gutter={[32, 32]}>
              <Col xs={24} md={12} lg={8}>
                <Card 
                  style={{ height: '100%', textAlign: 'center' }}
                  hoverable
                  cover={
                    <div style={{ padding: '40px 0', background: '#e6f7ff' }}>
                      <BarChartOutlined style={{ fontSize: '60px', color: '#1890ff' }} />
                    </div>
                  }
                >
                  <Title level={4}>リアルタイム分析</Title>
                  <Paragraph>
                    市場データをリアルタイムで分析し、
                    最適なエントリーポイントを自動で検出します。
                  </Paragraph>
                </Card>
              </Col>
              
              <Col xs={24} md={12} lg={8}>
                <Card 
                  style={{ height: '100%', textAlign: 'center' }}
                  hoverable
                  cover={
                    <div style={{ padding: '40px 0', background: '#f6ffed' }}>
                      <SafetyCertificateOutlined style={{ fontSize: '60px', color: '#52c41a' }} />
                    </div>
                  }
                >
                  <Title level={4}>リスク管理</Title>
                  <Paragraph>
                    自動ストップロスとテイクプロフィット機能で、
                    損失を限定し利益を最大化します。
                  </Paragraph>
                </Card>
              </Col>
              
              <Col xs={24} md={12} lg={8}>
                <Card 
                  style={{ height: '100%', textAlign: 'center' }}
                  hoverable
                  cover={
                    <div style={{ padding: '40px 0', background: '#fff7e6' }}>
                      <ThunderboltOutlined style={{ fontSize: '60px', color: '#faad14' }} />
                    </div>
                  }
                >
                  <Title level={4}>高速執行</Title>
                  <Paragraph>
                    ミリ秒単位での高速注文執行により、
                    最良の価格でのエントリーを実現します。
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* Strategy Rules */}
        <div style={{ padding: '80px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '60px' }}>
              戦略ルール
            </Title>
            
            <Row gutter={[48, 48]}>
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <span style={{ color: '#52c41a' }}>
                      <RiseOutlined /> ロング戦略
                    </span>
                  }
                  style={{ height: '100%' }}
                >
                  <Title level={4}>エントリー条件：</Title>
                  <ul>
                    <li>9:45以降、レンジ高値突破</li>
                    <li>5分足RSI &gt; 55かつ上昇中</li>
                    <li>前日NYクローズより上位</li>
                  </ul>
                  
                  <Divider />
                  
                  <Title level={4}>利確・損切り：</Title>
                  <ul>
                    <li><Tag color="green">利確</Tag>突破幅の1.5倍</li>
                    <li><Tag color="red">損切り</Tag>レンジ下限-5pips</li>
                  </ul>
                </Card>
              </Col>
              
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <span style={{ color: '#f5222d' }}>
                      <FallOutlined /> ショート戦略
                    </span>
                  }
                  style={{ height: '100%' }}
                >
                  <Title level={4}>エントリー条件：</Title>
                  <ul>
                    <li>9:45以降、レンジ安値下抜け</li>
                    <li>5分足RSI &lt; 45かつ下降中</li>
                    <li>前日NYクローズより下位</li>
                  </ul>
                  
                  <Divider />
                  
                  <Title level={4}>利確・損切り：</Title>
                  <ul>
                    <li><Tag color="green">利確</Tag>突破幅の1.5倍</li>
                    <li><Tag color="red">損切り</Tag>レンジ上限+5pips</li>
                  </ul>
                </Card>
              </Col>
            </Row>
            
            <Alert
              message="フィルター条件"
              description="レンジ幅：15pips以上50pips以下 / 前日ボラティリティ：80pips以下 / 経済指標発表前後30分は取引停止"
              type="info"
              showIcon
              style={{ marginTop: '40px' }}
            />
          </div>
        </div>

        {/* Safety and Risk Management Section */}
        <div style={{ padding: '80px 0', background: '#f0f8ff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
              🔒 安全性も徹底
            </Title>
            <Row gutter={[32, 32]} align="middle">
              <Col xs={24} lg={12}>
                <Card style={{ background: '#ffffff', border: '2px solid #1890ff' }}>
                  <Title level={4} style={{ color: '#1890ff' }}>
                    <SafetyCertificateOutlined /> 資金管理の安全設計
                  </Title>
                  <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
                    <li><strong>1回あたりのリスクは資金の1%まで</strong> → 100回連続で負けても資金は残る設計</li>
                    <li><strong>ドローダウン20%で一時停止</strong> → 大きな損失を防ぐセーフティネット</li>
                    <li><strong>週単位・月単位の損失上限設定</strong> → 感情的な取り返しを防止</li>
                  </ul>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card style={{ background: '#f6ffed', border: '2px solid #52c41a' }}>
                  <Title level={4} style={{ color: '#52c41a' }}>
                    <CheckCircleOutlined /> 透明性のある運用
                  </Title>
                  <ul style={{ fontSize: '16px', lineHeight: '1.8' }}>
                    <li><strong>すべての取引結果を記録・公開</strong> → 勝ち負けを隠さず、データで証明</li>
                    <li><strong>バックテスト結果も全公開</strong> → 過去10年分の検証データを確認可能</li>
                    <li><strong>リアルタイムでの成績更新</strong> → 嘘のない、ありのままの結果を毎日更新</li>
                  </ul>
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <Alert
                message="安全第一の設計思想"
                description="「勝つこと」より「負けすぎないこと」を最優先に設計されています。長期的に安定した成果を目指します。"
                type="success"
                showIcon
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        </div>

        {/* Performance Disclosure Section */}
        <div style={{ padding: '80px 0', background: '#fffbe6' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
              🏆 成績は毎日公開
            </Title>
            <Row gutter={[48, 32]} align="middle">
              <Col xs={24} lg={12}>
                <Card style={{ textAlign: 'center', background: '#ffffff', border: '2px solid #faad14' }}>
                  <EyeOutlined style={{ fontSize: '80px', color: '#faad14', marginBottom: '20px' }} />
                  <Title level={4} style={{ color: '#faad14' }}>完全透明な成績開示</Title>
                  <Paragraph style={{ fontSize: '16px', lineHeight: '1.8' }}>
                    多くの投資商品は「良いところだけ」を宣伝しますが、
                    この戦略では<strong>すべての取引結果を包み隠さず公開</strong>しています。
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card style={{ padding: '20px' }}>
                  <Title level={4}>📊 公開データ項目</Title>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div>✅ 日次損益</div>
                      <div>✅ 勝率</div>
                      <div>✅ 取引回数</div>
                      <div>✅ 最大ドローダウン</div>
                    </Col>
                    <Col span={12}>
                      <div>✅ 月次収益率</div>
                      <div>✅ シャープレシオ</div>
                      <div>✅ 最大連勝/連敗</div>
                      <div>✅ 取引時刻とエントリー価格</div>
                    </Col>
                  </Row>
                  <Divider />
                  <Paragraph>
                    <strong>負けた日、調子の悪い期間も全て公開。</strong><br />
                    👉 だからこそ、この戦略の本当の実力がわかります。
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        {/* Strategy Mechanism Section */}
        <div style={{ padding: '80px 0', background: '#ffffff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
              ⚡ 戦略の仕組み
            </Title>
            <Row gutter={[48, 32]}>
              <Col xs={24} lg={8}>
                <Card style={{ textAlign: 'center', height: '100%', background: '#f0f8ff' }}>
                  <ThunderboltOutlined style={{ fontSize: '60px', color: '#1890ff', marginBottom: '20px' }} />
                  <Title level={4}>1. レンジ検出</Title>
                  <Paragraph>
                    東京市場開場から45分間の値動きを自動分析し、
                    <strong>高値・安値のレンジを自動検出</strong>します。
                  </Paragraph>
                  <Tag color="blue">自動化</Tag>
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card style={{ textAlign: 'center', height: '100%', background: '#f6ffed' }}>
                  <BarChartOutlined style={{ fontSize: '60px', color: '#52c41a', marginBottom: '20px' }} />
                  <Title level={4}>2. 条件判定</Title>
                  <Paragraph>
                    RSI、ボリンジャーバンド、前日終値との位置関係など
                    <strong>複数の技術指標で精度を高めた</strong>エントリー条件を判定。
                  </Paragraph>
                  <Tag color="green">高精度</Tag>
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card style={{ textAlign: 'center', height: '100%', background: '#fff2e8' }}>
                  <SafetyCertificateOutlined style={{ fontSize: '60px', color: '#faad14', marginBottom: '20px' }} />
                  <Title level={4}>3. 自動執行</Title>
                  <Paragraph>
                    条件が整った瞬間に<strong>自動でエントリー・利確・損切り</strong>を実行。
                    人間の感情や判断ミスが入る余地がありません。
                  </Paragraph>
                  <Tag color="gold">確実実行</Tag>
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <Card style={{ background: '#f0f0f0', border: 'none' }}>
                <Title level={4}>🎯 なぜこの戦略が有効なのか？</Title>
                <Paragraph style={{ fontSize: '16px', lineHeight: '1.8', maxWidth: '800px', margin: '0 auto' }}>
                  東京時間は他の市場と比べて<strong>「予測可能性」が高い</strong>時間帯です。<br />
                  欧米のファンドが動き出す前の静かな時間に形成されるレンジは、
                  その後の大きな動きの「起点」となることが統計的に証明されています。<br />
                  <br />
                  👉 <strong>つまり「大口が動く前に、動く方向を予測する」</strong>のがこの戦略の核心です。
                </Paragraph>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          padding: '80px 0',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
            <Title level={2} style={{ color: 'white', marginBottom: '24px' }}>
              今すぐTORB戦略を始めませんか？
            </Title>
            <Paragraph style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', marginBottom: '40px' }}>
              プロが実践する東京時間特化型戦略で、効率的な取引を実現しましょう。
            </Paragraph>
            <Button 
              type="primary" 
              size="large" 
              style={{ 
                height: '60px', 
                fontSize: '18px', 
                padding: '0 40px',
                background: '#52c41a',
                borderColor: '#52c41a'
              }}
            >
              無料で戦略を試す
            </Button>
          </div>
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#001529', color: 'rgba(255,255,255,0.65)' }}>
        <GlobalOutlined /> FX Pattern Analyzer ©2024 Created by Professional Traders
      </Footer>
    </Layout>
  );
};

export default TORBLandingPage;