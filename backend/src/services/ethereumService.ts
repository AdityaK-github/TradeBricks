import axios from 'axios';
import dotenv from 'dotenv';
import {
    getCurrentTokenPrice,
    fetchHistoricalPricesByAddress,
    getTokenInfoByAddress
} from './cryptoCompareService.js';

dotenv.config();

// API keys and endpoints
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';
const INFURA_API_KEY = process.env.INFURA_API_KEY || '';

interface TokenData {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    price: number;
}

interface TokenPriceData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/**
 * Fetch basic token information from Etherscan and price from CryptoCompare
 */
export async function fetchTokenData(tokenAddress: string): Promise<TokenData> {
    try {
        // Get token info from Etherscan API
        const etherscanResponse = await axios.get('https://api.etherscan.io/api', {
            params: {
                module: 'token',
                action: 'tokeninfo',
                contractaddress: tokenAddress,
                apikey: ETHERSCAN_API_KEY
            }
        });

        if (etherscanResponse.data.status !== '1') {
            throw new Error(`Etherscan API error: ${etherscanResponse.data.message}`);
        }

        const tokenInfo = etherscanResponse.data.result[0];

        // Get token information from CryptoCompare
        let tokenSymbol = tokenInfo.symbol;
        let price = 0;

        try {
            // Get current price from CryptoCompare
            price = await getCurrentTokenPrice(tokenSymbol);
        } catch (priceError) {
            console.error('Error getting token price:', priceError);
            price = 0;
        }

        return {
            address: tokenAddress,
            name: tokenInfo.tokenName,
            symbol: tokenInfo.symbol,
            decimals: parseInt(tokenInfo.divisor),
            totalSupply: tokenInfo.totalSupply,
            price: price
        };
    } catch (error) {
        console.error('Error fetching token data:', error);
        throw error;
    }
}

/**
 * Fetch historical price data for a token
 */
export async function fetchHistoricalPrices(
    tokenAddress: string,
    startDate: string,
    endDate: string
): Promise<TokenPriceData[]> {
    try {
        console.log(`Fetching historical prices for token address: ${tokenAddress} from ${startDate} to ${endDate}`);
        return await fetchHistoricalPricesByAddress(tokenAddress, startDate, endDate);
    } catch (error) {
        console.error('Error fetching historical prices:', error);
        throw error;
    }
}

/**
 * Estimate gas costs for a series of trades
 */
export async function estimateGasCosts(
    tokenAddress: string,
    operations: Array<{ type: 'buy' | 'sell', amount: number }>
): Promise<number> {
    try {
        // For production, we would use ethers.js or web3.js to estimate gas
        // Here's a simplified example that returns an estimate:

        // Base gas costs (approximate)
        const gasPerSwap = 150000; // Average gas for a swap on Uniswap

        let totalGas = 0;

        // Calculate gas estimate for each operation
        operations.forEach(op => {
            if (op.type === 'buy' || op.type === 'sell') {
                // In a real implementation, we might adjust based on amount or other factors
                totalGas += gasPerSwap;
            }
        });

        return totalGas;
    } catch (error) {
        console.error('Error estimating gas costs:', error);
        throw error;
    }
}

/**
 * Get current gas prices from Etherscan
 */
export async function getGasPrices(): Promise<{
    slow: number;
    standard: number;
    fast: number;
    rapid: number;
}> {
    try {
        const response = await axios.get('https://api.etherscan.io/api', {
            params: {
                module: 'gastracker',
                action: 'gasoracle',
                apikey: ETHERSCAN_API_KEY
            }
        });

        if (response.data.status === '1') {
            const result = response.data.result;
            return {
                slow: parseInt(result.SafeGasPrice),
                standard: parseInt(result.ProposeGasPrice),
                fast: parseInt(result.FastGasPrice),
                rapid: parseInt(result.FastGasPrice) + 5 // Approximation for rapid
            };
        } else {
            throw new Error(`Etherscan API error: ${response.data.message}`);
        }
    } catch (error) {
        console.error('Error getting gas prices:', error);
        throw error;
    }
}

/**
 * Get top tokens by market cap and volume
 * Using CryptoCompare instead of CoinGecko
 */
export async function getTopTokens(limit = 50): Promise<any[]> {
    try {
        // Fetch from CryptoCompare API
        const response = await axios.get('https://min-api.cryptocompare.com/data/top/mktcapfull', {
            params: {
                limit,
                tsym: 'USD'
            }
        });

        // Map to a consistent format
        const topTokens = response.data.Data.map((item: any) => {
            const coinInfo = item.CoinInfo;
            const rawData = item.RAW?.USD || {};

            return {
                id: coinInfo.Name,
                symbol: coinInfo.Name,
                name: coinInfo.FullName,
                image: `https://www.cryptocompare.com${coinInfo.ImageUrl}`,
                current_price: rawData.PRICE || 0,
                market_cap: rawData.MKTCAP || 0,
                price_change_24h: rawData.CHANGE24HOUR || 0,
                price_change_percentage_24h: rawData.CHANGEPCT24HOUR || 0,
                contract_address: null // CryptoCompare doesn't provide this directly
            };
        });

        // Add hardcoded addresses for common tokens since CryptoCompare API doesn't reliably
        // provide contract addresses
        const addressMapping: { [symbol: string]: string } = {
            'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
            'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f',
            'WBTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            'MATIC': '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
            'UNI': '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            'LINK': '0x514910771af9ca656af840dff83e8264ecf986ca'
        };

        // Add addresses where available
        for (let token of topTokens) {
            if (addressMapping[token.symbol]) {
                token.contract_address = addressMapping[token.symbol];
            }
            // For ETH, use special address
            if (token.symbol === 'ETH') {
                token.contract_address = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
            }
        }

        return topTokens;
    } catch (error) {
        console.error('Error getting top tokens:', error);
        return [];
    }
} 