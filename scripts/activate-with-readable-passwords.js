const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Generate memorable password with words, numbers, and one special character
function generateReadablePassword() {
  const words = [
    'Eagle', 'Hawk', 'Phoenix', 'Tiger', 'Lion', 'Dragon', 'Wolf', 'Bear',
    'Storm', 'Thunder', 'Lightning', 'Ocean', 'Mountain', 'River', 'Forest',
    'Silver', 'Golden', 'Crystal', 'Diamond', 'Royal', 'Noble', 'Swift',
    'Brave', 'Strong', 'Mighty', 'Grand', 'Prime', 'Elite', 'Apex'
  ];
  
  const specials = ['!', '@', '#', '$', '%', '&', '*'];
  
  // Pick two random words
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  
  // Generate 3 random numbers
  const numbers = Math.floor(Math.random() * 900) + 100; // 100-999
  
  // Pick one special character
  const special = specials[Math.floor(Math.random() * specials.length)];
  
  // Combine: Word1Word2###!
  return `${word1}${word2}${numbers}${special}`;
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
  user.password = generateReadablePassword();
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
    console.log('ACTIVATION SUMMARY - READABLE PASSWORDS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const activated = results.filter(r => r.status === 'activated');
    
    if (activated.length > 0) {
      console.log('✅ ACTIVATED ACCOUNTS WITH PASSWORDS:\n');
      activated.forEach((r, i) => {
        console.log(`${i + 1}. ${r.firstName} ${r.lastName}`);
        console.log(`   Email: ${r.email}`);
        console.log(`   Password: ${r.password}\n`);
      });
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

