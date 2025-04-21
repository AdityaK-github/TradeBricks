import { fetchHistoricalData, MarketData } from './marketDataService.js';

interface BacktestOptions {
    startDate: string;
    endDate: string;
    initialCapital: number;
    tokenAddress?: string;
    allowSimulatedData?: boolean; // Whether to allow simulated data if real data isn't available
    usePriceType?: 'open' | 'high' | 'low' | 'close'; // Type of price to use for trades
}

interface Trade {
    date: string;
    action: 'BUY' | 'SELL';
    price: number;
}

interface BacktestResult {
    trades: Trade[];
    finalCapital: number;
    totalReturn: number;
    usingSimulatedData: boolean;
}

export const runBacktest = async (strategy: any, options: BacktestOptions): Promise<BacktestResult> => {
    const { startDate, endDate, initialCapital, tokenAddress, usePriceType = 'close' } = options;

    console.log(`Running backtest for strategy '${strategy.name || 'Unnamed'}' on symbol ${strategy.symbol}`);
    console.log(`Parameters: From ${startDate} to ${endDate} with initial capital $${initialCapital}`);
    console.log(`Using price type: ${usePriceType}`);

    if (tokenAddress) {
        console.log(`Using Ethereum token address: ${tokenAddress}`);
    }

    // Fetch real market data from appropriate APIs
    let marketData: MarketData[] = [];

    try {
        console.log(`Requesting real historical market data for ${strategy.symbol} from financial APIs...`);
        marketData = await fetchHistoricalData(
            strategy.symbol,
            startDate,
            endDate,
            tokenAddress || strategy.tokenAddress
        );
        console.log(`Successfully retrieved real market data for ${strategy.symbol} from financial APIs`);
    } catch (error) {
        console.error(`Failed to get real market data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw new Error(`Could not fetch real market data for ${strategy.symbol}. Please try a different symbol or time range.`);
    }

    if (!marketData.length) {
        throw new Error('No real market data available for the specified period');
    }

    console.log(`Fetched ${marketData.length} real data points for ${strategy.symbol} from financial APIs`);

    // Validate the market data for realistic prices
    validateMarketData(strategy.symbol, marketData);

    // Initialize variables
    let capital = initialCapital;
    let position = 0; // Number of shares held
    let buyPrice = 0; // Track entry price for calculating P/L
    const trades: Trade[] = [];

    // NEW IMPLEMENTATION: Build a proper execution graph from the blocks and connections

    // Get blocks and connections
    const blocks = strategy.blocks || [];
    const connections = strategy.connections || [];

    // Create a map of blocks by ID for quick lookup
    const blocksById = new Map();
    blocks.forEach((block: any) => {
        blocksById.set(block.id, block);
    });

    // Create a graph representation of the strategy
    const graph = new Map();
    connections.forEach((connection: any) => {
        if (!graph.has(connection.source)) {
            graph.set(connection.source, []);
        }
        graph.get(connection.source).push({
            target: connection.target,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle
        });
    });

    // Create a reverse graph to find nodes with incoming connections
    const reverseGraph = new Map();
    connections.forEach((connection: any) => {
        if (!reverseGraph.has(connection.target)) {
            reverseGraph.set(connection.target, []);
        }
        reverseGraph.get(connection.target).push({
            source: connection.source,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle
        });
    });

    // Find entry point blocks (explicit entry conditions or terminal comparisons with no outgoing connections)
    const entryBlocks = blocks.filter((block: any) => {
        const blockType = block.data?.blockType?.id;

        // Explicit entry condition blocks
        if (blockType === 'entry_condition') {
            return true;
        }

        // Terminal comparison blocks that could serve as entry points
        if (blockType === 'comparison') {
            // A comparison is an entry point if it's not connected to any other block's input
            // and it's not explicitly an exit condition
            const isTerminal = !graph.has(block.id) || graph.get(block.id).length === 0;
            const notExplicitExit = block.data?.purpose !== 'exit';

            return isTerminal && notExplicitExit;
        }

        return false;
    });

    // Find exit point blocks
    const exitBlocks = blocks.filter((block: any) => {
        const blockType = block.data?.blockType?.id;

        // Explicit exit condition blocks
        if (blockType === 'exit_condition') {
            return true;
        }

        // Terminal comparison blocks that could serve as exit points
        if (blockType === 'comparison') {
            // A comparison is an exit point if it's not connected to any other block's input
            // and it's not explicitly an entry condition
            const isTerminal = !graph.has(block.id) || graph.get(block.id).length === 0;
            const notExplicitEntry = block.data?.purpose !== 'entry';

            // If we already identified it as an entry point, don't also use it as an exit
            const isAlsoEntryPoint = entryBlocks.some((eb: any) => eb.id === block.id);

            return isTerminal && notExplicitEntry && !isAlsoEntryPoint;
        }

        return false;
    });

    // If no entry blocks found, look for any indicator or price blocks that could trigger entry
    if (entryBlocks.length === 0) {
        console.log('No explicit entry blocks found, looking for indicators or price blocks to use');

        // Look for pattern: price above MA, RSI below threshold, etc.
        for (const block of blocks) {
            const blockType = block.data?.blockType?.id;
            if (['moving_average', 'price', 'rsi', 'bollinger_bands'].includes(blockType)) {
                entryBlocks.push(block);
                console.log(`Using ${blockType} block as entry condition`);
                break;
            }
        }
    }

    // If still no entry blocks, use a simple price based entry
    if (entryBlocks.length === 0) {
        console.log('No suitable entry blocks found, will use default entry strategy');

        // Create a dummy entry block
        const dummyEntryBlock = {
            id: 'default-entry',
            data: {
                blockType: {
                    id: 'price'
                }
            }
        };
        entryBlocks.push(dummyEntryBlock);
    }

    console.log(`Strategy has ${entryBlocks.length} entry points and ${exitBlocks.length} exit points`);

    // Cache for indicator values to avoid recalculating
    const indicatorCache = new Map();

    // Process market data day by day
    for (let i = 0; i < marketData.length; i++) {
        const currentData = marketData[i];
        const dataWindow = marketData.slice(0, i + 1); // All data up to current day

        // Clear cache for each day
        indicatorCache.clear();

        // Create context for this day's evaluation
        const context = {
            dataWindow,
            currentData,
            currentIndex: i,
            position,
            capital,
            marketData
        };

        // Check entry conditions if we're not already in a position
        if (position === 0) {
            // Evaluate each entry block
            for (const entryBlock of entryBlocks) {
                const shouldEnter = evaluateBlock(entryBlock, context, blocksById, graph, indicatorCache);

                if (shouldEnter) {
                    // Get the price for the trade based on specified price type
                    const tradePrice = currentData[usePriceType];

                    // Buy signal
                    position = capital / tradePrice;
                    buyPrice = tradePrice;
                    capital = 0;
                    trades.push({ date: currentData.date, action: 'BUY', price: tradePrice });
                    console.log(`BUY on ${currentData.date} at $${tradePrice.toFixed(2)}`);
                    break; // Exit after first entry signal
                }
            }
        }
        // Check exit conditions if we're in a position
        else if (position > 0) {
            // Exit if we have exit blocks, otherwise use default exit logic
            if (exitBlocks.length > 0) {
                // Evaluate each exit block
                for (const exitBlock of exitBlocks) {
                    const shouldExit = evaluateBlock(exitBlock, context, blocksById, graph, indicatorCache);

                    if (shouldExit) {
                        // Get the price for the trade based on specified price type
                        const tradePrice = currentData[usePriceType];

                        // Sell signal
                        capital = position * tradePrice;
                        position = 0;
                        trades.push({ date: currentData.date, action: 'SELL', price: tradePrice });
                        console.log(`SELL on ${currentData.date} at $${tradePrice.toFixed(2)}`);
                        break; // Exit after first exit signal
                    }
                }
            }
            // If no exit blocks defined, use a basic profit/loss exit
            else if (currentData[usePriceType] < buyPrice * 0.95 || currentData[usePriceType] > buyPrice * 1.2) {
                // Get the price for the trade based on specified price type
                const tradePrice = currentData[usePriceType];

                // Basic stop-loss (5%) or take-profit (20%)
                capital = position * tradePrice;
                position = 0;
                trades.push({ date: currentData.date, action: 'SELL', price: tradePrice });
                console.log(`Default SELL on ${currentData.date} at $${tradePrice.toFixed(2)}`);
            }
        }
    }

    // Final exit - sell any remaining position at the last price
    if (position > 0) {
        const lastDay = marketData[marketData.length - 1];
        const finalPrice = lastDay[usePriceType];
        capital = position * finalPrice;
        position = 0;
        trades.push({ date: lastDay.date, action: 'SELL', price: finalPrice });
        console.log(`Final SELL on ${lastDay.date} at $${finalPrice.toFixed(2)}`);
    }

    // Calculate results
    const totalReturn = ((capital - initialCapital) / initialCapital) * 100;

    console.log(`Backtest completed with ${trades.length} trades`);
    console.log(`Initial capital: $${initialCapital.toFixed(2)}`);
    console.log(`Final capital: $${capital.toFixed(2)}`);
    console.log(`Total return: ${totalReturn.toFixed(2)}%`);

    return {
        trades,
        finalCapital: capital,
        totalReturn,
        usingSimulatedData: false
    };
};

/**
 * Recursively evaluates a block and its dependencies based on the strategy graph
 */
function evaluateBlock(block: any, context: any, blocksById: Map<string, any>, graph: Map<string, any>, cache: Map<string, any>): boolean | number {
    // Safety check for null or undefined block
    if (!block || !block.id) {
        console.warn('Invalid block passed to evaluateBlock');
        return false;
    }

    const blockId = block.id;
    const blockType = block.data?.blockType?.id;

    if (!blockType) {
        console.warn(`Block ${blockId} has no blockType defined`);
        return false;
    }

    // Return cached result if available
    const cacheKey = `${blockId}_${context.currentIndex}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    let result: boolean | number = false;

    try {
        // Evaluate block based on its type
        switch (blockType) {
            case 'entry_condition':
            case 'exit_condition':
                // Find connected blocks (should be comparisons or indicators)
                if (graph.has(blockId)) {
                    const connections = graph.get(blockId);
                    // Check if any connected block evaluates to true
                    for (const conn of connections) {
                        const targetBlock = blocksById.get(conn.target);
                        if (targetBlock) {
                            const targetResult = evaluateBlock(targetBlock, context, blocksById, graph, cache);
                            // For boolean results
                            if (typeof targetResult === 'boolean' && targetResult) {
                                result = true;
                                break;
                            }
                        }
                    }
                }
                break;

            case 'comparison':
                // Get comparison parameters
                const comparisonType = block.data?.comparisonType || 'greater_than';

                // Get values from connected blocks
                let value1: number | undefined = undefined;
                let value2: number | undefined = undefined;

                // First check if we have direct values in the block data
                if (block.data?.value1 !== undefined && block.data?.value1 !== null) {
                    value1 = parseFloat(block.data.value1);
                    if (isNaN(value1)) value1 = undefined;
                }

                if (block.data?.value2 !== undefined && block.data?.value2 !== null) {
                    value2 = parseFloat(block.data.value2);
                    if (isNaN(value2)) value2 = undefined;
                }

                // If we have both direct values, we don't need to look at connections
                if (value1 !== undefined && value2 !== undefined) {
                    // Values are already set, so skip connection logic
                }
                // Otherwise check incoming connections to this block
                else {
                    // Find all connections where this block is the target
                    for (const [sourceId, connections] of graph.entries()) {
                        for (const conn of connections) {
                            if (conn.target === blockId) {
                                const sourceBlock = blocksById.get(sourceId);
                                if (sourceBlock) {
                                    const sourceResult = evaluateBlock(sourceBlock, context, blocksById, graph, cache);

                                    // Assign the result to the appropriate input based on targetHandle
                                    if (conn.targetHandle === 'input1') {
                                        value1 = typeof sourceResult === 'number' ? sourceResult : undefined;
                                    } else if (conn.targetHandle === 'input2') {
                                        value2 = typeof sourceResult === 'number' ? sourceResult : undefined;
                                    }
                                }
                            }
                        }
                    }
                }

                // Perform comparison if both values are available
                if (value1 !== undefined && value2 !== undefined) {
                    switch (comparisonType) {
                        case 'greater_than':
                            result = value1 > value2;
                            break;
                        case 'less_than':
                            result = value1 < value2;
                            break;
                        case 'equal_to':
                            result = Math.abs(value1 - value2) < 0.00001; // Float comparison with epsilon
                            break;
                        case 'greater_than_or_equal':
                            result = value1 >= value2;
                            break;
                        case 'less_than_or_equal':
                            result = value1 <= value2;
                            break;
                        default:
                            result = false;
                    }
                } else {
                    console.warn(`Comparison block ${blockId} missing values: value1=${value1}, value2=${value2}`);
                }
                break;

            case 'moving_average':
                // Calculate or fetch moving average
                const maPeriod = parseInt(block.data?.period || '20', 10);
                if (isNaN(maPeriod) || maPeriod <= 0) {
                    console.warn(`Invalid MA period for block ${blockId}: ${block.data?.period}`);
                    result = context.currentData.close; // Fallback to current price
                } else {
                    result = calculateMA(context.dataWindow.map((d: any) => d.close), maPeriod);
                }
                break;

            case 'rsi':
                // Calculate or fetch RSI
                const rsiPeriod = parseInt(block.data?.period || '14', 10);
                if (isNaN(rsiPeriod) || rsiPeriod <= 0) {
                    console.warn(`Invalid RSI period for block ${blockId}: ${block.data?.period}`);
                    result = 50; // Neutral RSI as fallback
                } else {
                    result = calculateRSI(context.marketData, context.currentIndex, rsiPeriod);
                }
                break;

            case 'bollinger_bands':
                // Calculate or fetch Bollinger Bands
                const bbPeriod = parseInt(block.data?.period || '20', 10);
                const stdDevMultiplier = parseFloat(block.data?.stdDev || '2');

                if (isNaN(bbPeriod) || bbPeriod <= 0 || isNaN(stdDevMultiplier)) {
                    console.warn(`Invalid Bollinger Band parameters for block ${blockId}: period=${block.data?.period}, stdDev=${block.data?.stdDev}`);
                    result = context.currentData.close; // Fallback to current price
                } else {
                    const prices = context.dataWindow.map((d: any) => d.close);
                    const ma = calculateMA(prices, bbPeriod);

                    // Only calculate bands if we have enough data
                    if (prices.length >= bbPeriod) {
                        const recentPrices = prices.slice(-bbPeriod);
                        const stdDev = calculateStdDev(recentPrices);

                        // Determine which band to return based on connection
                        const bandType = block.data?.outputType || 'middle';
                        switch (bandType) {
                            case 'upper':
                                result = ma + (stdDevMultiplier * stdDev);
                                break;
                            case 'lower':
                                result = ma - (stdDevMultiplier * stdDev);
                                break;
                            default: // middle
                                result = ma;
                        }
                    } else {
                        result = context.currentData.close; // Default when not enough data
                    }
                }
                break;

            case 'price':
                // Get price type from block data
                const priceType = block.data?.priceType || 'close';
                switch (priceType) {
                    case 'open':
                        result = context.currentData.open;
                        break;
                    case 'high':
                        result = context.currentData.high;
                        break;
                    case 'low':
                        result = context.currentData.low;
                        break;
                    default: // close
                        result = context.currentData.close;
                }
                break;

            default:
                // For unsupported block types, return a safe default
                console.warn(`Unsupported block type: ${blockType}`);
                result = false;
        }
    } catch (error) {
        console.error(`Error evaluating block ${blockId} of type ${blockType}:`, error);
        // Provide reasonable defaults based on block type
        if (blockType === 'moving_average' || blockType === 'bollinger_bands' || blockType === 'price') {
            result = context.currentData.close;
        } else if (blockType === 'rsi') {
            result = 50;
        } else {
            result = false;
        }
    }

    // Cache the result
    cache.set(cacheKey, result);
    return result;
}

// Helper function to calculate standard deviation
function calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => {
        const diff = value - mean;
        return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
}

// Calculate a moving average over n periods
function calculateMA(values: number[], period: number): number {
    if (values.length === 0) return 0;
    return values.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, values.length);
}

// Helper function to extract strategy parameters
function extractStrategyParameters(strategy: any) {
    const params = {
        maPeriods: [] as number[],
        rsiPeriod: 14,
        rsiOversold: 30,
        rsiOverbought: 70,
        bollingerBandWidth: 2
    };

    try {
        // Extract MA periods
        const maBlocks = strategy.blocks?.filter((block: any) =>
            block.data?.blockType?.id === 'moving_average') || [];

        // Get all unique MA periods
        maBlocks.forEach((block: any) => {
            const period = parseInt(block.data?.data?.period);
            if (!isNaN(period) && period > 0 && !params.maPeriods.includes(period)) {
                params.maPeriods.push(period);
            }
        });

        // If no MA periods found, add defaults
        if (params.maPeriods.length === 0) {
            params.maPeriods = [10, 20];
        }

        // Extract RSI parameters
        const rsiBlocks = strategy.blocks?.filter((block: any) =>
            block.data?.blockType?.id === 'rsi') || [];

        if (rsiBlocks.length > 0) {
            const rsiBlock = rsiBlocks[0];
            const period = parseInt(rsiBlock.data?.data?.period);
            if (!isNaN(period) && period > 0) {
                params.rsiPeriod = period;
            }

            // Try to find oversold/overbought levels in comparison blocks
            const comparisonBlocks = strategy.blocks?.filter((block: any) =>
                block.data?.blockType?.id === 'comparison') || [];

            comparisonBlocks.forEach((block: any) => {
                // Look for RSI comparisons
                const value = parseFloat(block.data?.data?.value2);
                if (!isNaN(value)) {
                    if (value <= 30) params.rsiOversold = value;
                    if (value >= 70) params.rsiOverbought = value;
                }
            });
        }

        // Extract Bollinger Band parameters
        const bollingerBlocks = strategy.blocks?.filter((block: any) =>
            block.data?.blockType?.id === 'bollinger_bands') || [];

        if (bollingerBlocks.length > 0) {
            const bollingerBlock = bollingerBlocks[0];
            const width = parseFloat(bollingerBlock.data?.data?.stdDev);
            if (!isNaN(width) && width > 0) {
                params.bollingerBandWidth = width;
            }
        }
    } catch (error) {
        console.warn('Error extracting strategy parameters:', error);
    }

    return params;
}

// Calculate RSI for a specific point in time
function calculateRSI(marketData: MarketData[], currentIndex: number, period: number = 14): number {
    if (currentIndex < period) {
        return 50; // Default value for insufficient data
    }

    let gains = 0;
    let losses = 0;

    // Calculate average gains and losses over the period
    for (let i = currentIndex - period; i < currentIndex; i++) {
        const change = marketData[i + 1].close - marketData[i].close;
        if (change > 0) {
            gains += change;
        } else {
            losses += Math.abs(change);
        }
    }

    // Calculate average gain and loss
    const avgGain = gains / period;
    const avgLoss = losses / period || 0.0001; // Avoid division by zero

    // Calculate RS and RSI
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// Add a new function to validate market data
function validateMarketData(symbol: string, data: MarketData[]): void {
    try {
        if (!data || data.length === 0) {
            console.warn('Empty market data set - validation skipped');
            return;
        }

        // Get the most recent price
        const latestPrice = data[data.length - 1]?.close || 0;
        const earliestPrice = data[0]?.close || 0;

        if (latestPrice === 0 || earliestPrice === 0) {
            console.warn('Invalid price data detected - validation skipped');
            return;
        }

        // Get min and max prices in the dataset, handling potential null/undefined values
        const prices = data.map(d => d.close).filter(p => p !== undefined && p !== null && !isNaN(p));

        if (prices.length === 0) {
            console.warn('No valid prices found in dataset - validation skipped');
            return;
        }

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        console.log(`Price summary for ${symbol}:`);
        console.log(`- Starting price: $${earliestPrice.toFixed(2)}`);
        console.log(`- Ending price: $${latestPrice.toFixed(2)}`);
        console.log(`- Min price: $${minPrice.toFixed(2)}`);
        console.log(`- Max price: $${maxPrice.toFixed(2)}`);

        // Check for common stock tickers that have had splits
        const splitAdjustedStocks: { [key: string]: { symbol: string, recentSplits: string[] } } = {
            'AAPL': { symbol: 'Apple', recentSplits: ['4-for-1 in August 2020'] },
            'TSLA': { symbol: 'Tesla', recentSplits: ['3-for-1 in August 2022', '5-for-1 in August 2020'] },
            'AMZN': { symbol: 'Amazon', recentSplits: ['20-for-1 in June 2022'] },
            'GOOGL': { symbol: 'Google', recentSplits: ['20-for-1 in July 2022'] },
            'NVDA': { symbol: 'NVIDIA', recentSplits: ['4-for-1 in July 2021', '4-for-1 in July 2023'] },
        };

        const upperSymbol = (symbol || '').toUpperCase();
        if (splitAdjustedStocks[upperSymbol]) {
            const stockInfo = splitAdjustedStocks[upperSymbol];
            console.log(`Note: ${stockInfo.symbol} has had recent stock splits: ${stockInfo.recentSplits.join(', ')}`);
            console.log(`The data should be split-adjusted to reflect current prices.`);
        }

        // Check for potentially incorrect prices
        const knownCurrentPrices: { [key: string]: { range: number[] } } = {
            'AAPL': { range: [150, 220] },
            'TSLA': { range: [180, 280] },
            'AMZN': { range: [120, 190] },
            'GOOGL': { range: [100, 150] },
            'MSFT': { range: [300, 420] },
            'META': { range: [250, 350] },
            'NVDA': { range: [400, 650] },
        };

        if (knownCurrentPrices[upperSymbol] && !symbol.includes('-')) {
            const { range } = knownCurrentPrices[upperSymbol];
            if (latestPrice < range[0] || latestPrice > range[1]) {
                console.warn(`Warning: Latest price for ${symbol} ($${latestPrice.toFixed(2)}) appears outside expected range ($${range[0]} - $${range[1]})`);
                console.warn(`This could indicate the data is not properly split-adjusted.`);
            } else {
                console.log(`Price for ${symbol} appears to be in the expected range.`);
            }
        }
    } catch (error) {
        // Catch any validation errors to prevent breaking the backtesting flow
        console.error('Error during market data validation:', error);
        console.log('Continuing with backtest despite validation error');
    }
}
