const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Generate random password
function generateRandomPassword(length = 16) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + special;
  
  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// List of users with emails
const users = [
  { email: 'evanchenthesurgeon@gmail.com', firstName: 'Divine', lastName: 'Agbonlahor Osawoname' },
  { email: 'classicosonic7@gmail.com', firstName: 'Divine', lastName: 'Agbonlahor Osawoname' },
  { email: 'benardgregory935@gmail.com', firstName: 'Osayande', lastName: 'Uwa Matthew' },
  { email: 'lovethowenaze85@gmail.com', firstName: 'Minloveth', lastName: 'Owenaze' },
  { email: 'omofowaaroma@gmail.com', firstName: 'Cha', lastName: 'Nath' },
  { email: 'ehizpraize58@gmail.com', firstName: 'OSEMWENGIE', lastName: 'EHIZPRAIZE' },
  { email: 'osasokunrobo1@gmail.com', firstName: 'Osas', lastName: 'Paul' }
];

// Generate unique password for each user
users.forEach(user => {
  user.password = generateRandomPassword();
});

async function activateUsers() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB\n');

    const results = [];

    // Get direct access to the MongoDB collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Process each user
    for (const user of users) {
      console.log(`Processing: ${user.email}`);
      
      // Check if user exists first
      const dbUser = await usersCollection.findOne({ email: user.email.toLowerCase() });
      
      if (!dbUser) {
        console.log(`❌ User not found: ${user.email}\n`);
        results.push({ ...user, status: 'not_found' });
        continue;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, 12);

      // Use direct MongoDB update
      await usersCollection.updateOne(
        { email: user.email.toLowerCase() },
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
      
      console.log(`✅ Activated: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Password: ${user.password}\n`);
      
      results.push({ ...user, status: 'activated' });
    }

    // Print summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('ACTIVATION SUMMARY - UNIQUE PASSWORDS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const activated = results.filter(r => r.status === 'activated');
    const notFound = results.filter(r => r.status === 'not_found');
    
    console.log(`Total processed: ${results.length}`);
    console.log(`Successfully activated: ${activated.length}`);
    console.log(`Not found: ${notFound.length}\n`);
    
    if (activated.length > 0) {
      console.log('✅ ACTIVATED ACCOUNTS WITH PASSWORDS:\n');
      activated.forEach((r, i) => {
        console.log(`${i + 1}. ${r.firstName} ${r.lastName}`);
        console.log(`   Email: ${r.email}`);
        console.log(`   Password: ${r.password}\n`);
      });
    }
    
    if (notFound.length > 0) {
      console.log('❌ Not found:');
      notFound.forEach(r => console.log(`   - ${r.email}`));
    }
    
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('Error activating users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run the script
activateUsers();

