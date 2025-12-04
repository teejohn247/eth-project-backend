import dotenv from 'dotenv';
dotenv.config();
import { connectDatabase, disconnectDatabase } from '../src/utils/database';
import Registration from '../src/models/Registration';

async function updateRegistrationsToSubmitted() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    console.log('✅ Connected to MongoDB');

    // Update all registrations to "submitted" status
    const result = await Registration.updateMany(
      {}, // Match all registrations
      { 
        $set: { status: 'submitted' }
      }
    );

    console.log('\n📊 Update Results:');
    console.log(`✅ Matched: ${result.matchedCount} registrations`);
    console.log(`✅ Modified: ${result.modifiedCount} registrations`);

    // Get count of registrations by status
    const statusCounts = await Registration.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\n📈 Current Registration Status Distribution:');
    statusCounts.forEach((item) => {
      console.log(`   ${item._id}: ${item.count}`);
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

updateRegistrationsToSubmitted();

