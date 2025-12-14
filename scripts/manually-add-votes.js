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
  contestantEmail: String,
  numberOfVotes: Number,
  amountPaid: Number,
  currency: String,
  voterInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String
  },
  paymentReference: String,
  paymentStatus: String,
  paymentMethod: String,
  notes: String
}, {
  timestamps: true
});

// PaymentTransaction schema
const PaymentTransactionSchema = new mongoose.Schema({
  reference: String,
  amount: Number,
  currency: String,
  status: String,
  paymentMethod: String
}, {
  timestamps: true
});

const Contestant = mongoose.model('Contestant', ContestantSchema);
const Vote = mongoose.model('Vote', VoteSchema);
const PaymentTransaction = mongoose.model('PaymentTransaction', PaymentTransactionSchema);

async function manuallyAddVotes() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
      console.log('Usage: node manually-add-votes.js <contestantId|contestantNumber> <numberOfVotes> <amountPaid> [paymentReference] [voterEmail]');
      console.log('\nExample:');
      console.log('  node manually-add-votes.js CNT-030 10 1000 MANUAL_REF_001 voter@example.com');
      console.log('  node manually-add-votes.js 693c0fd83ae2011d37db8fb4 5 500 MANUAL_REF_002');
      await mongoose.connection.close();
      process.exit(1);
    }

    const contestantIdentifier = args[0];
    const numberOfVotes = parseInt(args[1]);
    const amountPaid = parseFloat(args[2]);
    const paymentReference = args[3] || `MANUAL_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const voterEmail = args[4] || 'manual@edotalenthunt.com';

    console.log('📋 Input Parameters:');
    console.log(`   Contestant: ${contestantIdentifier}`);
    console.log(`   Number of Votes: ${numberOfVotes}`);
    console.log(`   Amount Paid: ₦${amountPaid}`);
    console.log(`   Payment Reference: ${paymentReference}`);
    console.log(`   Voter Email: ${voterEmail}\n`);

    // Find contestant by ID or contestant number
    let contestant;
    if (contestantIdentifier.startsWith('CNT-')) {
      contestant = await Contestant.findOne({ contestantNumber: contestantIdentifier });
    } else {
      contestant = await Contestant.findById(contestantIdentifier);
    }

    if (!contestant) {
      console.error(`❌ Contestant not found: ${contestantIdentifier}`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Found contestant: ${contestant.contestantNumber} - ${contestant.firstName} ${contestant.lastName}`);
    console.log(`   Current Votes: ${contestant.totalVotes || 0}`);
    console.log(`   Current Amount: ₦${contestant.totalVoteAmount || 0}\n`);

    // Check if payment reference already exists
    const existingVote = await Vote.findOne({ paymentReference });
    const existingTransaction = await PaymentTransaction.findOne({ reference: paymentReference });

    if (existingVote || existingTransaction) {
      console.error(`❌ Payment reference ${paymentReference} already exists!`);
      console.error('   Please use a different payment reference.');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Create payment transaction
    console.log('📝 Creating payment transaction...');
    const paymentTransaction = new PaymentTransaction({
      registrationId: null,
      userId: null,
      reference: paymentReference,
      amount: amountPaid,
      currency: 'NGN',
      status: 'successful',
      paymentMethod: 'manual',
      gatewayResponse: { source: 'manual_entry' },
      processedAt: new Date()
    });
    await paymentTransaction.save();
    console.log('✅ Payment transaction created\n');

    // Create vote
    console.log('📝 Creating vote record...');
    const vote = new Vote({
      contestantId: contestant._id,
      contestantEmail: contestant.email,
      numberOfVotes: numberOfVotes,
      amountPaid: amountPaid,
      currency: 'NGN',
      voterInfo: {
        email: voterEmail
      },
      paymentReference: paymentReference,
      paymentTransactionId: paymentTransaction._id,
      paymentStatus: 'completed',
      paymentMethod: 'manual',
      notes: 'Manually added vote'
    });
    await vote.save();
    console.log('✅ Vote record created\n');

    // Update contestant stats
    console.log('📝 Updating contestant stats...');
    await Contestant.updateOne(
      { _id: contestant._id },
      { 
        $inc: { 
          totalVotes: numberOfVotes,
          totalVoteAmount: amountPaid
        }
      }
    );

    // Get updated contestant
    const updatedContestant = await Contestant.findById(contestant._id);
    
    console.log('✅ Contestant stats updated:');
    console.log(`   Previous Votes: ${contestant.totalVotes || 0} → New Votes: ${updatedContestant.totalVotes}`);
    console.log(`   Previous Amount: ₦${contestant.totalVoteAmount || 0} → New Amount: ₦${updatedContestant.totalVoteAmount}\n`);

    console.log('📊 Summary:');
    console.log(`   ✅ Vote ID: ${vote._id}`);
    console.log(`   ✅ Payment Reference: ${paymentReference}`);
    console.log(`   ✅ Contestant: ${contestant.contestantNumber} - ${contestant.firstName} ${contestant.lastName}`);
    console.log(`   ✅ Votes Added: ${numberOfVotes}`);
    console.log(`   ✅ Amount Added: ₦${amountPaid}\n`);

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
manuallyAddVotes();

