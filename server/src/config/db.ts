import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/rm-chat-app';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully to:', mongoURI);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
