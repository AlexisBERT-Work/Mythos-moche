import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL || '');
        console.log('Connected to MongoDB database');
    } catch (error) {
        console.error('Error connecting to MongoDB database:', error);
        process.exit(1);
    }
};

export default connectDatabase;