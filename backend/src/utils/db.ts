import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Declare global type for our in-memory database
declare global {
    var inMemoryDB: {
        strategies: any[];
        users: any[];
    } | undefined;
}

// Initialize the global variable if it doesn't exist
if (!global.inMemoryDB) {
    global.inMemoryDB = {
        strategies: [],
        users: []
    };
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/TradeBricks';

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // 5 seconds timeout for server selection
        });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        console.log('Using in-memory data store as fallback.');

        // Make sure the in-memory DB is initialized
        if (!global.inMemoryDB) {
            global.inMemoryDB = {
                strategies: [],
                users: []
            };
        }
    }
};

export default connectDB; 