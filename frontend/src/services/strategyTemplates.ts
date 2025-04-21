// Strategy templates for TradeBricks
// These templates can be used as starting points for users

import { v4 as uuidv4 } from 'uuid';

interface StrategyTemplate {
    name: string;
    description: string;
    blocks: any[];
    connections: any[];
}

// Helper function to generate consistent node IDs
const generateNodeId = (prefix: string) => {
    return `${prefix}_${uuidv4().slice(0, 8)}`;
};

/**
 * Moving Average Crossover Strategy
 * 
 * This strategy buys when a fast moving average crosses above a slow moving average
 * and sells when the fast moving average crosses below the slow moving average.
 * It's a popular trend-following strategy.
 */
export const movingAverageCrossover: StrategyTemplate = (() => {
    // Generate consistent node IDs
    const dataNodeId = generateNodeId('data');
    const fastMANodeId = generateNodeId('fast_ma');
    const slowMANodeId = generateNodeId('slow_ma');
    const comparisonNodeId = generateNodeId('comparison');
    const buySignalNodeId = generateNodeId('buy_signal');
    const sellSignalNodeId = generateNodeId('sell_signal');
    const marketOrderNodeId = generateNodeId('market_order');

    return {
        name: 'Moving Average Crossover',
        description: 'Buy when fast MA crosses above slow MA, sell when it crosses below',
        blocks: [
            {
                id: dataNodeId,
                type: 'algoNode',
                position: { x: 100, y: 200 },
                data: {
                    blockType: {
                        id: 'market_data',
                        name: 'Market Data',
                        category: 'Data Source',
                        description: 'Fetch market data for a symbol',
                    },
                    data: {
                        symbol: 'AAPL',
                    }
                }
            },
            {
                id: fastMANodeId,
                type: 'algoNode',
                position: { x: 400, y: 100 },
                data: {
                    blockType: {
                        id: 'moving_average',
                        name: 'Fast Moving Average',
                        category: 'Technical Indicator',
                        description: 'Calculate moving average of price (shorter period)',
                    },
                    data: {
                        period: 10,
                        type: 'SMA',
                    }
                }
            },
            {
                id: slowMANodeId,
                type: 'algoNode',
                position: { x: 400, y: 300 },
                data: {
                    blockType: {
                        id: 'moving_average',
                        name: 'Slow Moving Average',
                        category: 'Technical Indicator',
                        description: 'Calculate moving average of price (longer period)',
                    },
                    data: {
                        period: 30,
                        type: 'SMA',
                    }
                }
            },
            {
                id: comparisonNodeId,
                type: 'algoNode',
                position: { x: 700, y: 200 },
                data: {
                    blockType: {
                        id: 'comparison',
                        name: 'MA Comparison',
                        category: 'Condition',
                        description: 'Compare fast MA to slow MA',
                    },
                    data: {
                        operator: '>',
                    }
                }
            },
            {
                id: buySignalNodeId,
                type: 'algoNode',
                position: { x: 1000, y: 100 },
                data: {
                    blockType: {
                        id: 'trade_signal',
                        name: 'Buy Signal',
                        category: 'Signal',
                        description: 'Generate buy signal when fast MA > slow MA',
                    },
                    data: {
                        signal_type: 'BUY',
                    }
                }
            },
            {
                id: sellSignalNodeId,
                type: 'algoNode',
                position: { x: 1000, y: 300 },
                data: {
                    blockType: {
                        id: 'trade_signal',
                        name: 'Sell Signal',
                        category: 'Signal',
                        description: 'Generate sell signal when fast MA < slow MA',
                    },
                    data: {
                        signal_type: 'SELL',
                    }
                }
            },
            {
                id: marketOrderNodeId,
                type: 'algoNode',
                position: { x: 1300, y: 200 },
                data: {
                    blockType: {
                        id: 'market_order',
                        name: 'Market Order',
                        category: 'Order Execution',
                        description: 'Execute market order based on signals',
                    },
                    data: {
                        quantity: 10,
                    }
                }
            }
        ],
        connections: [
            // Connect Market Data to both MAs
            { id: uuidv4(), source: dataNodeId, target: fastMANodeId, sourceHandle: 'price', targetHandle: 'price' },
            { id: uuidv4(), source: dataNodeId, target: slowMANodeId, sourceHandle: 'price', targetHandle: 'price' },

            // Connect MAs to Comparison
            { id: uuidv4(), source: fastMANodeId, target: comparisonNodeId, sourceHandle: 'ma', targetHandle: 'value1' },
            { id: uuidv4(), source: slowMANodeId, target: comparisonNodeId, sourceHandle: 'ma', targetHandle: 'value2' },

            // Connect Comparison to Buy Signal (direct result)
            { id: uuidv4(), source: comparisonNodeId, target: buySignalNodeId, sourceHandle: 'result', targetHandle: 'condition' },

            // Create inverse of comparison for Sell Signal (when fast MA is not > slow MA)
            { id: uuidv4(), source: comparisonNodeId, target: sellSignalNodeId, sourceHandle: 'result', targetHandle: 'condition' },

            // Connect Signals to Market Order
            { id: uuidv4(), source: buySignalNodeId, target: marketOrderNodeId, sourceHandle: 'signal', targetHandle: 'signal' },
            { id: uuidv4(), source: sellSignalNodeId, target: marketOrderNodeId, sourceHandle: 'signal', targetHandle: 'signal' }
        ]
    };
})();

