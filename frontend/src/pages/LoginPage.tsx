import React, { useState, useEffect } from 'react';
import { Layout, Card, Form, Input, Button, Tabs, Typography, Space, Divider, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AntHeader from '../components/AntHeader';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
}

const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // リダイレクト先を取得（デフォルトはホーム）
  const from = (location.state as any)?.from?.pathname || '/';

  // レスポンシブ監視
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // ログイン処理
  const handleLogin = async (values: LoginFormData) => {
    setIsLoading(true);
    try {
      const success = await login(values.email, values.password);
      if (success) {
        navigate(from, { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 登録処理
  const handleRegister = async (values: RegisterFormData) => {
    setIsLoading(true);
    try {
      const success = await register(values.email, values.password, values.displayName);
      if (success) {
        navigate(from, { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AntHeader />
      
      <Content style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        padding: isMobile ? '20px 16px' : '50px 24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: isMobile ? 'calc(100vh - 48px)' : 'calc(100vh - 36px)',
        paddingTop: isMobile ? '60px' : '50px'
      }}>
        <div style={{ width: '100%', maxWidth: isMobile ? '350px' : '400px' }}>
          {/* サービス紹介部分 */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '32px', color: 'white' }}>
            <Title level={isMobile ? 3 : 2} style={{ color: 'white', marginBottom: '8px', fontSize: isMobile ? '20px' : undefined }}>
              FX Pattern Analyzer
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? '14px' : '16px', lineHeight: isMobile ? '1.4' : '1.6' }}>
              東京ボックス・ブレイクアウト戦略{isMobile ? '' : <br />}
              {isMobile && ' - '}<strong>勝率75.7%実績</strong>の高性能サインツール
            </Paragraph>
          </div>

          <Card 
            style={{ 
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)', 
              borderRadius: '12px',
              border: 'none'
            }}
          >
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              centered
              size="large"
              items={[
                {
                  key: 'login',
                  label: (
                    <span>
                      <LoginOutlined />
                      ログイン
                    </span>
                  ),
                  children: (
                    <>
                      <Form
                  name="login"
                  onFinish={handleLogin}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item
                    label="メールアドレス"
                    name="email"
                    rules={[
                      { required: true, message: 'メールアドレスを入力してください' },
                      { type: 'email', message: '有効なメールアドレスを入力してください' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="your@email.com"
                    />
                  </Form.Item>

                  <Form.Item
                    label="パスワード"
                    name="password"
                    rules={[{ required: true, message: 'パスワードを入力してください' }]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined />} 
                      placeholder="パスワード"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={isLoading}
                      block
                      style={{ height: '48px', fontSize: '16px' }}
                    >
                      ログイン
                    </Button>
                  </Form.Item>
                </Form>

                <Divider plain>または</Divider>
                
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">
                    アカウントをお持ちでない方は{' '}
                    <Button 
                      type="link" 
                      onClick={() => setActiveTab('register')}
                      style={{ padding: '0' }}
                    >
                      新規登録
                    </Button>
                  </Text>
                </div>
                    </>
                  )
                },
                {
                  key: 'register',
                  label: (
                    <span>
                      <UserAddOutlined />
                      新規登録
                    </span>
                  ),
                  children: (
                    <>
                      <Alert
                  message="無料アカウント作成"
                  description="Phase 1機能すべて無料でご利用いただけます。将来の有料機能リリース時も既存ユーザー様には特別価格をご用意予定です。"
                  type="info"
                  showIcon
                  style={{ marginBottom: '24px' }}
                />

                <Form
                  name="register"
                  onFinish={handleRegister}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item
                    label="表示名（任意）"
                    name="displayName"
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="田中太郎"
                    />
                  </Form.Item>

                  <Form.Item
                    label="メールアドレス"
                    name="email"
                    rules={[
                      { required: true, message: 'メールアドレスを入力してください' },
                      { type: 'email', message: '有効なメールアドレスを入力してください' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="your@email.com"
                    />
                  </Form.Item>

                  <Form.Item
                    label="パスワード"
                    name="password"
                    rules={[
                      { required: true, message: 'パスワードを入力してください' },
                      { min: 8, message: 'パスワードは8文字以上で入力してください' }
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined />} 
                      placeholder="8文字以上のパスワード"
                    />
                  </Form.Item>

                  <Form.Item
                    label="パスワード（確認）"
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'パスワード（確認）を入力してください' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('パスワードが一致しません'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined />} 
                      placeholder="パスワード再入力"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={isLoading}
                      block
                      style={{ height: '48px', fontSize: '16px' }}
                    >
                      無料アカウント作成
                    </Button>
                  </Form.Item>
                </Form>

                <Divider plain>または</Divider>
                
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">
                    すでにアカウントをお持ちの方は{' '}
                    <Button 
                      type="link" 
                      onClick={() => setActiveTab('login')}
                      style={{ padding: '0' }}
                    >
                      ログイン
                    </Button>
                  </Text>
                </div>
                    </>
                  )
                }
              ]}
            />
          </Card>

          {/* 機能紹介 */}
          <div style={{ 
            marginTop: isMobile ? '24px' : '32px', 
            padding: isMobile ? '16px' : '24px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '12px',
            color: 'white'
          }}>
            <Title level={isMobile ? 5 : 4} style={{ color: 'white', textAlign: 'center', fontSize: isMobile ? '16px' : undefined, marginBottom: isMobile ? '12px' : undefined }}>
              🎯 Phase 1 提供機能
            </Title>
            <Space direction="vertical" size={isMobile ? 8 : "small"} style={{ width: '100%' }}>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? '12px' : '14px' }}>
                ✅ パフォーマンスダッシュボード
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? '12px' : '14px' }}>
                ✅ TORB戦略シグナル
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? '12px' : '14px' }}>
                ✅ 30日間データ履歴
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? '12px' : '14px' }}>
                ✅ リアルタイム実績公開
              </Text>
            </Space>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default LoginPage;