import axios from 'axios';

interface TokenData {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    price: number;
}

interface TokenMarketData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

const API_ENDPOINT = '/api/ethereum';

/**
 * Fetch Ethereum token information by address
 */
export const fetchTokenInfo = async (tokenAddress: string): Promise<TokenData> => {
    try {
        const response = await axios.get(`${API_ENDPOINT}/token/${tokenAddress}`);
        return response.data.result;
    } catch (error) {
        console.error("Error fetching token info:", error);
        throw error;
    }
};

/**
 * Fetch historical price data for an Ethereum token
 */
export const fetchTokenHistoricalData = async (
    tokenAddress: string,
    startDate: string,
    endDate: string
): Promise<TokenMarketData[]> => {
    try {
        const response = await axios.get(`${API_ENDPOINT}/market-data/${tokenAddress}`, {
            params: { startDate, endDate }
        });
        return response.data.result;
    } catch (error) {
        console.error("Error fetching token historical data:", error);
        throw error;
    }
};

/**
 * Simulate gas costs for a series of transactions
 */
export const simulateGasCosts = async (
    tokenAddress: string,
    operations: Array<{ type: 'buy' | 'sell', amount: number }>
): Promise<number> => {
    try {
        const response = await axios.post(`${API_ENDPOINT}/simulate-gas`, {
            tokenAddress,
            operations
        });
        return response.data.result.totalGas;
    } catch (error) {
        console.error("Error simulating gas costs:", error);
        throw error;
    }
};

/**
 * Get current gas prices from the Ethereum network
 */
export const getCurrentGasPrices = async (): Promise<{
    slow: number;
    standard: number;
    fast: number;
    rapid: number;
}> => {
    try {
        const response = await axios.get(`${API_ENDPOINT}/gas-price`);
        return response.data.result;
    } catch (error) {
        console.error("Error fetching gas prices:", error);
        throw error;
    }
};

export default {
    fetchTokenInfo,
    fetchTokenHistoricalData,
    simulateGasCosts,
    getCurrentGasPrices
}; 