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

async function addVoteSimple() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
      console.log('Usage: node add-vote-simple.js <paymentReference> <amount> <contestantNumber>');
      console.log('\nExample:');
      console.log('  node add-vote-simple.js ETH20250000320hvc20 5000 19');
      await mongoose.connection.close();
      process.exit(1);
    }

    const paymentReference = args[0];
    const amount = parseFloat(args[1]);
    const contestantNumber = args[2].startsWith('CNT-') ? args[2] : `CNT-${args[2].padStart(3, '0')}`;

    console.log('📋 Input Parameters:');
    console.log(`   Payment Reference: ${paymentReference}`);
    console.log(`   Amount: ₦${amount}`);
    console.log(`   Contestant Number: ${contestantNumber}\n`);

    // Find contestant by contestant number
    const contestant = await Contestant.findOne({ contestantNumber });

    if (!contestant) {
      console.error(`❌ Contestant not found: ${contestantNumber}`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Found contestant: ${contestant.contestantNumber} - ${contestant.firstName} ${contestant.lastName}`);
    console.log(`   Email: ${contestant.email}`);
    console.log(`   Current Votes: ${contestant.totalVotes || 0}`);
    console.log(`   Current Amount: ₦${contestant.totalVoteAmount || 0}\n`);

    // Check if payment reference already exists
    const existingVote = await Vote.findOne({ paymentReference });
    const existingTransaction = await PaymentTransaction.findOne({ reference: paymentReference });

    if (existingVote || existingTransaction) {
      console.error(`❌ Payment reference ${paymentReference} already exists!`);
      if (existingVote) {
        console.error(`   Vote ID: ${existingVote._id}`);
        console.error(`   Contestant: ${existingVote.contestantId}`);
        console.error(`   Votes: ${existingVote.numberOfVotes}, Amount: ₦${existingVote.amountPaid}`);
      }
      await mongoose.connection.close();
      process.exit(1);
    }

    // Calculate number of votes (assuming ₦100 per vote)
    const numberOfVotes = Math.round(amount / 100);
    console.log(`📊 Calculated: ${numberOfVotes} votes from ₦${amount} (₦100 per vote)\n`);

    // Create payment transaction
    console.log('📝 Creating payment transaction...');
    const paymentTransaction = new PaymentTransaction({
      registrationId: null,
      userId: null,
      reference: paymentReference,
      amount: amount,
      currency: 'NGN',
      status: 'successful',
      paymentMethod: 'unknown',
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
      amountPaid: amount,
      currency: 'NGN',
      voterInfo: {
        email: contestant.email
      },
      paymentReference: paymentReference,
      paymentTransactionId: paymentTransaction._id,
      paymentStatus: 'completed',
      paymentMethod: 'unknown',
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
          totalVoteAmount: amount
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
    console.log(`   ✅ Amount Added: ₦${amount}\n`);

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
addVoteSimple();

