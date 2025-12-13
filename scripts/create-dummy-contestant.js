require('dotenv').config();
const mongoose = require('mongoose');

// Contestant schema (inline for script)
const ContestantSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false,
    index: true
  },
  registrationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Registration', 
    required: false,
    unique: false,
    sparse: true,
    index: true
  },
  contestantNumber: {
    type: String,
    unique: true,
    required: false,
    sparse: true,
    index: true
  },
  firstName: { type: String, required: false, trim: true },
  lastName: { type: String, required: false, trim: true },
  email: { type: String, required: false, lowercase: true, trim: true, index: true },
  phoneNo: { type: String, required: false, trim: true },
  profilePhoto: {
    url: String,
    publicId: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'eliminated', 'winner'],
    default: 'active'
  },
  totalVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  totalVoteAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  isQualified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Contestant = mongoose.model('Contestant', ContestantSchema);

async function createDummyContestant() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Check if contestant 46 already exists
    const existingContestant = await Contestant.findOne({ contestantNumber: 'CNT-046' });
    
    if (existingContestant) {
      console.log('⚠️  Contestant CNT-046 already exists:');
      console.log(`   Name: ${existingContestant.firstName} ${existingContestant.lastName}`);
      console.log(`   Email: ${existingContestant.email}`);
      console.log(`   Total Votes: ${existingContestant.totalVotes}`);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create dummy contestant
    const dummyContestant = new Contestant({
      contestantNumber: 'CNT-046',
      firstName: 'Dummy',
      lastName: 'Contestant',
      email: 'dummy.contestant@edotalenthunt.com',
      phoneNo: '08000000000',
      status: 'active',
      totalVotes: 0,
      totalVoteAmount: 0,
      isQualified: false
    });

    await dummyContestant.save();

    console.log('✅ Dummy contestant created successfully!\n');
    console.log('📋 Contestant Details:');
    console.log(`   Contestant Number: ${dummyContestant.contestantNumber}`);
    console.log(`   Name: ${dummyContestant.firstName} ${dummyContestant.lastName}`);
    console.log(`   Email: ${dummyContestant.email}`);
    console.log(`   Phone: ${dummyContestant.phoneNo}`);
    console.log(`   Status: ${dummyContestant.status}`);
    console.log(`   Total Votes: ${dummyContestant.totalVotes}`);
    console.log(`   Total Vote Amount: ₦${dummyContestant.totalVoteAmount}`);
    console.log(`   ID: ${dummyContestant._id}\n`);

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
createDummyContestant();

