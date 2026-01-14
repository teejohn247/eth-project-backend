require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbwtjruq8',
  api_key: process.env.CLOUDINARY_API_KEY || '847587541363699',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Njzv0olQin9e3kZUJStYv8n5OCk'
});

// Contestant schema
const ContestantSchema = new mongoose.Schema({
  contestantNumber: String,
  firstName: String,
  lastName: String,
  email: String,
  profilePhoto: {
    url: String,
    publicId: String
  },
  totalVotes: Number,
  totalVoteAmount: Number
}, {
  timestamps: true
});

const Contestant = mongoose.model('Contestant', ContestantSchema);

// Generate email from firstName and lastName
function generateEmail(firstName, lastName) {
  const first = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const last = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (!last || last.length === 0) {
    return `${first}@edotalenthunt.com`;
  }
  
  return `${first}.${last}@edotalenthunt.com`;
}

// Upload image to Cloudinary
async function uploadImageToCloudinary(filePath, publicId) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: `edo-talent-hunt/contestants/${publicId}`,
      resource_type: 'image',
      overwrite: true,
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        { width: 800, height: 800, crop: 'limit' }
      ]
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

async function uploadContestantPhoto() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Get command line arguments or use defaults
    const args = process.argv.slice(2);
    const imagePath = args[0] || 'public/latest/46.jpg';
    const contestantNumber = args[1] || '046';
    const firstName = args[2] || 'Sonic';
    const lastName = args[3] || 'DaStepper';

    const formattedContestantNumber = contestantNumber.startsWith('CNT-') 
      ? contestantNumber 
      : `CNT-${contestantNumber.padStart(3, '0')}`;

    console.log('📋 Input Parameters:');
    console.log(`   Image Path: ${imagePath}`);
    console.log(`   Contestant Number: ${formattedContestantNumber}`);
    console.log(`   First Name: ${firstName}`);
    console.log(`   Last Name: ${lastName}\n`);

    // Check if image file exists
    const fullImagePath = path.resolve(imagePath);
    if (!fs.existsSync(fullImagePath)) {
      console.error(`❌ Image file not found: ${fullImagePath}`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Image file found: ${fullImagePath}\n`);

    // Generate email
    const email = generateEmail(firstName, lastName);
    console.log(`📧 Generated Email: ${email}\n`);

    // Upload image to Cloudinary
    console.log('☁️  Uploading image to Cloudinary...');
    const publicId = `${contestantNumber.padStart(3, '0')}_${firstName.toUpperCase()}_${lastName.toUpperCase().replace(/\s+/g, '_')}`;
    const uploadResult = await uploadImageToCloudinary(fullImagePath, publicId);
    console.log('✅ Image uploaded successfully');
    console.log(`   URL: ${uploadResult.url}`);
    console.log(`   Public ID: ${uploadResult.publicId}`);
    console.log(`   Format: ${uploadResult.format}`);
    console.log(`   Dimensions: ${uploadResult.width}x${uploadResult.height}`);
    console.log(`   Size: ${(uploadResult.bytes / 1024).toFixed(2)} KB\n`);

    // Find or create contestant
    let contestant = await Contestant.findOne({ contestantNumber: formattedContestantNumber });

    if (contestant) {
      console.log(`✅ Found existing contestant: ${formattedContestantNumber}`);
      console.log(`   Current Name: ${contestant.firstName} ${contestant.lastName}`);
      console.log(`   Current Email: ${contestant.email || 'N/A'}\n`);

      // Update contestant
      contestant.firstName = firstName;
      contestant.lastName = lastName;
      contestant.email = email;
      contestant.profilePhoto = {
        url: uploadResult.url,
        publicId: uploadResult.publicId
      };
      await contestant.save();
      console.log('✅ Contestant updated successfully\n');
    } else {
      console.log(`📝 Creating new contestant: ${formattedContestantNumber}\n`);

      // Create new contestant
      contestant = new Contestant({
        contestantNumber: formattedContestantNumber,
        firstName: firstName,
        lastName: lastName,
        email: email,
        profilePhoto: {
          url: uploadResult.url,
          publicId: uploadResult.publicId
        },
        status: 'active',
        totalVotes: 0,
        totalVoteAmount: 0
      });
      await contestant.save();
      console.log('✅ Contestant created successfully\n');
    }

    // Display final result
    console.log('📊 Final Contestant Details:');
    console.log(`   Contestant Number: ${contestant.contestantNumber}`);
    console.log(`   Name: ${contestant.firstName} ${contestant.lastName}`);
    console.log(`   Email: ${contestant.email}`);
    console.log(`   Profile Photo URL: ${contestant.profilePhoto.url}`);
    console.log(`   Total Votes: ${contestant.totalVotes || 0}`);
    console.log(`   Total Vote Amount: ₦${contestant.totalVoteAmount || 0}\n`);

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
uploadContestantPhoto();


