require('dotenv').config();
const mongoose = require('mongoose');

// Contestant schema
const ContestantSchema = new mongoose.Schema({
  contestantNumber: String,
  firstName: String,
  lastName: String,
  email: String
}, {
  timestamps: true
});

const Contestant = mongoose.model('Contestant', ContestantSchema);

async function fixContestant30Email() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Find contestant 30
    const contestant = await Contestant.findOne({ contestantNumber: 'CNT-030' });
    
    if (!contestant) {
      console.log('⚠️  Contestant CNT-030 not found');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('📋 Current email:', contestant.email);
    
    // Fix the email - remove ".s." completely (not replace with dot)
    let fixedEmail = contestant.email.replace(/\.s\./g, '');
    // Also clean up any double dots that might result
    fixedEmail = fixedEmail.replace(/\.\./g, '.');
    
    if (fixedEmail === contestant.email) {
      console.log('✅ Email is already correct');
    } else {
      contestant.email = fixedEmail;
      await contestant.save();
      console.log('✅ Email updated to:', fixedEmail);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
fixContestant30Email();

