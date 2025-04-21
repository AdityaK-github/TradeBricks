import express from 'express';
import { backtest } from '../controllers/backtestController.js';

const router = express.Router();

// Backtest routes
router.post('/:strategyId', backtest);

export default router; 