/**
 * RSI Oversold/Overbought Strategy
 * 
 * This strategy buys when RSI goes below 30 (oversold) and sells when RSI goes above 70 (overbought).
 * It's a common mean-reversion strategy for ranging markets.
 */
export const rsiStrategy: StrategyTemplate = (() => {
    // Generate consistent node IDs
    const dataNodeId = generateNodeId('data');
    const rsiNodeId = generateNodeId('rsi');
    const oversoldNodeId = generateNodeId('oversold');
    const overboughtNodeId = generateNodeId('overbought');
    const buySignalNodeId = generateNodeId('buy_signal');
    const sellSignalNodeId = generateNodeId('sell_signal');
    const marketOrderNodeId = generateNodeId('market_order');
    const stopLossNodeId = generateNodeId('stop_loss');

    return {
        name: 'RSI Overbought/Oversold',
        description: 'Buy when RSI is below 30 (oversold), sell when RSI is above 70 (overbought)',
        blocks: [
            {
                id: dataNodeId,
                type: 'algoNode',
                position: { x: 100, y: 200 },
                data: {
                    blockType: {
                        id: 'market_data',
                        name: 'Market Data',
                        category: 'Data Source',
                        description: 'Fetch market data for a symbol',
                    },
                    data: {
                        symbol: 'MSFT',
                    }
                }
            },
            {
                id: rsiNodeId,
                type: 'algoNode',
                position: { x: 400, y: 200 },
                data: {
                    blockType: {
                        id: 'rsi',
                        name: 'RSI',
                        category: 'Technical Indicator',
                        description: 'Calculate Relative Strength Index',
                    },
                    data: {
                        period: 14,
                    }
                }
            },
            {
                id: oversoldNodeId,
                type: 'algoNode',
                position: { x: 700, y: 100 },
                data: {
                    blockType: {
                        id: 'comparison',
                        name: 'Oversold Check',
                        category: 'Condition',
                        description: 'Check if RSI is below 30',
                    },
                    data: {
                        operator: '<',
                        value2: 30
                    }
                }
            },
            {
                id: overboughtNodeId,
                type: 'algoNode',
                position: { x: 700, y: 300 },
                data: {
                    blockType: {
                        id: 'comparison',
                        name: 'Overbought Check',
                        category: 'Condition',
                        description: 'Check if RSI is above 70',
                    },
                    data: {
                        operator: '>',
                        value2: 70
                    }
                }
            },
            {
                id: buySignalNodeId,
                type: 'algoNode',
                position: { x: 1000, y: 100 },
                data: {
                    blockType: {
                        id: 'trade_signal',
                        name: 'Buy Signal',
                        category: 'Signal',
                        description: 'Generate buy signal when oversold',
                    },
                    data: {
                        signal_type: 'BUY',
                    }
                }
            },
            {
                id: sellSignalNodeId,
                type: 'algoNode',
                position: { x: 1000, y: 300 },
                data: {
                    blockType: {
                        id: 'trade_signal',
                        name: 'Sell Signal',
                        category: 'Signal',
                        description: 'Generate sell signal when overbought',
                    },
                    data: {
                        signal_type: 'SELL',
                    }
                }
            },
            {
                id: marketOrderNodeId,
                type: 'algoNode',
                position: { x: 1300, y: 150 },
                data: {
                    blockType: {
                        id: 'market_order',
                        name: 'Market Order',
                        category: 'Order Execution',
                        description: 'Execute market order based on signals',
                    },
                    data: {
                        quantity: 10,
                    }
                }
            },
            {
                id: stopLossNodeId,
                type: 'algoNode',
                position: { x: 1300, y: 300 },
                data: {
                    blockType: {
                        id: 'stop_loss',
                        name: 'Stop Loss',
                        category: 'Risk Management',
                        description: 'Add stop loss to trade (5% below entry)',
                    },
                    data: {
                        percent: 5,
                    }
                }
            }
        ],
        connections: [
            // Connect Market Data to RSI
            { id: uuidv4(), source: dataNodeId, target: rsiNodeId, sourceHandle: 'price', targetHandle: 'price' },

            // Connect RSI to both conditions
            { id: uuidv4(), source: rsiNodeId, target: oversoldNodeId, sourceHandle: 'rsi', targetHandle: 'value1' },
            { id: uuidv4(), source: rsiNodeId, target: overboughtNodeId, sourceHandle: 'rsi', targetHandle: 'value1' },

            // Connect conditions to signals
            { id: uuidv4(), source: oversoldNodeId, target: buySignalNodeId, sourceHandle: 'result', targetHandle: 'condition' },
            { id: uuidv4(), source: overboughtNodeId, target: sellSignalNodeId, sourceHandle: 'result', targetHandle: 'condition' },

            // Connect signals to market order
            { id: uuidv4(), source: buySignalNodeId, target: marketOrderNodeId, sourceHandle: 'signal', targetHandle: 'signal' },
            { id: uuidv4(), source: sellSignalNodeId, target: marketOrderNodeId, sourceHandle: 'signal', targetHandle: 'signal' },

            // Connect data to stop loss for entry price reference
            { id: uuidv4(), source: dataNodeId, target: stopLossNodeId, sourceHandle: 'price', targetHandle: 'entry_price' }
        ]
    };
})();

