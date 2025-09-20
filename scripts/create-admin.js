require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model (we'll need to adjust the path)
const User = require('../dist/models/User').default;

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'talent@edotalenthunt.com';
    const adminPassword = '5e4d15o20t1a!3nt';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      
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
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
    }

    console.log('📧 Admin Email:', adminEmail);
    console.log('🔑 Admin Password:', adminPassword);
    console.log('👤 Role: admin');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
