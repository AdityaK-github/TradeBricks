// Block type definitions for TradeBricks

export enum BlockCategory {
    DATA_SOURCE = 'Data Source',
    INDICATOR = 'Technical Indicator',
    CONDITION = 'Condition',
    SIGNAL = 'Trading Signal',
    ORDER = 'Order Execution',
    RISK = 'Risk Management',
}

export interface BlockType {
    id: string;
    name: string;
    category: BlockCategory;
    description: string;
    inputs?: BlockInput[];
    outputs?: BlockOutput[];
    defaultData?: Record<string, any>;
}

export interface BlockInput {
    id: string;
    name: string;
    type: 'number' | 'string' | 'boolean' | 'signal' | 'price' | 'volume';
    defaultValue?: any;
    isRequired?: boolean;
}

export interface BlockOutput {
    id: string;
    name: string;
    type: 'number' | 'string' | 'boolean' | 'signal' | 'price' | 'volume';
}

// Define available blocks
export const BLOCK_TYPES: BlockType[] = [
    // Data Source Blocks
    {
        id: 'market_data',
        name: 'Market Data',
        category: BlockCategory.DATA_SOURCE,
        description: 'Fetch market data for a symbol',
        inputs: [
            { id: 'symbol', name: 'Symbol', type: 'string', defaultValue: 'AAPL', isRequired: true },
        ],
        outputs: [
            { id: 'price', name: 'Price', type: 'price' },
            { id: 'volume', name: 'Volume', type: 'volume' },
        ],
        defaultData: {
            symbol: 'AAPL',
        },
    },

    // Technical Indicator Blocks
    {
        id: 'moving_average',
        name: 'Moving Average',
        category: BlockCategory.INDICATOR,
        description: 'Calculate moving average of price',
        inputs: [
            { id: 'price', name: 'Price', type: 'price', isRequired: true },
            { id: 'period', name: 'Period', type: 'number', defaultValue: 20, isRequired: true },
            { id: 'type', name: 'Type', type: 'string', defaultValue: 'SMA', isRequired: true },
        ],
        outputs: [
            { id: 'ma', name: 'MA Value', type: 'number' },
        ],
        defaultData: {
            period: 20,
            type: 'SMA',
        },
    },
    {
        id: 'rsi',
        name: 'RSI',
        category: BlockCategory.INDICATOR,
        description: 'Calculate Relative Strength Index',
        inputs: [
            { id: 'price', name: 'Price', type: 'price', isRequired: true },
            { id: 'period', name: 'Period', type: 'number', defaultValue: 14, isRequired: true },
        ],
        outputs: [
            { id: 'rsi', name: 'RSI Value', type: 'number' },
        ],
        defaultData: {
            period: 14,
        },
    },

    // Condition Blocks
    {
        id: 'comparison',
        name: 'Comparison',
        category: BlockCategory.CONDITION,
        description: 'Compare two values',
        inputs: [
            { id: 'value1', name: 'Value 1', type: 'number', isRequired: true },
            { id: 'operator', name: 'Operator', type: 'string', defaultValue: '>', isRequired: true },
            { id: 'value2', name: 'Value 2', type: 'number', isRequired: true },
        ],
        outputs: [
            { id: 'result', name: 'Result', type: 'boolean' },
        ],
        defaultData: {
            operator: '>',
        },
    },

    // Signal Blocks
    {
        id: 'trade_signal',
        name: 'Trade Signal',
        category: BlockCategory.SIGNAL,
        description: 'Generate buy/sell signal based on condition',
        inputs: [
            { id: 'condition', name: 'Condition', type: 'boolean', isRequired: true },
            { id: 'signal_type', name: 'Signal Type', type: 'string', defaultValue: 'BUY', isRequired: true },
        ],
        outputs: [
            { id: 'signal', name: 'Signal', type: 'signal' },
        ],
        defaultData: {
            signal_type: 'BUY',
        },
    },

    // Order Execution Blocks
    {
        id: 'market_order',
        name: 'Market Order',
        category: BlockCategory.ORDER,
        description: 'Execute market order',
        inputs: [
            { id: 'signal', name: 'Signal', type: 'signal', isRequired: true },
            { id: 'quantity', name: 'Quantity', type: 'number', defaultValue: 1, isRequired: true },
        ],
        outputs: [],
        defaultData: {
            quantity: 1,
        },
    },

    // Risk Management Blocks
    {
        id: 'stop_loss',
        name: 'Stop Loss',
        category: BlockCategory.RISK,
        description: 'Add stop loss to trade',
        inputs: [
            { id: 'entry_price', name: 'Entry Price', type: 'price', isRequired: true },
            { id: 'percent', name: 'Percent', type: 'number', defaultValue: 5, isRequired: true },
        ],
        outputs: [
            { id: 'stop_price', name: 'Stop Price', type: 'price' },
            { id: 'signal', name: 'Exit Signal', type: 'signal' },
        ],
        defaultData: {
            percent: 5,
        },
    },
    {
        id: 'take_profit',
        name: 'Take Profit',
        category: BlockCategory.RISK,
        description: 'Add take profit target to trade',
        inputs: [
            { id: 'entry_price', name: 'Entry Price', type: 'price', isRequired: true },
            { id: 'percent', name: 'Target Percent', type: 'number', defaultValue: 10, isRequired: true },
            { id: 'direction', name: 'Position Direction', type: 'string', defaultValue: 'LONG', isRequired: true },
        ],
        outputs: [
            { id: 'target_price', name: 'Target Price', type: 'price' },
            { id: 'signal', name: 'Exit Signal', type: 'signal' },
        ],
        defaultData: {
            percent: 10,
            direction: 'LONG',
        },
    },
    {
        id: 'trailing_stop',
        name: 'Trailing Stop',
        category: BlockCategory.RISK,
        description: 'Add trailing stop that follows price movement',
        inputs: [
            { id: 'price', name: 'Current Price', type: 'price', isRequired: true },
            { id: 'trail_percent', name: 'Trail Percent', type: 'number', defaultValue: 5, isRequired: true },
            { id: 'direction', name: 'Position Direction', type: 'string', defaultValue: 'LONG', isRequired: true },
        ],
        outputs: [
            { id: 'stop_price', name: 'Stop Price', type: 'price' },
            { id: 'signal', name: 'Exit Signal', type: 'signal' },
        ],
        defaultData: {
            trail_percent: 5,
            direction: 'LONG',
        },
    },
    {
        id: 'position_sizing',
        name: 'Position Sizing',
        category: BlockCategory.RISK,
        description: 'Calculate position size based on risk management rules',
        inputs: [
            { id: 'account_size', name: 'Account Size ($)', type: 'number', defaultValue: 10000, isRequired: true },
            { id: 'risk_percent', name: 'Risk per Trade (%)', type: 'number', defaultValue: 1, isRequired: true },
            { id: 'entry_price', name: 'Entry Price', type: 'price', isRequired: true },
            { id: 'stop_price', name: 'Stop Price', type: 'price', isRequired: true },
        ],
        outputs: [
            { id: 'position_size', name: 'Position Size (units)', type: 'number' },
            { id: 'risk_amount', name: 'Risk Amount ($)', type: 'number' },
        ],
        defaultData: {
            account_size: 10000,
            risk_percent: 1,
        },
    },
    {
        id: 'risk_reward',
        name: 'Risk/Reward Filter',
        category: BlockCategory.RISK,
        description: 'Filter trades based on risk/reward ratio',
        inputs: [
            { id: 'entry_price', name: 'Entry Price', type: 'price', isRequired: true },
            { id: 'stop_price', name: 'Stop Price', type: 'price', isRequired: true },
            { id: 'target_price', name: 'Target Price', type: 'price', isRequired: true },
            { id: 'min_ratio', name: 'Minimum R:R Ratio', type: 'number', defaultValue: 2, isRequired: true },
            { id: 'signal', name: 'Input Signal', type: 'signal', isRequired: true },
        ],
        outputs: [
            { id: 'ratio', name: 'R:R Ratio', type: 'number' },
            { id: 'filtered_signal', name: 'Filtered Signal', type: 'signal' },
        ],
        defaultData: {
            min_ratio: 2,
        },
    },
]; 