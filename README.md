# 📈 TradeBricks

<div align="center">
  <h3>Create, Test, and Optimize Trading Strategies Without Code</h3>
  
  [![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-v16%2B-green)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-v18-blue)](https://reactjs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-v5-green)](https://www.mongodb.com/)
</div>

---

## 🌟 What is TradeBricks?

TradeBricks is a powerful yet intuitive low-code platform that democratizes algorithmic trading. Our visual drag-and-drop interface allows anyone—from beginners to experienced traders—to design, backtest, and optimize sophisticated trading strategies without writing a single line of code.

### 💡 Why TradeBricks?

- **No Coding Required**: Build complex strategies using visual blocks
- **Real Market Data**: Backtest with accurate, split-adjusted historical data
- **Instant Feedback**: See performance metrics and trade visualizations immediately
- **Learn As You Build**: Perfect for learning algorithmic trading concepts

---

## ✨ Key Features

### 🧩 Visual Strategy Builder

- **Drag-and-Drop Interface**: Easily place and connect strategy components
- **Modular Building Blocks**: Technical indicators, entry/exit signals, and order execution
- **Real-Time Validation**: Instant feedback on strategy structure and completeness

### 📊 Advanced Backtesting

- **High-Quality Financial Data**: Real historical data from multiple reliable sources
- **Split-Adjusted Prices**: Accurate handling of stock splits and dividends
- **Performance Metrics**: Detailed analytics including return, drawdown, and trade statistics
- **Interactive Visualizations**: Charts showing equity curve, trade entries/exits, and more

### 💹 Market Data Access

- **Stocks**: Major US-listed companies like AAPL, MSFT, GOOGL, AMZN
- **Cryptocurrencies**: Major tokens including ETH, BTC, and ERC-20 tokens
- **Automatic Split Adjustment**: Historical prices correctly reflect corporate actions

### 🔄 Strategy Templates

- **Pre-built Strategies**: Moving average crossovers, RSI-based systems, and more
- **Customizable Parameters**: Easily adjust periods, thresholds, and other settings
- **Learning Resources**: Understand the logic behind successful trading approaches

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/AdityaK-github/TradeBricks.git
cd TradeBricks

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

Create a `.env` file in the backend directory:

```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
MARKET_DATA_API_KEY=your_alpha_vantage_api_key   # Optional but recommended
```

### Running the Application

```bash
# Start the backend server (from backend directory)
npm run dev

# Start the frontend development server (from frontend directory)
npm run dev
```

Navigate to `http://localhost:5173` in your browser to start using TradeBricks!

---

## 🔍 How to Use TradeBricks

### Creating Your First Strategy

1. **Start a New Strategy**:

   - Click "New Strategy" on the dashboard
   - Give your strategy a name and description

2. **Build Your Logic**:

   - Drag a "Market Data" block onto the canvas (your data source)
   - Add technical indicators (like Moving Averages, RSI, or MACD)
   - Add comparison blocks to create trading signals
   - Add order execution blocks to define entries and exits
   - Connect blocks by dragging from outputs to inputs

3. **Save Your Strategy**:
   - Click "Save Strategy" to store your design

### Running a Backtest

1. **Select Your Strategy**:

   - Choose from your saved strategies in the sidebar

2. **Configure Backtest Parameters**:

   - Select an asset (stock or cryptocurrency)
   - Set date range for the backtest
   - Define initial capital

3. **Run and Analyze**:
   - Click "Run Backtest" to process your strategy against historical data
   - View performance metrics including total return, drawdown, and win rate
   - Analyze the equity curve and individual trades on the chart
   - Export results or make strategy adjustments

### Strategy Optimization

- Modify indicator parameters (e.g., changing a 50-day MA to a 200-day MA)
- Adjust entry and exit conditions
- Compare multiple parameter sets to find the optimal combination

---

## 📚 Data Sources and Quality

TradeBricks uses multiple high-quality data sources to ensure accurate backtesting:

### Stock Data

- **Primary Source**: Alpha Vantage API with split-adjusted prices
- **Secondary Source**: Yahoo Finance API (fallback)
- **Coverage**: Major US stocks with adjustments for splits and dividends

### Crypto Data

- **Primary Source**: CryptoCompare API
- **Secondary Source**: Yahoo Finance (fallback)
- **Token Support**: Native crypto and ERC-20 tokens by address

### Data Validation

- Prices are checked against expected ranges for major assets
- Split events are correctly accounted for in historical data
- Price anomalies are detected and reported before backtesting

---

## 🧠 Strategy Building Components

### Data Sources

- **Market Data**: Historical OHLCV (Open, High, Low, Close, Volume) data
- **Custom Data**: Import your own datasets (coming soon)

### Technical Indicators

- **Moving Averages**: Simple, Exponential, Weighted
- **Oscillators**: RSI, Stochastic, MACD
- **Volatility**: Bollinger Bands, ATR
- **Volume**: OBV, Volume Profile

### Signal Generation

- **Comparisons**: Greater than, Less than, Crosses above/below
- **Logic**: AND, OR, NOT conditions
- **Filters**: Time-based, Volatility-based

### Order Execution

- **Market Orders**: Buy/Sell at market price
- **Position Sizing**: Fixed amount, Percentage of capital
- **Risk Management**: Stop-loss, Take-profit

---

## 🔧 Technical Architecture

### Frontend

- **React + TypeScript**: Strong typing for reliable codebase
- **ReactFlow**: Powers the visual strategy builder
- **Chart.js**: Creates interactive performance visualizations
- **TailwindCSS**: Modern, responsive styling
- **Dark Mode**: Easy on the eyes during long strategy sessions

### Backend

- **Node.js + Express**: Fast, scalable API server
- **TypeScript**: Type-safe backend code
- **MongoDB**: Flexible storage for strategies and backtests
- **Market Data APIs**: Multiple integrated data providers
- **Backtest Engine**: Efficient simulation of strategy performance

---

## 📘 Advanced Usage

### Custom Indicators

The platform supports various technical analysis concepts:

- **Trend Following**: Moving average systems, breakouts
- **Mean Reversion**: Overbought/oversold conditions
- **Volatility-Based**: Trading based on market volatility
- **Multi-factor**: Combining multiple signals for robust strategies

### Real-World Strategy Examples

TradeBricks comes pre-loaded with example strategies:

- **Golden Cross**: 50/200 day moving average crossover system
- **RSI Reversals**: Trading oversold and overbought conditions
- **Bollinger Band Reversals**: Mean-reversion strategy
- **MACD Momentum**: Trend-following approach with momentum confirmation

---

## 🔮 Future prospects

- **Paper Trading**: Test strategies in real-time without financial risk
- **Strategy Marketplace**: Share and discover community-created strategies
- **Advanced Optimization**: Machine learning-based parameter optimization
- **Extended Data Sources**: Forex, futures, options, and alternative data
- **Custom Blocks**: Create your own strategy components

---

## 🤝 Contributing

We welcome contributions to TradeBricks!

---

## 📄 License

TradeBricks is released under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ by the AlgoManiacs Team</p>
  <p> TradeBricks - Democratizing Algorithmic Trading</p>
</div>
