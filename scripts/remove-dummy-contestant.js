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

// Vote schema
const VoteSchema = new mongoose.Schema({
  contestantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contestant',
    required: true
  },
  paymentReference: String,
  numberOfVotes: Number,
  amountPaid: Number
}, {
  timestamps: true
});

const Contestant = mongoose.model('Contestant', ContestantSchema);
const Vote = mongoose.model('Vote', VoteSchema);

async function removeDummyContestant() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Find the dummy contestant
    const dummyContestant = await Contestant.findOne({ contestantNumber: 'CNT-046' });
    
    if (!dummyContestant) {
      console.log('⚠️  Dummy contestant (CNT-046) not found');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('📋 Found dummy contestant:');
    console.log(`   Contestant Number: ${dummyContestant.contestantNumber}`);
    console.log(`   Name: ${dummyContestant.firstName} ${dummyContestant.lastName}`);
    console.log(`   Email: ${dummyContestant.email}`);
    console.log(`   ID: ${dummyContestant._id}\n`);

    // Find all votes associated with this contestant
    const votes = await Vote.find({ contestantId: dummyContestant._id });
    console.log(`📊 Found ${votes.length} votes associated with this contestant\n`);

    if (votes.length > 0) {
      console.log('🗑️  Deleting votes...');
      for (const vote of votes) {
        console.log(`   Deleting vote: ${vote.paymentReference || vote._id} (${vote.numberOfVotes} votes, ₦${vote.amountPaid})`);
        await Vote.findByIdAndDelete(vote._id);
      }
      console.log(`✅ Deleted ${votes.length} votes\n`);
    }

    // Delete the contestant
    console.log('🗑️  Deleting dummy contestant...');
    await Contestant.findByIdAndDelete(dummyContestant._id);
    console.log('✅ Dummy contestant deleted\n');

    // Summary
    console.log('📊 Summary:');
    console.log(`   ✅ Contestant deleted: CNT-046`);
    console.log(`   ✅ Votes deleted: ${votes.length}\n`);

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
removeDummyContestant();

