const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Simple User schema for this script
const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['contestant', 'admin', 'judge'], default: 'contestant' },
  isEmailVerified: { type: Boolean, default: false },
  isPasswordSet: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

const User = mongoose.model('User', UserSchema);

async function createAdminUser() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';
    
    // Connect with shorter timeout
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'talent@edotalenthunt.com';
    const adminPassword = '5e4d15o20t1a!3nt';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists, updating...');
      
      // Update the existing user to admin role and set password
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      existingAdmin.role = 'admin';
      existingAdmin.password = hashedPassword;
      existingAdmin.isEmailVerified = true;
      existingAdmin.isPasswordSet = true;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      
      console.log('✅ Updated existing user to admin with new credentials');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      const adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        isPasswordSet: true,
        isActive: true
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
    }

    console.log('📧 Admin Email:', adminEmail);
    console.log('🔑 Admin Password:', adminPassword);
    console.log('👤 Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Load environment variables
require('dotenv').config();
createAdminUser();
