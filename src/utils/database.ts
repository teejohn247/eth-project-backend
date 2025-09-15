import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';

export const connectDatabase = async (): Promise<void> => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // Extended to 30 seconds for Cloud Run
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      bufferCommands: false,
      retryWrites: true,
      retryReads: true
    };

    await mongoose.connect(MONGODB_URI, options);
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};
