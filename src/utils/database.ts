import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';

export const connectDatabase = async (): Promise<void> => {
  try {
    const options = {
      maxPoolSize: 10,
      minPoolSize: 2, // Maintain minimum connections
      serverSelectionTimeoutMS: 30000, // Extended to 30 seconds for Cloud Run
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      bufferCommands: true, // Enable buffering to queue commands during reconnection
      retryWrites: true,
      retryReads: true,
      maxIdleTimeMS: 300000 // Keep connections alive for 5 minutes
    };

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, options);
    
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Will attempt to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully');
    });

    mongoose.connection.on('connecting', () => {
      console.log('🔄 MongoDB reconnecting...');
    });

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error; // Let the caller handle the error
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
