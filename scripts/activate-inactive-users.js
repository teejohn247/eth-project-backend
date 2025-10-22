const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// List of emails to activate
const emailsToActivate = [
  'evanchenthesurgeon@gmail.com',
  'classicosonic7@gmail.com',
  'benardgregory935@gmail.com',
  'lovethowenaze85@gmail.com',
  'omofowaaroma@gmail.com',
  'ehizpraize58@gmail.com',
  'osasokunrobo1@gmail.com'
];

// Default password for all accounts
const DEFAULT_PASSWORD = 'EdoTH@2025#Str0ng!';

async function activateUsers() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    console.log('Connection string:', process.env.MONGODB_URI ? 'Found' : 'Not found');
    
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB\n');

    const results = [];

    // Hash the password manually
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    console.log('Default password hashed\n');

    // Get direct access to the MongoDB collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Process each email
    for (const email of emailsToActivate) {
      console.log(`Processing: ${email}`);
      
      // Check if user exists first
      const user = await usersCollection.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        console.log(`❌ User not found: ${email}\n`);
        results.push({ email, status: 'not_found' });
        continue;
      }

      // Use direct MongoDB update
      await usersCollection.updateOne(
        { email: email.toLowerCase() },
        { 
          $set: {
            isActive: true,
            isEmailVerified: true,
            isPasswordSet: true,
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Activated: ${email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Email verified: true`);
      console.log(`   Password set: true`);
      console.log(`   Password reset to default\n`);
      
      results.push({ 
        email, 
        status: 'activated',
        name: `${user.firstName} ${user.lastName}`
      });
    }

    // Print summary
    console.log('\n═══════════════════════════════════════');
    console.log('ACTIVATION SUMMARY');
    console.log('═══════════════════════════════════════');
    
    const activated = results.filter(r => r.status === 'activated');
    const notFound = results.filter(r => r.status === 'not_found');
    
    console.log(`Total processed: ${results.length}`);
    console.log(`Successfully activated: ${activated.length}`);
    console.log(`Not found: ${notFound.length}`);
    
    if (activated.length > 0) {
      console.log('\n✅ Activated accounts:');
      activated.forEach(r => console.log(`   - ${r.email} (${r.name})`));
    }
    
    if (notFound.length > 0) {
      console.log('\n❌ Not found:');
      notFound.forEach(r => console.log(`   - ${r.email}`));
    }
    
    console.log('\n═══════════════════════════════════════\n');
    console.log(`Default Password: ${DEFAULT_PASSWORD}`);
    console.log('Please share this password securely with the users.\n');

  } catch (error) {
    console.error('Error activating users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the script
activateUsers();

