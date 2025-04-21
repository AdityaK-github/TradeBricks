import axios from 'axios';

const CRYPTOCOMPARE_API_URL = 'https://min-api.cryptocompare.com/data';

export interface TokenPriceData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/**
 * Get current token price from CryptoCompare
 */
export async function getCurrentTokenPrice(symbol: string): Promise<number> {
    try {
        const response = await axios.get(`${CRYPTOCOMPARE_API_URL}/price`, {
            params: {
                fsym: symbol,  // From Symbol
                tsyms: 'USD',  // To Symbol(s)
            }
        });

        if (response.data && response.data.USD) {
            return response.data.USD;
        } else {
            console.error('No price data returned from CryptoCompare');
            return 0;
        }
    } catch (error) {
        console.error('Error getting current token price:', error);
        return 0;
    }
}

/**
 * Get token information by contract address
 * Note: CryptoCompare doesn't have a direct contract address lookup,
 * this is a simplified implementation that works for major tokens
 */
export async function getTokenInfoByAddress(tokenAddress: string): Promise<any> {
    // For ETH
    if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        return {
            symbol: 'ETH',
            name: 'Ethereum',
            fullName: 'Ethereum',
            id: 'ETH'
        };
    }

    // Common token mapping (in a real app, this would be more extensive or use a database)
    const tokenMapping: { [address: string]: string } = {
        '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT', // Tether
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC', // USD Coin
        '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',  // Dai
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC', // Wrapped Bitcoin
        '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': 'MATIC', // Polygon
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'UNI',  // Uniswap
        '0x514910771af9ca656af840dff83e8264ecf986ca': 'LINK'  // Chainlink
    };

    try {
        // Try to find the token in our mapping
        const symbol = tokenMapping[tokenAddress.toLowerCase()];

        if (symbol) {
            // Get full token info from CryptoCompare
            const response = await axios.get(`${CRYPTOCOMPARE_API_URL}/v2/all/exchanges`);
            const coins = response.data.Data;

            // Find matching coin
            for (const exchange in coins) {
                for (const pair in coins[exchange].pairs) {
                    if (pair === symbol) {
                        return {
                            symbol,
                            name: symbol,
                            fullName: symbol,
                            id: symbol
                        };
                    }
                }
            }
        }

        throw new Error(`Token with address ${tokenAddress} not found in CryptoCompare mapping`);
    } catch (error) {
        console.error('Error getting token info by address:', error);
        throw error;
    }
}

/**
 * Fetch historical price data from CryptoCompare
 */
export async function fetchHistoricalPrices(
    symbol: string,
    startDate: string,
    endDate: string
): Promise<TokenPriceData[]> {
    try {
        console.log(`Fetching historical prices for ${symbol} from ${startDate} to ${endDate}`);

        // Convert dates to UNIX timestamps (in seconds)
        const from = new Date(startDate);
        const to = new Date(endDate);

        // Calculate number of days
        const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
        const limit = Math.min(daysDiff, 2000); // CryptoCompare has limits

        // Try up to 3 times with different parameters
        let attempt = 1;
        let error: Error | null = null;

        while (attempt <= 3) {
            try {
                console.log(`Attempt ${attempt} to fetch ${symbol} data from CryptoCompare`);

                interface QueryParams {
                    fsym: string;
                    tsym: string;
                    limit: number;
                    toTs: number;
                    e?: string; // Make the 'e' property optional
                }

                let params: QueryParams = {
                    fsym: symbol.toUpperCase(),
                    tsym: 'USD',
                    limit: limit,
                    toTs: Math.floor(to.getTime() / 1000)
                };

                // Different parameter sets for different attempts
                if (attempt === 2) {
                    // Use aggregate across all exchanges
                    params = { ...params, e: 'CCCAGG' };
                } else if (attempt === 3) {
                    // Try with a smaller date range (last month)
                    const oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    params = {
                        ...params,
                        limit: 30,
                        toTs: Math.floor(new Date().getTime() / 1000)
                    };
                }

                const response = await axios.get(`${CRYPTOCOMPARE_API_URL}/v2/histoday`, {
                    params,
                    timeout: 15000 // 15-second timeout
                });

                if (response.data?.Response === 'Success' && response.data.Data?.Data?.length > 0) {
                    const priceData = response.data.Data.Data;
                    console.log(`Successfully fetched ${priceData.length} data points for ${symbol}`);

                    // Format the data
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

                    // Sort by date
                    formattedData.sort((a: any, b: any) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    );

                    return formattedData;
                } else {
                    console.warn(`No data returned from CryptoCompare on attempt ${attempt}`);
                    throw new Error(response.data?.Message || "No data returned");
                }
            } catch (err: any) {
                console.warn(`Attempt ${attempt} failed: ${err.message}`);
                error = err instanceof Error ? err : new Error(String(err));
                attempt++;
            }
        }

        // After all attempts fail
        console.error(`All ${attempt - 1} attempts to fetch ${symbol} data failed`);
        throw error || new Error(`Could not fetch data for ${symbol} after multiple attempts`);
    } catch (error) {
        console.error('Error fetching historical prices:', error);
        throw error;
    }
}

/**
 * Fetch historical price data for a token by contract address
 */
export async function fetchHistoricalPricesByAddress(
    tokenAddress: string,
    startDate: string,
    endDate: string
): Promise<TokenPriceData[]> {
    try {
        // Handle ETH special case
        if (tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            console.log('Processing ETH token request');

            try {
                // First try using the standard method with 'ETH' symbol
                return await fetchHistoricalPrices('ETH', startDate, endDate);
            } catch (primaryErr) {
                const primaryError = primaryErr instanceof Error ? primaryErr : new Error(String(primaryErr));
                console.warn('Primary method failed for ETH, trying alternate approach:', primaryError.message);

                // Try multiple fallbacks for ETH
                const symbols = ['ETH', 'ETHUSDT', 'WETH'];

                for (const altSymbol of symbols) {
                    try {
                        console.log(`Trying alternative symbol: ${altSymbol}`);
                        const data = await fetchHistoricalPrices(altSymbol, startDate, endDate);
                        if (data.length > 0) {
                            console.log(`Successfully fetched ETH data using symbol ${altSymbol}`);
                            return data;
                        }
                    } catch (altErr) {
                        const altError = altErr instanceof Error ? altErr : new Error(String(altErr));
                        console.warn(`Alternative symbol ${altSymbol} failed:`, altError.message);
                    }
                }

                // If all attempts fail, try using an external API as last resort
                console.log("Trying external API for ETH data as last resort");
                try {
                    return await fetchEthPriceFromBackup(startDate, endDate);
                } catch (backupErr) {
                    const backupError = backupErr instanceof Error ? backupErr : new Error(String(backupErr));
                    console.error("Backup API failed:", backupError.message);
                    throw new Error(`Could not retrieve ETH price data from any source: ${primaryError.message}`);
                }
            }
        }

        // For other tokens
        try {
            // Get token info to find the symbol
            console.log(`Looking up symbol for token address: ${tokenAddress}`);
            const tokenInfo = await getTokenInfoByAddress(tokenAddress);
            console.log(`Found symbol ${tokenInfo.symbol} for token address ${tokenAddress}`);
            return await fetchHistoricalPrices(tokenInfo.symbol, startDate, endDate);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error(`Error processing token address ${tokenAddress}:`, error.message);
            throw new Error(`Could not retrieve price data for token address ${tokenAddress}: ${error.message}`);
        }
    } catch (error) {
        console.error('Error in fetchHistoricalPricesByAddress:', error);
        throw error;
    }
}

/**
 * Backup method to fetch ETH prices from another API source
 */
async function fetchEthPriceFromBackup(startDate: string, endDate: string): Promise<TokenPriceData[]> {
    console.log(`Attempting to fetch ETH prices from backup source for ${startDate} to ${endDate}`);

    try {
        // Try Yahoo Finance API as backup (they provide ETH-USD data)
        // This is a simple example - the exact URL and params would need to be adjusted
        const from = Math.floor(new Date(startDate).getTime() / 1000);
        const to = Math.floor(new Date(endDate).getTime() / 1000);

        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/ETH-USD?period1=${from}&period2=${to}&interval=1d`;
        const response = await axios.get(yahooUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });

        if (response.data?.chart?.result?.[0]) {
            const result = response.data.chart.result[0];
            const timestamps = result.timestamp || [];
            const quotes = result.indicators?.quote?.[0] || {};

            console.log(`Retrieved ${timestamps.length} data points from backup source`);

            const formattedData: TokenPriceData[] = [];

            for (let i = 0; i < timestamps.length; i++) {
                if (quotes.open?.[i] !== null && quotes.close?.[i] !== null) {
                    const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
                    formattedData.push({
                        date,
                        open: quotes.open[i],
                        high: quotes.high[i] || quotes.open[i],
                        low: quotes.low[i] || quotes.open[i],
                        close: quotes.close[i],
                        volume: quotes.volume?.[i] || 0
                    });
                }
            }

            return formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }

        throw new Error('Backup source returned invalid data format');
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Error fetching from backup source:', error);
        throw new Error(`Backup source error: ${error.message}`);
    }
}

/**
 * Get top cryptocurrencies
 */
export async function getTopCryptocurrencies(limit = 100): Promise<any[]> {
    try {
        const response = await axios.get(`${CRYPTOCOMPARE_API_URL}/top/mktcapfull`, {
            params: {
                tsym: 'USD',
                limit
            }
        });

        if (response.data && response.data.Data) {
            return response.data.Data.map((item: any) => {
                const coinInfo = item.CoinInfo;
                const rawData = item.RAW?.USD;

                return {
                    id: coinInfo.Name,
                    symbol: coinInfo.Name,
                    name: coinInfo.FullName,
                    image: `https://www.cryptocompare.com${coinInfo.ImageUrl}`,
                    current_price: rawData ? rawData.PRICE : 0,
                    market_cap: rawData ? rawData.MKTCAP : 0,
                    market_cap_rank: coinInfo.SortOrder,
                    price_change_percentage_24h: rawData ? rawData.CHANGEPCT24HOUR : 0,
                    total_volume: rawData ? rawData.TOTALVOLUME24H : 0
                };
            });
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error getting top cryptocurrencies:', error);
        return [];
    }
} 