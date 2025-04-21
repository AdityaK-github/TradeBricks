import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { runBacktest } from '../services/backtestService.js';

// Make sure the in-memory DB is initialized
if (!global.inMemoryDB) {
    global.inMemoryDB = {
        strategies: [],
        users: []
    };
}

const isMongoConnected = (): boolean => {
    return mongoose.connection.readyState === 1;
};

export const backtest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { strategyId } = req.params;
        const {
            startDate,
            endDate,
            initialCapital,
            symbol,
            tokenAddress,
            assetType,
            allowSimulatedData = false // Default to not allowing simulated data
        } = req.body;

        if (!symbol) {
            res.status(400).json({ message: 'Symbol is required for backtesting' });
            return;
        }

        console.log(`Backtest request received: symbol=${symbol}, tokenAddress=${tokenAddress || 'N/A'}, assetType=${assetType || 'stock'}, allowSimulatedData=${allowSimulatedData}`);

        let strategy;

        if (isMongoConnected()) {
            try {
                // Fix: Add .js extension as required by ES modules
                const StrategyModel = (await import('../models/Strategy.js')).default;
                strategy = await StrategyModel.findById(strategyId);

                if (!strategy) {
                    res.status(404).json({ message: 'Strategy not found' });
                    return;
                }
            } catch (importError) {
                console.error("Error importing Strategy model:", importError);
                res.status(500).json({ message: 'Error importing Strategy model', error: importError instanceof Error ? importError.message : 'Unknown error' });
                return;
            }
        } else {
            // Ensure inMemoryDB is initialized
            if (!global.inMemoryDB) {
                global.inMemoryDB = {
                    strategies: [],
                    users: []
                };
            }

            strategy = global.inMemoryDB.strategies.find((s: any) => s._id === strategyId);

            if (!strategy) {
                res.status(404).json({ message: 'Strategy not found' });
                return;
            }
        }

        // Add symbol and token data to strategy for backtest
        strategy.symbol = symbol;

        // For Ethereum tokens, attach the token address
        if (assetType === 'crypto' && tokenAddress) {
            strategy.tokenAddress = tokenAddress;
        }

        try {
            // Run the actual backtest
            const result = await runBacktest(strategy, {
                startDate,
                endDate,
                initialCapital,
                tokenAddress,
                allowSimulatedData,
                usePriceType: req.body.usePriceType || 'close' // Ensure closing prices are used
            });

            // If simulated data was used but not allowed, return an error
            if (result.usingSimulatedData && !allowSimulatedData) {
                res.status(400).json({
                    message: 'Could not retrieve real market data and simulated data was not allowed',
                    error: 'SIMULATED_DATA_NOT_ALLOWED'
                });
                return;
            }

            res.status(200).json({
                message: 'Backtest completed successfully',
                result,
                warnings: result.usingSimulatedData ? ['Simulated data was used for this backtest. Results may not reflect real market conditions.'] : []
            });
        } catch (error) {
            // Special handling for "No market data available" errors
            if (error instanceof Error && error.message.includes('No market data available')) {
                res.status(400).json({
                    message: 'No market data available for the specified period and symbol',
                    error: 'NO_MARKET_DATA'
                });
                return;
            }

            throw error; // Re-throw for general error handling
        }
    } catch (error) {
        console.error('Error running backtest:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ message: 'Error running backtest', error: errorMessage });
    }
};
