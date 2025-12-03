import dotenv from 'dotenv';
dotenv.config();
import { connectDatabase, disconnectDatabase } from '../src/utils/database';
import Registration from '../src/models/Registration';

async function getRegistrationId() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    console.log('✅ Connected to MongoDB');

    // Find a registration that is qualified, approved, or submitted
    const registration = await Registration.findOne({
      status: { $in: ['qualified', 'approved', 'submitted'] }
    })
    .select('_id registrationNumber status personalInfo.firstName personalInfo.lastName personalInfo.email')
    .lean();

    if (!registration) {
      // If no qualified/approved/submitted, get any registration
      const anyRegistration = await Registration.findOne()
        .select('_id registrationNumber status personalInfo.firstName personalInfo.lastName personalInfo.email')
        .lean();
      
      if (!anyRegistration) {
        console.log('❌ No registrations found in the database');
        await disconnectDatabase();
        process.exit(1);
      }

      console.log('\n📋 Registration found:');
      console.log('ID:', anyRegistration._id);
      console.log('Registration Number:', anyRegistration.registrationNumber);
      console.log('Status:', anyRegistration.status);
      console.log('Name:', `${anyRegistration.personalInfo.firstName} ${anyRegistration.personalInfo.lastName}`);
      console.log('Email:', anyRegistration.personalInfo.email);
      console.log('\n⚠️  Note: This registration status is:', anyRegistration.status);
      console.log('   It needs to be "qualified", "approved", or "submitted" to be promoted to contestant.');
      
      await disconnectDatabase();
      process.exit(0);
    }

    console.log('\n📋 Registration found:');
    console.log('ID:', registration._id);
    console.log('Registration Number:', registration.registrationNumber);
    console.log('Status:', registration.status);
    console.log('Name:', `${registration.personalInfo.firstName} ${registration.personalInfo.lastName}`);
    console.log('Email:', registration.personalInfo.email);
    console.log('\n✅ This registration can be promoted to contestant!');
    console.log('\n📝 Use this ID to promote:', registration._id);

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}

getRegistrationId();