/**
 * Double Bollinger Bands Strategy
 * 
 * This strategy uses two Bollinger Bands with different standard deviations
 * to identify strong trends and potential reversal points.
 * It's useful for both trending and ranging markets.
 */
export const bollingerBandsStrategy: StrategyTemplate = (() => {
    // Generate consistent node IDs
    const dataNodeId = generateNodeId('data');
    const bb1NodeId = generateNodeId('bollinger_1');
    const bb2NodeId = generateNodeId('bollinger_2');
    const upperBreakNodeId = generateNodeId('upper_break');
    const lowerBreakNodeId = generateNodeId('lower_break');
    const buySignalNodeId = generateNodeId('buy_signal');
    const sellSignalNodeId = generateNodeId('sell_signal');
    const marketOrderNodeId = generateNodeId('market_order');
    const takeProfitNodeId = generateNodeId('take_profit');

    return {
        name: 'Double Bollinger Bands Strategy',
        description: 'Uses two Bollinger Bands to identify strong trends and potential reversals',
        blocks: [
            {
                id: dataNodeId,
                type: 'algoNode',
                position: { x: 100, y: 200 },
                data: {
                    blockType: {
                        id: 'market_data',
                        name: 'Market Data',
                        category: 'Data Source',
                        description: 'Fetch market data for a symbol',
                    },
                    data: {
                        symbol: 'GOOGL',
                    }
                }
            },
            {
                id: bb1NodeId,
                type: 'algoNode',
                position: { x: 400, y: 100 },
                data: {
                    blockType: {
                        id: 'bollinger_bands',
                        name: 'Bollinger Bands (1 SD)',
                        category: 'Technical Indicator',
                        description: 'Calculate Bollinger Bands with 1 standard deviation',
                    },
                    data: {
                        period: 20,
                        stdDev: 1
                    }
                }
            },
            {
                id: bb2NodeId,
                type: 'algoNode',
                position: { x: 400, y: 300 },
                data: {
                    blockType: {
                        id: 'bollinger_bands',
                        name: 'Bollinger Bands (2 SD)',
                        category: 'Technical Indicator',
                        description: 'Calculate Bollinger Bands with 2 standard deviations',
                    },
                    data: {
                        period: 20,
                        stdDev: 2
                    }
                }
            },
            {
                id: upperBreakNodeId,
                type: 'algoNode',
                position: { x: 700, y: 100 },
                data: {
                    blockType: {
                        id: 'comparison',
                        name: 'Upper Band Break',
                        category: 'Condition',
                        description: 'Check if price breaks above upper band',
                    },
                    data: {
                        operator: '>'
                    }
                }
            },
            {
                id: lowerBreakNodeId,
                type: 'algoNode',
                position: { x: 700, y: 300 },
                data: {
                    blockType: {
                        id: 'comparison',
                        name: 'Lower Band Break',
                        category: 'Condition',
                        description: 'Check if price breaks below lower band',
                    },
                    data: {
                        operator: '<'
                    }
                }
            },
            {
                id: buySignalNodeId,
                type: 'algoNode',
                position: { x: 1000, y: 300 },
                data: {
                    blockType: {
                        id: 'trade_signal',
                        name: 'Buy Signal',
                        category: 'Signal',
                        description: 'Generate buy signal at lower band',
                    },
                    data: {
                        signal_type: 'BUY',
                    }
                }
            },
            {
                id: sellSignalNodeId,
                type: 'algoNode',
                position: { x: 1000, y: 100 },
                data: {
                    blockType: {
                        id: 'trade_signal',
                        name: 'Sell Signal',
                        category: 'Signal',
                        description: 'Generate sell signal at upper band',
                    },
                    data: {
                        signal_type: 'SELL',
                    }
                }
            },
            {
                id: marketOrderNodeId,
                type: 'algoNode',
                position: { x: 1300, y: 150 },
                data: {
                    blockType: {
                        id: 'market_order',
                        name: 'Market Order',
                        category: 'Order Execution',
                        description: 'Execute market order based on signals',
                    },
                    data: {
                        quantity: 5,
                    }
                }
            },
            {
                id: takeProfitNodeId,
                type: 'algoNode',
                position: { x: 1300, y: 300 },
                data: {
                    blockType: {
                        id: 'take_profit',
                        name: 'Take Profit',
                        category: 'Risk Management',
                        description: 'Set take profit level',
                    },
                    data: {
                        percent: 8,
                    }
                }
            }
        ],
        connections: [
            // Connect Market Data to Bollinger Bands
            { id: uuidv4(), source: dataNodeId, target: bb1NodeId, sourceHandle: 'price', targetHandle: 'price' },
            { id: uuidv4(), source: dataNodeId, target: bb2NodeId, sourceHandle: 'price', targetHandle: 'price' },

            // Connect price and bands to conditions
            { id: uuidv4(), source: dataNodeId, target: upperBreakNodeId, sourceHandle: 'price', targetHandle: 'value1' },
            { id: uuidv4(), source: bb2NodeId, target: upperBreakNodeId, sourceHandle: 'upper', targetHandle: 'value2' },
            { id: uuidv4(), source: dataNodeId, target: lowerBreakNodeId, sourceHandle: 'price', targetHandle: 'value1' },
            { id: uuidv4(), source: bb2NodeId, target: lowerBreakNodeId, sourceHandle: 'lower', targetHandle: 'value2' },

            // Connect conditions to signals
            { id: uuidv4(), source: upperBreakNodeId, target: sellSignalNodeId, sourceHandle: 'result', targetHandle: 'condition' },
            { id: uuidv4(), source: lowerBreakNodeId, target: buySignalNodeId, sourceHandle: 'result', targetHandle: 'condition' },

            // Connect signals to market order
            { id: uuidv4(), source: buySignalNodeId, target: marketOrderNodeId, sourceHandle: 'signal', targetHandle: 'signal' },
            { id: uuidv4(), source: sellSignalNodeId, target: marketOrderNodeId, sourceHandle: 'signal', targetHandle: 'signal' },

            // Connect data to take profit for reference
            { id: uuidv4(), source: dataNodeId, target: takeProfitNodeId, sourceHandle: 'price', targetHandle: 'entry_price' }
        ]
    };
})();

