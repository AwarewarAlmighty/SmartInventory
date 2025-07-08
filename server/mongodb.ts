import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://zephylariuszl:3IonsEo2oqW6Rq8h@clusterelice.eerivjm.mongodb.net/';

export const connectMongoDB = async () => {
  try {
    // Set a timeout for the connection
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.warn('Falling back to in-memory storage');
    // Don't exit the process, let the app continue with fallback
  }
};

export { mongoose };