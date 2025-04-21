import { Request, Response } from 'express';
import Strategy, { IStrategy } from '../models/Strategy.js';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Utility function to check if MongoDB is connected
const isMongoConnected = (): boolean => {
    return mongoose.connection.readyState === 1;
};

// Get all strategies for a user
export const getStrategies = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        if (isMongoConnected()) {
            const strategies = await Strategy.find({ userId });
            res.status(200).json(strategies);
        } else {
            // Initialize in-memory database if undefined
            if (!global.inMemoryDB) {
                global.inMemoryDB = {
                    strategies: [],
                    users: []
                };
            }
            const strategies = global.inMemoryDB.strategies.filter(
                (strategy: any) => strategy.userId === userId
            );
            res.status(200).json(strategies);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching strategies', error });
    }
};

// Get a single strategy by ID
export const getStrategy = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (isMongoConnected()) {
            const strategy = await Strategy.findById(id);

            if (!strategy) {
                res.status(404).json({ message: 'Strategy not found' });
                return;
            }

            res.status(200).json(strategy);
        } else {
            // Initialize in-memory database if undefined
            if (!global.inMemoryDB) {
                global.inMemoryDB = {
                    strategies: [],
                    users: []
                };
            }
            const strategy = global.inMemoryDB.strategies.find(
                (strategy: any) => strategy._id === id
            );

            if (!strategy) {
                res.status(404).json({ message: 'Strategy not found' });
                return;
            }

            res.status(200).json(strategy);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching strategy', error });
    }
};

// Create a new strategy
export const createStrategy = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description, userId, blocks, connections } = req.body;

        if (isMongoConnected()) {
            const newStrategy = new Strategy({
                name,
                description,
                userId,
                blocks,
                connections,
            });

            const savedStrategy = await newStrategy.save();
            res.status(201).json(savedStrategy);
        } else {
            // Initialize in-memory database if undefined
            if (!global.inMemoryDB) {
                global.inMemoryDB = {
                    strategies: [],
                    users: []
                };
            }
            const newStrategy = {
                _id: uuidv4(),
                name,
                description,
                userId,
                blocks,
                connections,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            global.inMemoryDB.strategies.push(newStrategy);
            res.status(201).json(newStrategy);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error creating strategy', error });
    }
};

// Update a strategy
export const updateStrategy = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, description, blocks, connections } = req.body;

        if (isMongoConnected()) {
            const updatedStrategy = await Strategy.findByIdAndUpdate(
                id,
                { name, description, blocks, connections },
                { new: true }
            );

            if (!updatedStrategy) {
                res.status(404).json({ message: 'Strategy not found' });
                return;
            }

            res.status(200).json(updatedStrategy);
        } else {
            // Initialize in-memory database if undefined
            if (!global.inMemoryDB) {
                global.inMemoryDB = {
                    strategies: [],
                    users: []
                };
            }
            const strategyIndex = global.inMemoryDB.strategies.findIndex(
                (strategy: any) => strategy._id === id
            );

            if (strategyIndex === -1) {
                res.status(404).json({ message: 'Strategy not found' });
                return;
            }

            const updatedStrategy = {
                ...global.inMemoryDB.strategies[strategyIndex],
                name,
                description,
                blocks,
                connections,
                updatedAt: new Date()
            };

            global.inMemoryDB.strategies[strategyIndex] = updatedStrategy;
            res.status(200).json(updatedStrategy);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating strategy', error });
    }
};

// Delete a strategy
export const deleteStrategy = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (isMongoConnected()) {
            const deletedStrategy = await Strategy.findByIdAndDelete(id);

            if (!deletedStrategy) {
                res.status(404).json({ message: 'Strategy not found' });
                return;
            }

            res.status(200).json({ message: 'Strategy deleted successfully' });
        } else {
            // Initialize in-memory database if undefined
            if (!global.inMemoryDB) {
                global.inMemoryDB = {
                    strategies: [],
                    users: []
                };
            }
            const strategyIndex = global.inMemoryDB.strategies.findIndex(
                (strategy: any) => strategy._id === id
            );

            if (strategyIndex === -1) {
                res.status(404).json({ message: 'Strategy not found' });
                return;
            }

            global.inMemoryDB.strategies.splice(strategyIndex, 1);
            res.status(200).json({ message: 'Strategy deleted successfully' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting strategy', error });
    }
}; 