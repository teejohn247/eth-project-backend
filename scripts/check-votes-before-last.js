require('dotenv').config();
const mongoose = require('mongoose');

// Contestant schema
const ContestantSchema = new mongoose.Schema({
  contestantNumber: String,
  firstName: String,
  lastName: String,
  email: String,
  totalVotes: Number,
  totalVoteAmount: Number
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
  numberOfVotes: Number,
  amountPaid: Number,
  paymentReference: String,
  paymentTransactionId: mongoose.Schema.Types.ObjectId,
  createdAt: Date
}, {
  timestamps: true
});

const Contestant = mongoose.model('Contestant', ContestantSchema);
const Vote = mongoose.model('Vote', VoteSchema);

async function checkVotesBeforeLast() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    const contestantNumber = 'CNT-019';

    // Find contestant
    const contestant = await Contestant.findOne({ contestantNumber });

    if (!contestant) {
      console.error(`❌ Contestant not found: ${contestantNumber}`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Found contestant: ${contestant.contestantNumber} - ${contestant.firstName} ${contestant.lastName}`);
    console.log(`   Current Total Votes: ${contestant.totalVotes || 0}`);
    console.log(`   Current Total Amount: ₦${contestant.totalVoteAmount || 0}\n`);

    // Use the specific date provided by user
    const cutoffDate = new Date('2026-01-03T08:08:56.067+00:00');
    
    console.log(`📅 Checking votes before: ${cutoffDate.toISOString()}\n`);

    // Get all votes for this contestant
    const allVotes = await Vote.find({ contestantId: contestant._id })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 Total votes in database: ${allVotes.length}\n`);

    if (allVotes.length === 0) {
      console.log('No votes found for this contestant');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Get votes before the cutoff date
    const votesBeforeDate = await Vote.find({
      contestantId: contestant._id,
      createdAt: { $lt: cutoffDate }
    }).sort({ createdAt: -1 }).lean();

    // Get votes after or at the cutoff date
    const votesAfterDate = await Vote.find({
      contestantId: contestant._id,
      createdAt: { $gte: cutoffDate }
    }).sort({ createdAt: -1 }).lean();

    const totalVotesBeforeDate = votesBeforeDate.reduce((sum, vote) => sum + (vote.numberOfVotes || 0), 0);
    const totalAmountBeforeDate = votesBeforeDate.reduce((sum, vote) => sum + (vote.amountPaid || 0), 0);

    const totalVotesAfterDate = votesAfterDate.reduce((sum, vote) => sum + (vote.numberOfVotes || 0), 0);
    const totalAmountAfterDate = votesAfterDate.reduce((sum, vote) => sum + (vote.amountPaid || 0), 0);

    console.log('📊 Summary:');
    console.log(`   Votes before ${cutoffDate.toISOString()}: ${totalVotesBeforeDate} votes`);
    console.log(`   Amount before date: ₦${totalAmountBeforeDate}`);
    console.log(`\n   Votes after/at ${cutoffDate.toISOString()}: ${totalVotesAfterDate} votes`);
    console.log(`   Amount after date: ₦${totalAmountAfterDate}`);
    console.log(`\n   Total (should match current): ${totalVotesBeforeDate + totalVotesAfterDate} votes`);
    console.log(`   Total amount: ₦${totalAmountBeforeDate + totalAmountAfterDate}\n`);

    // Format date for API call
    const dateForQuery = cutoffDate.toISOString();

    console.log('🌐 API Call Information:');
    console.log(`   Endpoint: https://eth-project-backend-1086159474664.europe-west1.run.app/api/v1/contestants`);
    console.log(`   Query: searchQuery=${contestantNumber}`);
    console.log(`   Date filter (before): ${dateForQuery}\n`);

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
checkVotesBeforeLast();