/**
 * Volume-Price Trend Following Strategy
 * 
 * This strategy combines price action with volume confirmation.
 * It buys when price increases with higher volume and sells when
 * price decreases with higher volume.
 */
export const volumePriceStrategy: StrategyTemplate = (() => {
    // Generate consistent node IDs
    const dataNodeId = generateNodeId('data');
    const maNodeId = generateNodeId('price_ma');
    const volumeMANodeId = generateNodeId('volume_ma');
    const priceIncreaseNodeId = generateNodeId('price_increase');
    const priceDecreaseNodeId = generateNodeId('price_decrease');
    const volumeHighNodeId = generateNodeId('volume_high');
    const buyConditionNodeId = generateNodeId('buy_condition');
    const sellConditionNodeId = generateNodeId('sell_condition');
    const buySignalNodeId = generateNodeId('buy_signal');
    const sellSignalNodeId = generateNodeId('sell_signal');
    const marketOrderNodeId = generateNodeId('market_order');

    return {
        name: 'Volume-Price Trend Strategy',
        description: 'Uses volume confirmation with price movements for stronger trend signals',
        blocks: [
            {
                id: dataNodeId,
                type: 'algoNode',
                position: { x: 100, y: 200 },
                data: {
                    blockType: {
                        id: 'market_data',
                        name: 'Market Data',
                        category: 'Data Source',
                        description: 'Fetch market data for a symbol',
                    },
                    data: {
                        symbol: 'AMZN',
                    }
                }
            },
            {
                id: maNodeId,
                type: 'algoNode',
                position: { x: 400, y: 100 },
                data: {
                    blockType: {
                        id: 'moving_average',
                        name: 'Price Moving Average',
                        category: 'Technical Indicator',
                        description: 'Calculate moving average of price',
                    },
                    data: {
                        period: 10,
                        type: 'SMA',
                    }
                }
            },
            {
                id: volumeMANodeId,
                type: 'algoNode',
                position: { x: 400, y: 300 },
                data: {
                    blockType: {
                        id: 'moving_average',
                        name: 'Volume Moving Average',
                        category: 'Technical Indicator',
                        description: 'Calculate moving average of volume',
                    },
                    data: {
                        period: 10,
                        type: 'SMA',
                    }
                }
            },
            {
                id: priceIncreaseNodeId,
                type: 'algoNode',
                position: { x: 700, y: 50 },
                data: {
                    blockType: {
                        id: 'comparison',
                        name: 'Price Increasing',
                        category: 'Condition',
                        description: 'Check if current price > moving average',
                    },
                    data: {
                        operator: '>'
                    }
                }
            },
            {
                id: priceDecreaseNodeId,
                type: 'algoNode',
                position: { x: 700, y: 150 },
                data: {
                    blockType: {
                        id: 'comparison',
                        name: 'Price Decreasing',
                        category: 'Condition',
                        description: 'Check if current price < moving average',
                    },
                    data: {
                        operator: '<'
                    }
                }
            },
            {
                id: volumeHighNodeId,
                type: 'algoNode',
                position: { x: 700, y: 250 },
                data: {
                    blockType: {
                        id: 'comparison',
                        name: 'Volume Higher Than Average',
                        category: 'Condition',
                        description: 'Check if current volume > volume average',
                    },
                    data: {
                        operator: '>'
                    }
                }
            },
            {
                id: buyConditionNodeId,
                type: 'algoNode',
                position: { x: 900, y: 100 },
                data: {
                    blockType: {
                        id: 'logical',
                        name: 'Buy Logic (AND)',
                        category: 'Condition',
                        description: 'Combine price increase AND volume higher conditions',
                    },
                    data: {
                        operator: 'AND'
                    }
                }
            },
            {
                id: sellConditionNodeId,
                type: 'algoNode',
                position: { x: 900, y: 300 },
                data: {
                    blockType: {
                        id: 'logical',
                        name: 'Sell Logic (AND)',
                        category: 'Condition',
                        description: 'Combine price decrease AND volume higher conditions',
                    },
                    data: {
                        operator: 'AND'
                    }
                }
            },
            {
                id: buySignalNodeId,
                type: 'algoNode',
                position: { x: 1100, y: 100 },
                data: {
                    blockType: {
                        id: 'trade_signal',
                        name: 'Buy Signal',
                        category: 'Signal',
                        description: 'Generate buy signal on price increase with volume',
                    },
                    data: {
                        signal_type: 'BUY',
                    }
                }
            },
            {
                id: sellSignalNodeId,
                type: 'algoNode',
                position: { x: 1100, y: 300 },
                data: {
                    blockType: {
                        id: 'trade_signal',
                        name: 'Sell Signal',
                        category: 'Signal',
                        description: 'Generate sell signal on price decrease with volume',
                    },
                    data: {
                        signal_type: 'SELL',
                    }
                }
            },
            {
                id: marketOrderNodeId,
                type: 'algoNode',
                position: { x: 1300, y: 200 },
                data: {
                    blockType: {
                        id: 'market_order',
                        name: 'Market Order',
                        category: 'Order Execution',
                        description: 'Execute market order based on signals',
                    },
                    data: {
                        quantity: 15,
                    }
                }
            }
        ],
        connections: [
            // Connect Market Data to indicators
            { id: uuidv4(), source: dataNodeId, target: maNodeId, sourceHandle: 'price', targetHandle: 'price' },
            { id: uuidv4(), source: dataNodeId, target: volumeMANodeId, sourceHandle: 'volume', targetHandle: 'volume' },

            // Connect price and MAs to conditions
            { id: uuidv4(), source: dataNodeId, target: priceIncreaseNodeId, sourceHandle: 'price', targetHandle: 'value1' },
            { id: uuidv4(), source: maNodeId, target: priceIncreaseNodeId, sourceHandle: 'ma', targetHandle: 'value2' },
            { id: uuidv4(), source: dataNodeId, target: priceDecreaseNodeId, sourceHandle: 'price', targetHandle: 'value1' },
            { id: uuidv4(), source: maNodeId, target: priceDecreaseNodeId, sourceHandle: 'ma', targetHandle: 'value2' },

            // Connect volume to condition
            { id: uuidv4(), source: dataNodeId, target: volumeHighNodeId, sourceHandle: 'volume', targetHandle: 'value1' },
            { id: uuidv4(), source: volumeMANodeId, target: volumeHighNodeId, sourceHandle: 'ma', targetHandle: 'value2' },

            // Connect conditions to logic gates
            { id: uuidv4(), source: priceIncreaseNodeId, target: buyConditionNodeId, sourceHandle: 'result', targetHandle: 'input1' },
            { id: uuidv4(), source: volumeHighNodeId, target: buyConditionNodeId, sourceHandle: 'result', targetHandle: 'input2' },
            { id: uuidv4(), source: priceDecreaseNodeId, target: sellConditionNodeId, sourceHandle: 'result', targetHandle: 'input1' },
            { id: uuidv4(), source: volumeHighNodeId, target: sellConditionNodeId, sourceHandle: 'result', targetHandle: 'input2' },

            // Connect logic to signals
            { id: uuidv4(), source: buyConditionNodeId, target: buySignalNodeId, sourceHandle: 'result', targetHandle: 'condition' },
            { id: uuidv4(), source: sellConditionNodeId, target: sellSignalNodeId, sourceHandle: 'result', targetHandle: 'condition' },

            // Connect signals to market order
            { id: uuidv4(), source: buySignalNodeId, target: marketOrderNodeId, sourceHandle: 'signal', targetHandle: 'signal' },
            { id: uuidv4(), source: sellSignalNodeId, target: marketOrderNodeId, sourceHandle: 'signal', targetHandle: 'signal' }
        ]
    };
})();

