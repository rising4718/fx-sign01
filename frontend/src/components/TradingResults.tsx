import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  DatePicker, 
  Select, 
  Button, 
  Space, 
  Row, 
  Col,
  Statistic,
  Typography,
  Segmented,
  Empty,
  Tag,
  Badge,
  Tooltip
} from 'antd';
import { 
  BarChartOutlined, 
  CalendarOutlined,
  DownloadOutlined,
  FilterOutlined,
  TrophyOutlined,
  BoxPlotOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { fxApiService } from '../services/fxApi';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(weekOfYear);

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface TORBRange {
  startTime: string;
  endTime: string;
  high: number;
  low: number;
  range: number;
}

interface TORBSignal {
  id: string;
  timestamp: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  range: TORBRange;
  rsi: number;
  confidence: number;
  status: 'ACTIVE' | 'COMPLETED';
}

interface TradeRecord {
  id: string;
  date: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  exitPrice?: number;
  pips?: number;
  status: 'active' | 'completed';
  result?: 'win' | 'loss';
  torbRange?: TORBRange;
}

const TradingResults: React.FC = () => {
  const [tradingHistory] = useState<TradeRecord[]>(() => {
    const saved = localStorage.getItem('tradingHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [torbSignals, setTorbSignals] = useState<TORBSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTORBData, setShowTORBData] = useState(false);

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'active'>('all');
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss'>('all');

  // TORBシグナル履歴を取得
  useEffect(() => {
    if (showTORBData) {
      fetchTORBHistory();
    }
  }, [showTORBData, dateRange]);

  const fetchTORBHistory = async () => {
    setLoading(true);
    try {
      const days = dateRange ? Math.ceil(Math.abs(dateRange[1].diff(dateRange[0], 'day'))) : 30;
      const response = await fxApiService.getTORBHistory('USDJPY', days, 100);
      
      if (response.success) {
        setTorbSignals(response.data);
      }
    } catch (error) {
      console.error('TORB履歴の取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  // TORBレンジ品質の判定
  const getRangeQuality = (rangePips: number): { label: string; color: string } => {
    if (rangePips <= 50) return { label: '小', color: 'blue' };
    if (rangePips <= 100) return { label: '中', color: 'orange' };
    return { label: '大', color: 'red' };
  };

  // ブレイク方向の判定
  const getBreakDirection = (signal: TORBSignal): { label: string; icon: React.ReactNode; color: string } => {
    if (signal.type === 'LONG') {
      return { 
        label: '上抜け', 
        icon: <ArrowUpOutlined />, 
        color: 'green' 
      };
    } else {
      return { 
        label: '下抜け', 
        icon: <ArrowDownOutlined />, 
        color: 'red' 
      };
    }
  };

  // フィルタリングされた取引データ
  const getFilteredTrades = () => {
    let filtered = [...tradingHistory];

    // 日付範囲でフィルタ
    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(trade => {
        const tradeDate = dayjs(trade.date);
        return tradeDate.isSameOrAfter(start, 'day') && tradeDate.isSameOrBefore(end, 'day');
      });
    }

    // ステータスでフィルタ
    if (filterStatus !== 'all') {
      filtered = filtered.filter(trade => trade.status === filterStatus);
    }

    // 結果でフィルタ
    if (filterResult !== 'all') {
      filtered = filtered.filter(trade => trade.result === filterResult);
    }

    return filtered;
  };

  const filteredTrades = getFilteredTrades();

  // 期間別集計データ計算
  const getAggregatedData = () => {
    const grouped: { [key: string]: TradeRecord[] } = {};
    
    filteredTrades.forEach(trade => {
      let key = '';
      const tradeDate = dayjs(trade.date);
      
      switch (viewType) {
        case 'daily':
          key = tradeDate.format('YYYY-MM-DD');
          break;
        case 'weekly':
          key = `${tradeDate.year()}-W${tradeDate.week()}`;
          break;
        case 'monthly':
          key = tradeDate.format('YYYY-MM');
          break;
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(trade);
    });

    return Object.entries(grouped)
      .map(([period, trades]) => {
        const completedTrades = trades.filter(t => t.status === 'completed');
        const winTrades = completedTrades.filter(t => t.result === 'win');
        const totalPips = completedTrades.reduce((sum, t) => sum + (t.pips || 0), 0);
        
        return {
          key: period,
          period,
          totalTrades: trades.length,
          completedTrades: completedTrades.length,
          winTrades: winTrades.length,
          winRate: completedTrades.length > 0 ? (winTrades.length / completedTrades.length) * 100 : 0,
          totalPips: Number(totalPips.toFixed(1)),
          avgPips: completedTrades.length > 0 ? Number((totalPips / completedTrades.length).toFixed(1)) : 0
        };
      })
      .sort((a, b) => b.period.localeCompare(a.period));
  };

  const aggregatedData = getAggregatedData();

  // 全体統計
  const overallStats = {
    totalTrades: filteredTrades.length,
    completedTrades: filteredTrades.filter(t => t.status === 'completed').length,
    activeTrades: filteredTrades.filter(t => t.status === 'active').length,
    winTrades: filteredTrades.filter(t => t.result === 'win').length,
    winRate: filteredTrades.filter(t => t.status === 'completed').length > 0 
      ? (filteredTrades.filter(t => t.result === 'win').length / filteredTrades.filter(t => t.status === 'completed').length) * 100 
      : 0,
    totalPips: filteredTrades.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.pips || 0), 0)
  };

  // テーブルカラム設定
  const aggregatedColumns = [
    {
      title: '期間',
      dataIndex: 'period',
      key: 'period',
      render: (period: string) => {
        if (viewType === 'weekly') {
          const [year, week] = period.split('-W');
          return `${year}年 第${week}週`;
        } else if (viewType === 'monthly') {
          return dayjs(period).format('YYYY年MM月');
        }
        return dayjs(period).format('MM月DD日(ddd)');
      },
    },
    {
      title: 'シグナル数',
      dataIndex: 'totalTrades',
      key: 'totalTrades',
      render: (count: number) => `${count}回`,
      sorter: (a: any, b: any) => a.totalTrades - b.totalTrades,
    },
    {
      title: '完了取引',
      dataIndex: 'completedTrades',
      key: 'completedTrades',
      render: (completed: number, record: any) => `${completed}/${record.totalTrades}`,
    },
    {
      title: '勝率',
      dataIndex: 'winRate',
      key: 'winRate',
      render: (winRate: number) => (
        <Text style={{ color: winRate >= 50 ? '#52c41a' : '#f5222d', fontWeight: 'bold' }}>
          {winRate.toFixed(1)}%
        </Text>
      ),
      sorter: (a: any, b: any) => a.winRate - b.winRate,
    },
    {
      title: '損益',
      dataIndex: 'totalPips',
      key: 'totalPips',
      render: (pips: number) => (
        <Text type={pips >= 0 ? 'success' : 'danger'} strong>
          {pips >= 0 ? '+' : ''}{pips} pips
        </Text>
      ),
      sorter: (a: any, b: any) => a.totalPips - b.totalPips,
    },
    {
      title: '平均損益',
      dataIndex: 'avgPips',
      key: 'avgPips',
      render: (pips: number) => (
        <Text style={{ color: pips >= 0 ? '#52c41a' : '#f5222d' }}>
          {pips >= 0 ? '+' : ''}{pips} pips
        </Text>
      ),
    },
  ];

  // TORBシグナル専用テーブルカラム
  const torbColumns = [
    {
      title: '日時',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => dayjs(timestamp).format('MM/DD HH:mm'),
      sorter: (a: TORBSignal, b: TORBSignal) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: 'シグナル',
      dataIndex: 'type',
      key: 'type',
      render: (type: string, record: TORBSignal) => {
        const direction = getBreakDirection(record);
        return (
          <Tag color={direction.color} icon={direction.icon}>
            {direction.label}
          </Tag>
        );
      },
    },
    {
      title: 'エントリー価格',
      dataIndex: 'entryPrice',
      key: 'entryPrice',
      render: (price: number) => price.toFixed(3),
    },
    {
      title: 'TORBレンジ',
      key: 'torbRange',
      render: (record: TORBSignal) => {
        const quality = getRangeQuality(record.range.range);
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Badge color={quality.color} text={`${quality.label} (${record.range.range} pips)`} />
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.range.low.toFixed(3)} - {record.range.high.toFixed(3)}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {dayjs(record.range.startTime).format('HH:mm')} - {dayjs(record.range.endTime).format('HH:mm')} JST
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'TP/SL',
      key: 'tpsl',
      render: (record: TORBSignal) => (
        <Space direction="vertical" size="small">
          <Text style={{ color: '#52c41a', fontSize: '12px' }}>
            TP: {record.targetPrice.toFixed(3)}
          </Text>
          <Text style={{ color: '#f5222d', fontSize: '12px' }}>
            SL: {record.stopLoss.toFixed(3)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'RSI',
      dataIndex: 'rsi',
      key: 'rsi',
      render: (rsi: number) => (
        <Tag color={rsi > 70 ? 'red' : rsi < 30 ? 'green' : 'blue'}>
          {rsi.toFixed(0)}
        </Tag>
      ),
    },
    {
      title: '信頼度',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence: number) => (
        <Tooltip title={`信頼度: ${(confidence * 100).toFixed(1)}%`}>
          <Badge 
            count={`${(confidence * 100).toFixed(0)}%`} 
            color={confidence > 0.8 ? 'green' : confidence > 0.6 ? 'orange' : 'red'}
          />
        </Tooltip>
      ),
    },
    {
      title: '状態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'COMPLETED' ? 'blue' : 'orange'}>
          {status === 'COMPLETED' ? '完了' : 'アクティブ'}
        </Tag>
      ),
    },
  ];

  const detailColumns = [
    {
      title: '日付',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MM/DD HH:mm'),
    },
    {
      title: '種別',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'buy' ? 'green' : 'red'}>
          {type === 'buy' ? '買い' : '売り'}
        </Tag>
      ),
    },
    {
      title: 'エントリー',
      dataIndex: 'entryPrice',
      key: 'entryPrice',
      render: (price: number) => price.toFixed(3),
    },
    {
      title: '決済',
      dataIndex: 'exitPrice',
      key: 'exitPrice',
      render: (price: number) => price ? price.toFixed(3) : '-',
    },
    {
      title: '損益',
      dataIndex: 'pips',
      key: 'pips',
      render: (pips: number) => pips ? (
        <Text type={pips >= 0 ? 'success' : 'danger'} strong>
          {pips >= 0 ? '+' : ''}{pips.toFixed(1)} pips
        </Text>
      ) : '-',
    },
    {
      title: '状態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'blue' : 'orange'}>
          {status === 'completed' ? '完了' : '取引中'}
        </Tag>
      ),
    },
  ];

  const handleExport = () => {
    const csvContent = [
      ['期間', 'シグナル数', '完了取引', '勝率(%)', '損益(pips)', '平均損益(pips)'].join(','),
      ...aggregatedData.map(row => [
        row.period,
        row.totalTrades,
        row.completedTrades,
        row.winRate.toFixed(1),
        row.totalPips,
        row.avgPips
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trading_results_${dayjs().format('YYYYMMDD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (tradingHistory.length === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Empty 
            description="まだ取引データがありません"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* フィルター */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <div>
              <CalendarOutlined style={{ marginRight: '8px' }} />
              <Text strong>期間選択:</Text>
            </div>
            <RangePicker 
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
              style={{ width: '100%', marginTop: '4px' }}
              placeholder={['開始日', '終了日']}
            />
          </Col>
          <Col xs={24} sm={4}>
            <div>
              <BarChartOutlined style={{ marginRight: '8px' }} />
              <Text strong>表示単位:</Text>
            </div>
            <Segmented 
              options={[
                { label: '日別', value: 'daily' },
                { label: '週別', value: 'weekly' },
                { label: '月別', value: 'monthly' },
              ]}
              value={viewType}
              onChange={(value) => setViewType(value as 'daily' | 'weekly' | 'monthly')}
              style={{ marginTop: '4px' }}
            />
          </Col>
          <Col xs={24} sm={3}>
            <div>
              <FilterOutlined style={{ marginRight: '8px' }} />
              <Text strong>状態:</Text>
            </div>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: '100%', marginTop: '4px' }}
              options={[
                { label: '全て', value: 'all' },
                { label: '完了のみ', value: 'completed' },
                { label: '取引中のみ', value: 'active' },
              ]}
            />
          </Col>
          <Col xs={24} sm={3}>
            <div>
              <TrophyOutlined style={{ marginRight: '8px' }} />
              <Text strong>結果:</Text>
            </div>
            <Select
              value={filterResult}
              onChange={setFilterResult}
              style={{ width: '100%', marginTop: '4px' }}
              options={[
                { label: '全て', value: 'all' },
                { label: '勝ちのみ', value: 'win' },
                { label: '負けのみ', value: 'loss' },
              ]}
            />
          </Col>
          <Col xs={24} sm={4}>
            <div>
              <BoxPlotOutlined style={{ marginRight: '8px' }} />
              <Text strong>データソース:</Text>
            </div>
            <Segmented 
              options={[
                { label: 'ローカル', value: false },
                { label: 'TORB', value: true },
              ]}
              value={showTORBData}
              onChange={(value) => setShowTORBData(value as boolean)}
              style={{ marginTop: '4px' }}
            />
          </Col>
          <Col xs={24} sm={4}>
            <div style={{ height: '22px' }}></div>
            <Space style={{ marginTop: '4px' }}>
              <Button onClick={() => {
                setDateRange(null);
                setFilterStatus('all');
                setFilterResult('all');
              }}>
                リセット
              </Button>
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
                CSV出力
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 統計サマリー */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="総シグナル数"
              value={overallStats.totalTrades}
              suffix="回"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="完了取引数"
              value={overallStats.completedTrades}
              suffix="回"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="勝率"
              value={overallStats.winRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: overallStats.winRate >= 50 ? '#52c41a' : '#f5222d' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="累積損益"
              value={overallStats.totalPips}
              suffix="pips"
              precision={1}
              valueStyle={{ color: overallStats.totalPips >= 0 ? '#52c41a' : '#f5222d' }}
              prefix={overallStats.totalPips >= 0 ? '+' : ''}
            />
          </Col>
        </Row>
      </Card>

      {/* TORBデータ表示時 */}
      {showTORBData ? (
        <Card 
          title={
            <Space>
              <BoxPlotOutlined />
              TORBシグナル履歴
              <Badge count={torbSignals.length} style={{ backgroundColor: '#52c41a' }} />
              {loading && <Badge status="processing" text="読み込み中..." />}
            </Space>
          }
        >
          <Table
            loading={loading}
            columns={torbColumns}
            dataSource={torbSignals.map((signal, index) => ({ ...signal, key: signal.id || index }))}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
            size="small"
          />
        </Card>
      ) : (
        <>
          {/* 期間別集計テーブル */}
          <Card 
            title={`${viewType === 'daily' ? '日別' : viewType === 'weekly' ? '週別' : '月別'}集計`}
            style={{ marginBottom: '24px' }}
          >
            <Table
              columns={aggregatedColumns}
              dataSource={aggregatedData}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
              size="small"
            />
          </Card>

          {/* 詳細取引履歴 */}
          <Card title="取引履歴詳細">
            <Table
              columns={detailColumns}
              dataSource={filteredTrades.map((trade, index) => ({ ...trade, key: trade.id || index }))}
              pagination={{ pageSize: 15 }}
              scroll={{ x: 600 }}
              size="small"
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default TradingResults;