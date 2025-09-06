import Header from "./components/Header";
import Chart from './components/Chart';
import { useFxData } from './hooks/useFxData';
import './App.css';

function AppWithData() {
  const { chartData: rawChartData, currentPrice, isLoading, error } = useFxData('USDJPY');
  
  // Convert BusinessDay to string/number for Chart component
  const chartData = rawChartData.map(item => ({
    ...item,
    time: typeof item.time === 'object' && 'year' in item.time 
      ? new Date(item.time.year, item.time.month - 1, item.time.day).getTime()
      : item.time
  }));

  // ローディング状態の表示
  if (isLoading) {
    return (
      <div className="loading">
        <h2>Loading FX data...</h2>
      </div>
    );
  }

  return (
    <div className="app">
      <Header currentPrice={currentPrice} error={error} />
      
      <main className="main-content">
        <div className="chart-section">
          <Chart data={chartData} width={1000} height={500} />
        </div>
        
        <div className="info-panel">
          <div className="torb-section">
            <h4>TORB Range Status</h4>
            <p>Chart Data: {chartData.length} candles</p>
            <p>Current Price: {currentPrice?.price || 'N/A'}</p>
            <p>Last Update: {currentPrice?.timestamp ? new Date(currentPrice.timestamp).toLocaleTimeString() : 'N/A'}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppWithData;