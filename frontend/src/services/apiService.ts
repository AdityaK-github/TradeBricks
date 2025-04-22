import axios from 'axios';

const API_BASE_URL = 'https://tradebricks.onrender.com/api'; // Deployed backend API URL

// Create axios instance with interceptors
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
    response => response,
    error => {
        // Handle network errors
        if (!error.response) {
            console.error('Network error:', error.message);
            return Promise.reject({
                message: 'Cannot connect to the server. Wait for the server to start (about 1 min), then retry',
                originalError: error
            });
        }

        // Handle API errors with status codes
        const { status, data } = error.response;
        let errorMessage = 'An unexpected error occurred';

        switch (status) {
            case 400:
                errorMessage = data.message || 'Invalid request';
                break;
            case 401:
                errorMessage = 'Authentication required';
                break;
            case 403:
                errorMessage = 'You do not have permission to perform this action';
                break;
            case 404:
                errorMessage = 'The requested resource was not found';
                break;
            case 500:
                errorMessage = 'Server error. Please try again later';
                break;
            default:
                errorMessage = data.message || `Error: ${status}`;
        }

        return Promise.reject({
            message: errorMessage,
            status,
            data,
            originalError: error
        });
    }
);

// --- Strategy Endpoints ---

// Fetch all strategies for a user
export const getStrategiesByUser = async (userId: string) => {
    try {
        const response = await apiClient.get(`/strategies/user/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching strategies:', error);
        throw error;
    }
};

// Fetch a single strategy by ID
export const getStrategyById = async (strategyId: string) => {
    try {
        const response = await apiClient.get(`/strategies/${strategyId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching strategy ${strategyId}:`, error);
        throw error;
    }
};

// Create a new strategy
export const createStrategy = async (strategyData: any) => {
    try {
        const response = await apiClient.post('/strategies', strategyData);
        return response.data;
    } catch (error) {
        console.error('Error creating strategy:', error);
        throw error;
    }
};

// Update a strategy
export const updateStrategy = async (strategyId: string, strategyData: any) => {
    try {
        const response = await apiClient.put(`/strategies/${strategyId}`, strategyData);
        return response.data;
    } catch (error) {
        console.error(`Error updating strategy ${strategyId}:`, error);
        throw error;
    }
};

// Delete a strategy
export const deleteStrategy = async (strategyId: string) => {
    try {
        const response = await apiClient.delete(`/strategies/${strategyId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting strategy ${strategyId}:`, error);
        throw error;
    }
};

// --- Backtest Endpoint ---

// Run a backtest for a strategy
export const runBacktest = async (strategyId: string, backtestParams: any) => {
    try {
        // Add usePriceType parameter to explicitly use closing prices
        const paramsWithClosingPrices = {
            ...backtestParams,
            usePriceType: 'close' // Explicitly use closing prices
        };

        const response = await apiClient.post(`/backtest/${strategyId}`, paramsWithClosingPrices);
        return response.data;
    } catch (error) {
        console.error(`Error running backtest for strategy ${strategyId}:`, error);
        throw error;
    }
}; 