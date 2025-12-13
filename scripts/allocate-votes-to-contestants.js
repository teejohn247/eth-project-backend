require('dotenv').config();
const mongoose = require('mongoose');

// Vote schema
const VoteSchema = new mongoose.Schema({
  contestantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contestant',
    required: true,
    index: true
  },
  contestantEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  numberOfVotes: {
    type: Number,
    required: true,
    min: 1
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN',
    required: true
  },
  voterInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String
  },
  paymentReference: {
    type: String,
    index: true
  },
  paymentTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentTransaction'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: String,
  notes: String
}, {
  timestamps: true
});

// Contestant schema
const ContestantSchema = new mongoose.Schema({
  contestantNumber: String,
  firstName: String,
  lastName: String,
  email: String,
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
  status: String
}, {
  timestamps: true
});

const Vote = mongoose.model('Vote', VoteSchema);
const Contestant = mongoose.model('Contestant', ContestantSchema);

async function allocateVotesToContestants() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Option 1: Recalculate totals from all completed votes
    console.log('📊 Recalculating contestant totals from completed votes...\n');
    
    // Get all completed votes grouped by contestant
    const completedVotes = await Vote.aggregate([
      {
        $match: {
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: '$contestantId',
          totalVotes: { $sum: '$numberOfVotes' },
          totalVoteAmount: { $sum: '$amountPaid' },
          voteCount: { $sum: 1 }
        }
      }
    ]);

    console.log(`📋 Found ${completedVotes.length} contestants with completed votes\n`);

    let updated = 0;
    let errors = 0;

    // Update each contestant's totals
    for (const voteSummary of completedVotes) {
      try {
        const contestant = await Contestant.findById(voteSummary._id);
        
        if (!contestant) {
          console.log(`⚠️  Contestant not found: ${voteSummary._id}`);
          errors++;
          continue;
        }

        const oldVotes = contestant.totalVotes || 0;
        const oldAmount = contestant.totalVoteAmount || 0;

        contestant.totalVotes = voteSummary.totalVotes;
        contestant.totalVoteAmount = voteSummary.totalVoteAmount;
        await contestant.save();

        const displayName = contestant.lastName 
          ? `${contestant.firstName} ${contestant.lastName}` 
          : contestant.firstName;

        console.log(`✅ Updated ${contestant.contestantNumber || 'No number'}: ${displayName}`);
        console.log(`   Votes: ${oldVotes} → ${voteSummary.totalVotes} (+${voteSummary.totalVotes - oldVotes})`);
        console.log(`   Amount: ${oldAmount} → ${voteSummary.totalVoteAmount} (+${voteSummary.totalVoteAmount - oldAmount})`);
        console.log(`   Completed vote records: ${voteSummary.voteCount}\n`);
        
        updated++;
      } catch (error) {
        console.error(`❌ Error updating contestant ${voteSummary._id}:`, error.message);
        errors++;
      }
    }

    // Option 2: Check for pending votes that should be completed
    console.log('\n🔍 Checking for pending votes that might need processing...\n');
    
    const pendingVotes = await Vote.find({ paymentStatus: { $in: ['pending', 'processing'] } });
    console.log(`📋 Found ${pendingVotes.length} votes with pending/processing status\n`);

    if (pendingVotes.length > 0) {
      console.log('⚠️  Note: These votes are not included in totals because paymentStatus is not "completed"');
      console.log('   If these payments were successful, you may need to call verifyVotePayment endpoint\n');
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   ✅ Contestants updated: ${updated}`);
    console.log(`   ⚠️  Pending votes: ${pendingVotes.length}`);
    console.log(`   ❌ Errors: ${errors}\n`);

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
allocateVotesToContestants();

