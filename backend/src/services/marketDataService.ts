import dotenv from 'dotenv';
import axios from 'axios';
import { fetchHistoricalPricesByAddress } from './cryptoCompareService.js';

dotenv.config();

const API_KEY = process.env.MARKET_DATA_API_KEY;
const ALPHA_VANTAGE_API_URL = 'https://www.alphavantage.co/query';
const YAHOO_FINANCE_API_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const CRYPTOCOMPARE_API_URL = 'https://min-api.cryptocompare.com/data';

export interface MarketData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/**
 * Fetches historical market data for a given symbol and date range
 * Uses real market data from various financial APIs with multiple fallbacks
 */
export const fetchHistoricalData = async (
    symbol: string,
    startDate: string,
    endDate: string,
    tokenAddress?: string
): Promise<MarketData[]> => {
    console.log(`Fetching real market data for symbol: ${symbol} from ${startDate} to ${endDate}`);

    // Try multiple sources in sequence to ensure we get real data

    // 1. Try Ethereum token data first if address is provided
    if (tokenAddress) {
        console.log(`Token address provided: ${tokenAddress} - fetching real Ethereum token data from blockchain APIs`);
        try {
            const tokenData = await fetchHistoricalPricesByAddress(tokenAddress, startDate, endDate);
            if (tokenData.length > 0) {
                console.log(`Successfully fetched ${tokenData.length} REAL data points for Ethereum token`);
                return tokenData;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Error fetching Ethereum token data: ${errorMessage}`);
            // Fall through to try other sources
        }
    }

    // 2. For crypto symbols, try CryptoCompare API
    if (isCryptoSymbol(symbol)) {
        try {
            console.log(`Detected crypto symbol ${symbol}, fetching real data from CryptoCompare API`);
            const data = await fetchCryptoCompareData(symbol, startDate, endDate);
            if (data && data.length > 0) {
                console.log(`Successfully fetched ${data.length} REAL data points from CryptoCompare`);
                return data;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`CryptoCompare API error: ${errorMessage}`);
            // Fall through to other sources
        }
    }

    // 3. For stocks, try Alpha Vantage API if API key is available
    if (API_KEY && !isCryptoSymbol(symbol)) {
        try {
            console.log(`Attempting to fetch real stock data from Alpha Vantage API for ${symbol}`);
            const data = await fetchAlphaVantageData(symbol, startDate, endDate);
            if (data && data.length > 0) {
                console.log(`Successfully fetched ${data.length} REAL data points from Alpha Vantage`);
                return data;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`Alpha Vantage API error: ${errorMessage}`);
            // Fall through to Yahoo Finance
        }
    }

    // 4. Try Yahoo Finance as another fallback (works for both stocks and crypto)
    try {
        console.log(`Attempting to fetch real data from Yahoo Finance API for ${symbol}`);
        const data = await fetchYahooFinanceData(symbol, startDate, endDate);
        if (data && data.length > 0) {
            console.log(`Successfully fetched ${data.length} REAL data points from Yahoo Finance`);
            return data;
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`Yahoo Finance API error: ${errorMessage}`);
        // All real data sources failed
    }

    // If we've reached this point, all real data sources have failed
    throw new Error(`Could not fetch real market data for ${symbol} from any available source. Please try a different symbol or time range.`);
};

/**
 * Helper function to determine if a symbol is likely a cryptocurrency
 */
function isCryptoSymbol(symbol: string): boolean {
    if (!symbol) return false;

    const commonCryptoSymbols = [
        'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL',
        'DOT', 'AVAX', 'MATIC', 'LTC', 'LINK', 'ATOM', 'UNI', 'WBTC', 'DAI'
    ];

    // Check if it's a common crypto symbol
    if (commonCryptoSymbols.includes(symbol.toUpperCase())) {
        return true;
    }

    // Or if it has common crypto suffixes
    if (symbol.toUpperCase().endsWith('USDT') ||
        symbol.toUpperCase().endsWith('USD') ||
        symbol.toUpperCase().endsWith('BTC') ||
        symbol.toUpperCase().endsWith('ETH')) {
        return true;
    }

    return false;
}

/**
 * Fetches crypto data from CryptoCompare API
 */
async function fetchCryptoCompareData(symbol: string, startDate: string, endDate: string): Promise<MarketData[]> {
    try {
        // Convert dates to calculate day difference
        const from = new Date(startDate);
        const to = new Date(endDate);

        // Calculate number of days
        const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

        // Try different API endpoints and parameters if first attempt fails
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            attempts++;
            try {
                console.log(`CryptoCompare attempt ${attempts} for ${symbol}`);

                let endpoint = `${CRYPTOCOMPARE_API_URL}/v2/histoday`;
                let params: any = {
                    fsym: symbol.toUpperCase(),
                    tsym: 'USD',
                    limit: daysDiff,
                    toTs: Math.floor(to.getTime() / 1000)
                };

                // On subsequent attempts, try different parameters
                if (attempts === 2) {
                    // Try with exchange parameter
                    params.e = 'CCCAGG'; // Cryptocurrency Aggregate Index
                } else if (attempts === 3) {
                    // Try with hourly data and aggregate it
                    endpoint = `${CRYPTOCOMPARE_API_URL}/v2/histohour`;
                    params.limit = Math.min(daysDiff * 24, 2000); // API has a limit
                }

                const response = await axios.get(endpoint, { params });

                if (response.data && response.data.Response === 'Success' && response.data.Data.Data.length > 0) {
                    const priceData = response.data.Data.Data;

                    // Format data for return
                    const formattedData = priceData.map((dataPoint: any) => {
                        const date = new Date(dataPoint.time * 1000).toISOString().split('T')[0];
                        return {
                            date,
                            open: dataPoint.open,
                            high: dataPoint.high,
                            low: dataPoint.low,
                            close: dataPoint.close,
                            volume: dataPoint.volumefrom
                        };
                    });

                    // For hourly data, aggregate by day
                    if (attempts === 3) {
                        const dailyData = aggregateHourlyToDaily(formattedData);
                        return dailyData;
                    }

                    // Sort by date
                    formattedData.sort((a: MarketData, b: MarketData) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime());

                    return formattedData;
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.warn(`CryptoCompare attempt ${attempts} failed: ${errorMessage}`);
                // Continue to next attempt
            }
        }

        throw new Error('All CryptoCompare API attempts failed');
    } catch (error) {
        console.error('Error fetching CryptoCompare data:', error);
        throw error;
    }
}

/**
 * Aggregates hourly data to daily data
 */
function aggregateHourlyToDaily(hourlyData: MarketData[]): MarketData[] {
    const dailyMap = new Map<string, {
        open: number,
        high: number,
        low: number,
        close: number,
        volume: number,
        count: number
    }>();

    // Group data by date
    for (const dataPoint of hourlyData) {
        const date = dataPoint.date;

        if (!dailyMap.has(date)) {
            dailyMap.set(date, {
                open: dataPoint.open,
                high: dataPoint.high,
                low: dataPoint.low,
                close: dataPoint.close,
                volume: dataPoint.volume,
                count: 1
            });
        } else {
            const existing = dailyMap.get(date)!;
            existing.high = Math.max(existing.high, dataPoint.high);
            existing.low = Math.min(existing.low, dataPoint.low);
            existing.close = dataPoint.close; // Last close of the day
            existing.volume += dataPoint.volume;
            existing.count++;
        }
    }

    // Convert map back to array
    const result: MarketData[] = [];
    for (const [date, data] of dailyMap.entries()) {
        result.push({
            date,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume
        });
    }

    // Sort by date
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Fetches stock data from Alpha Vantage API
 */
async function fetchAlphaVantageData(symbol: string, startDate: string, endDate: string): Promise<MarketData[]> {
    try {
        // Use the adjusted data function to get split-adjusted prices
        const response = await axios.get(ALPHA_VANTAGE_API_URL, {
            params: {
                function: 'TIME_SERIES_DAILY_ADJUSTED', // Use adjusted data for stocks
                symbol: symbol,
                outputsize: 'full',
                apikey: API_KEY
            },
            timeout: 10000 // 10-second timeout
        });

        // Handle different possible response formats
        const timeSeriesKey = 'Time Series (Daily)';
        if (response.data && response.data[timeSeriesKey]) {
            const timeSeriesData = response.data[timeSeriesKey];
            const startTime = new Date(startDate).getTime();
            const endTime = new Date(endDate).getTime();

            const formattedData: MarketData[] = [];

            for (const date in timeSeriesData) {
                const currentDate = new Date(date);
                const currentTime = currentDate.getTime();

                if (currentTime >= startTime && currentTime <= endTime) {
                    const dataPoint = timeSeriesData[date];

                    // Handle potential different field names in response
                    let closePrice = 0;
                    let openPrice = 0;
                    let highPrice = 0;
                    let lowPrice = 0;
                    let volume = 0;

                    // Try to safely extract values with different possible field names
                    if (dataPoint['5. adjusted close'] !== undefined) {
                        closePrice = parseFloat(dataPoint['5. adjusted close']);
                    } else if (dataPoint['4. close'] !== undefined) {
                        closePrice = parseFloat(dataPoint['4. close']);
                    }

                    if (dataPoint['1. open'] !== undefined) {
                        openPrice = parseFloat(dataPoint['1. open']);
                    }

                    if (dataPoint['2. high'] !== undefined) {
                        highPrice = parseFloat(dataPoint['2. high']);
                    }

                    if (dataPoint['3. low'] !== undefined) {
                        lowPrice = parseFloat(dataPoint['3. low']);
                    }

                    if (dataPoint['6. volume'] !== undefined) {
                        volume = parseFloat(dataPoint['6. volume']);
                    } else if (dataPoint['5. volume'] !== undefined) {
                        volume = parseFloat(dataPoint['5. volume']);
                    }

                    // Skip invalid data points
                    if (closePrice <= 0 || openPrice <= 0) {
                        continue;
                    }

                    formattedData.push({
                        date,
                        open: openPrice,
                        high: highPrice || openPrice,
                        low: lowPrice || openPrice,
                        close: closePrice,
                        volume: volume
                    });
                }
            }

            // Log the price range for verification
            if (formattedData.length > 0) {
                formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const firstPrice = formattedData[0].close;
                const lastPrice = formattedData[formattedData.length - 1].close;
                console.log(`Price range for ${symbol} from Alpha Vantage: $${firstPrice.toFixed(2)} to $${lastPrice.toFixed(2)}`);
                return formattedData;
            } else {
                throw new Error('No data points found in Alpha Vantage response for the specified date range');
            }
        } else {
            // Check for API limit errors
            if (response.data && response.data.Note && response.data.Note.includes('API call frequency')) {
                console.warn('Alpha Vantage API limit reached');
                throw new Error('Alpha Vantage API limit reached. Please try again later.');
            }
            console.error('Invalid Alpha Vantage response format:', response.data);
            throw new Error('Invalid Alpha Vantage response format');
        }
    } catch (error) {
        console.error('Error fetching Alpha Vantage data:', error);
        throw error;
    }
}

/**
 * Fetches market data from Yahoo Finance API
 */
async function fetchYahooFinanceData(symbol: string, startDate: string, endDate: string): Promise<MarketData[]> {
    try {
        // Adjust the symbol format for crypto if needed
        let yahooSymbol = symbol;
        if (isCryptoSymbol(symbol) && !symbol.includes('-')) {
            yahooSymbol = `${symbol.toUpperCase()}-USD`;
        }

        // Convert dates to Unix timestamps (seconds)
        const period1 = Math.floor(new Date(startDate).getTime() / 1000);
        const period2 = Math.floor(new Date(endDate).getTime() / 1000);

        const url = `${YAHOO_FINANCE_API_URL}/${yahooSymbol}`;

        const response = await axios.get(url, {
            params: {
                period1,
                period2,
                interval: '1d',
                events: 'history', // Simplified to avoid potential errors
                includeAdjustedClose: true
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10-second timeout
        });

        if (response.data && response.data.chart && response.data.chart.result && response.data.chart.result.length > 0) {
            const result = response.data.chart.result[0];
            const timestamps = result.timestamp || [];
            const quotes = result.indicators.quote[0] || {};
            // Safely access adjusted close prices, with fallback to regular close
            const adjCloseArray = result.indicators.adjclose?.[0]?.adjclose;

            if (!timestamps.length || !quotes.open) {
                throw new Error('No data points in Yahoo Finance response');
            }

            const formattedData: MarketData[] = [];

            for (let i = 0; i < timestamps.length; i++) {
                // Skip data points with null values
                if (quotes.open[i] === null || quotes.close[i] === null) {
                    continue;
                }

                // Safely handle adjusted close prices
                // If adjusted close is available, use it with appropriate adjustment factor
                const hasAdjClose = adjCloseArray && adjCloseArray[i] !== undefined && adjCloseArray[i] !== null;
                const closePrice = hasAdjClose ? adjCloseArray[i] : quotes.close[i];
                // Only apply adjustment factor if we have adjusted close values
                const adjustmentFactor = hasAdjClose ? (adjCloseArray[i] / quotes.close[i]) : 1;

                const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
                formattedData.push({
                    date,
                    open: quotes.open[i] * adjustmentFactor,
                    high: (quotes.high[i] || quotes.open[i]) * adjustmentFactor,
                    low: (quotes.low[i] || quotes.open[i]) * adjustmentFactor,
                    close: closePrice,
                    volume: quotes.volume[i] || 0
                });
            }

            // Log the price range for verification
            if (formattedData.length > 0) {
                const firstPrice = formattedData[0].close;
                const lastPrice = formattedData[formattedData.length - 1].close;
                console.log(`Price range for ${yahooSymbol}: $${firstPrice.toFixed(2)} to $${lastPrice.toFixed(2)}`);
            }

            // Sort by date
            formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            return formattedData;
        } else {
            console.error('Invalid Yahoo Finance response format');
            throw new Error('Invalid Yahoo Finance response format');
        }
    } catch (error) {
        console.error('Error fetching Yahoo Finance data:', error);
        throw error;
    }
} 