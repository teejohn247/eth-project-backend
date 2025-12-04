import dotenv from 'dotenv';
dotenv.config();
import { connectDatabase, disconnectDatabase } from '../src/utils/database';
import Contestant from '../src/models/Contestant';

async function updateContestantNumbers() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    console.log('✅ Connected to MongoDB');

    // Get all contestants sorted by creation date
    const contestants = await Contestant.find({})
      .sort({ createdAt: 1 })
      .lean();

    if (contestants.length === 0) {
      console.log('ℹ️  No contestants found in the database');
      await disconnectDatabase();
      process.exit(0);
    }

    console.log(`\n📊 Found ${contestants.length} contestants to update\n`);

    // Update each contestant with sequential number
    let updateCount = 0;
    for (let i = 0; i < contestants.length; i++) {
      const contestant = contestants[i];
      const newNumber = `CNT-${(i + 1).toString().padStart(3, '0')}`;
      
      await Contestant.findByIdAndUpdate(
        contestant._id,
        { contestantNumber: newNumber },
        { new: true }
      );

      console.log(`✅ Updated ${contestant.firstName} ${contestant.lastName}: ${contestant.contestantNumber} → ${newNumber}`);
      updateCount++;
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Total contestants: ${contestants.length}`);
    console.log(`   Updated: ${updateCount}`);
    console.log(`   New format: CNT-001, CNT-002, CNT-003, ...`);

    // Verify the updates
    const verifyContestants = await Contestant.find({})
      .sort({ contestantNumber: 1 })
      .select('contestantNumber firstName lastName')
      .lean();

    console.log(`\n✅ Verification - Contestant Numbers:`);
    verifyContestants.forEach((c: any) => {
      console.log(`   ${c.contestantNumber} - ${c.firstName} ${c.lastName}`);
    });

    await disconnectDatabase();
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}

updateContestantNumbers();

