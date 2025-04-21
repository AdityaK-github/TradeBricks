import express from 'express';
import { fetchTokenData, fetchHistoricalPrices, estimateGasCosts, getGasPrices, getTopTokens } from '../services/ethereumService.js';

const router = express.Router();

// Get token information by address
router.get('/token/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const tokenData = await fetchTokenData(address);
        res.json({ success: true, result: tokenData });
    } catch (error: any) {
        console.error('Error fetching token data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch token data', error: error.message });
    }
});

// Get historical market data for a token
router.get('/market-data/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { startDate, endDate } = req.query;

        const marketData = await fetchHistoricalPrices(
            address,
            startDate as string,
            endDate as string
        );

        res.json({ success: true, result: marketData });
    } catch (error: any) {
        console.error('Error fetching token market data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch market data', error: error.message });
    }
});

// Simulate gas costs for a series of trades
router.post('/simulate-gas', async (req, res) => {
    try {
        const { tokenAddress, operations } = req.body;
        const gasEstimate = await estimateGasCosts(tokenAddress, operations);

        res.json({ success: true, result: { totalGas: gasEstimate } });
    } catch (error: any) {
        console.error('Error simulating gas costs:', error);
        res.status(500).json({ success: false, message: 'Failed to simulate gas costs', error: error.message });
    }
});

// Get current gas prices
router.get('/gas-price', async (req, res) => {
    try {
        const gasPrices = await getGasPrices();
        res.json({ success: true, result: gasPrices });
    } catch (error: any) {
        console.error('Error fetching gas prices:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch gas prices', error: error.message });
    }
});

// Get top cryptocurrencies
router.get('/top-assets', async (req, res) => {
    try {
        const topTokens = await getTopTokens();
        res.json({ success: true, result: { topCrypto: topTokens, topStocks: [] } });
    } catch (error: any) {
        console.error('Error fetching top assets:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch top assets', error: error.message });
    }
});

export default router; 