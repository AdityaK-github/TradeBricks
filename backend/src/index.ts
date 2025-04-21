import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import connectDB from './utils/db.js';

// Add global error handling
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error);
});

import strategyRoutes from './routes/strategyRoutes.js';
import backtestRoutes from './routes/backtestRoutes.js';
import ethereumRoutes from './routes/ethereumRoutes.js';

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://tradebricks-frontend.onrender.com', 'https://tradebricks-static.onrender.com', 'https://tradebricks-1.onrender.com']
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to TradeBricks API' });
});

app.use('/api/strategies', strategyRoutes);
app.use('/api/backtest', backtestRoutes);
app.use('/api/ethereum', ethereumRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app; 