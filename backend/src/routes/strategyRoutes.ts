import express from 'express';
import {
    getStrategies,
    getStrategy,
    createStrategy,
    updateStrategy,
    deleteStrategy
} from '../controllers/strategyController.js';

const router = express.Router();

// Strategy routes
router.get('/user/:userId', getStrategies);
router.get('/:id', getStrategy);
router.post('/', createStrategy);
router.put('/:id', updateStrategy);
router.delete('/:id', deleteStrategy);

export default router; 