/**
 * Risk Management Strategy
 * 
 * This strategy demonstrates various risk management techniques:
 * - Position sizing based on % risk per trade
 * - Stop loss to limit downside
 * - Take profit to secure gains
 * - Trailing stop to lock in profits while letting winners run
 * - Risk/reward filter to only take quality trades
 */
export const riskManagementStrategy: StrategyTemplate = (() => {
    // Generate consistent node IDs
    const dataNodeId = generateNodeId('data');
    const maNodeId = generateNodeId('ma');
    const buySignalNodeId = generateNodeId('buy_signal');
    const sellSignalNodeId = generateNodeId('sell_signal');
    const stopLossNodeId = generateNodeId('stop_loss');
    const takeProfitNodeId = generateNodeId('take_profit');
    const trailingStopNodeId = generateNodeId('trailing_stop');
    const positionSizingNodeId = generateNodeId('position_sizing');
    const riskRewardNodeId = generateNodeId('risk_reward');
    const marketOrderNodeId = generateNodeId('market_order');

    return {
        name: 'Risk Management Strategy',
        description: 'Complete strategy with position sizing, stop loss, take profit, and trailing stop for professional risk management',
        blocks: [
            {
                id: dataNodeId,
                type: 'algoNode',
                position: { x: 100, y: 250 },
                data: {
                    blockType: {
                        id: 'market_data',
                        name: 'Market Data',
                        category: 'Data Source',
                        description: 'Fetch market data for a symbol',
                    },
                    data: {
                        symbol: 'AAPL',
                    }
                }
            },
            {
                id: maNodeId,
                type: 'algoNode',
                position: { x: 350, y: 250 },
                data: {
                    blockType: {
                        id: 'moving_average',
                        name: 'Moving Average',
                        category: 'Technical Indicator',
                        description: 'Calculate moving average of price',
                    },
                    data: {
                        period: 20,
                        type: 'SMA',
                    }
                }
            },
            {
                id: buySignalNodeId,
                type: 'algoNode',
                position: { x: 600, y: 150 },
                data: {
                    blockType: {
                        id: 'trade_signal',
                        name: 'Buy Signal',
                        category: 'Signal',
                        description: 'Generate buy signal when price crosses above MA',
                    },
                    data: {
                        signal_type: 'BUY',
                    }
                }
            },
            {
                id: sellSignalNodeId,
                type: 'algoNode',
                position: { x: 600, y: 350 },
                data: {
                    blockType: {
                        id: 'trade_signal',
                        name: 'Sell Signal',
                        category: 'Signal',
                        description: 'Generate sell signal when price crosses below MA',
                    },
                    data: {
                        signal_type: 'SELL',
                    }
                }
            },
            {
                id: stopLossNodeId,
                type: 'algoNode',
                position: { x: 850, y: 100 },
                data: {
                    blockType: {
                        id: 'stop_loss',
                        name: 'Stop Loss',
                        category: 'Risk Management',
                        description: 'Add stop loss to trade',
                    },
                    data: {
                        percent: 3,
                    }
                }
            },
            {
                id: takeProfitNodeId,
                type: 'algoNode',
                position: { x: 850, y: 250 },
                data: {
                    blockType: {
                        id: 'take_profit',
                        name: 'Take Profit',
                        category: 'Risk Management',
                        description: 'Add take profit target to trade',
                    },
                    data: {
                        percent: 6,
                        direction: 'LONG',
                    }
                }
            },
            {
                id: trailingStopNodeId,
                type: 'algoNode',
                position: { x: 850, y: 400 },
                data: {
                    blockType: {
                        id: 'trailing_stop',
                        name: 'Trailing Stop',
                        category: 'Risk Management',
                        description: 'Add trailing stop that follows price movement',
                    },
                    data: {
                        trail_percent: 5,
                        direction: 'LONG',
                    }
                }
            },
            {
                id: positionSizingNodeId,
                type: 'algoNode',
                position: { x: 1100, y: 150 },
                data: {
                    blockType: {
                        id: 'position_sizing',
                        name: 'Position Sizing',
                        category: 'Risk Management',
                        description: 'Calculate position size based on risk management rules',
                    },
                    data: {
                        account_size: 10000,
                        risk_percent: 1,
                    }
                }
            },
            {
                id: riskRewardNodeId,
                type: 'algoNode',
                position: { x: 1100, y: 350 },
                data: {
                    blockType: {
                        id: 'risk_reward',
                        name: 'Risk/Reward Filter',
                        category: 'Risk Management',
                        description: 'Filter trades based on risk/reward ratio',
                    },
                    data: {
                        min_ratio: 2,
                    }
                }
            },
            {
                id: marketOrderNodeId,
                type: 'algoNode',
                position: { x: 1350, y: 250 },
                data: {
                    blockType: {
                        id: 'market_order',
                        name: 'Market Order',
                        category: 'Order Execution',
                        description: 'Execute market order based on signals',
                    },
                    data: {
                        quantity: 10,
                    }
                }
            }
        ],
        connections: [
            // Connect data to indicators
            { id: uuidv4(), source: dataNodeId, target: maNodeId, sourceHandle: 'price', targetHandle: 'price' },

            // Connect data to generate signals based on MA
            { id: uuidv4(), source: dataNodeId, target: buySignalNodeId, sourceHandle: 'price', targetHandle: 'condition' },
            { id: uuidv4(), source: dataNodeId, target: sellSignalNodeId, sourceHandle: 'price', targetHandle: 'condition' },

            // Connect data to risk management blocks
            { id: uuidv4(), source: dataNodeId, target: stopLossNodeId, sourceHandle: 'price', targetHandle: 'entry_price' },
            { id: uuidv4(), source: dataNodeId, target: takeProfitNodeId, sourceHandle: 'price', targetHandle: 'entry_price' },
            { id: uuidv4(), source: dataNodeId, target: trailingStopNodeId, sourceHandle: 'price', targetHandle: 'price' },

            // Connect stop loss to position sizing
            { id: uuidv4(), source: dataNodeId, target: positionSizingNodeId, sourceHandle: 'price', targetHandle: 'entry_price' },
            { id: uuidv4(), source: stopLossNodeId, target: positionSizingNodeId, sourceHandle: 'stop_price', targetHandle: 'stop_price' },

            // Connect risk management to risk/reward
            { id: uuidv4(), source: dataNodeId, target: riskRewardNodeId, sourceHandle: 'price', targetHandle: 'entry_price' },
            { id: uuidv4(), source: stopLossNodeId, target: riskRewardNodeId, sourceHandle: 'stop_price', targetHandle: 'stop_price' },
            { id: uuidv4(), source: takeProfitNodeId, target: riskRewardNodeId, sourceHandle: 'target_price', targetHandle: 'target_price' },
            { id: uuidv4(), source: buySignalNodeId, target: riskRewardNodeId, sourceHandle: 'signal', targetHandle: 'signal' },

            // Connect to market order
            { id: uuidv4(), source: positionSizingNodeId, target: marketOrderNodeId, sourceHandle: 'position_size', targetHandle: 'quantity' },
            { id: uuidv4(), source: riskRewardNodeId, target: marketOrderNodeId, sourceHandle: 'filtered_signal', targetHandle: 'signal' },
            { id: uuidv4(), source: stopLossNodeId, target: marketOrderNodeId, sourceHandle: 'signal', targetHandle: 'signal' },
            { id: uuidv4(), source: takeProfitNodeId, target: marketOrderNodeId, sourceHandle: 'signal', targetHandle: 'signal' },
            { id: uuidv4(), source: trailingStopNodeId, target: marketOrderNodeId, sourceHandle: 'signal', targetHandle: 'signal' },
        ]
    };
})();

export const allTemplates = [
    movingAverageCrossover,
    rsiStrategy,
    bollingerBandsStrategy,
    volumePriceStrategy,
    riskManagementStrategy
];

export default allTemplates; 