require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbwtjruq8',
  api_key: process.env.CLOUDINARY_API_KEY || '847587541363699',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Njzv0olQin9e3kZUJStYv8n5OCk'
});

async function uploadLogoToCloudinary() {
  try {
    console.log('🖼️  Uploading logo to Cloudinary...\n');
    
    const logoPath = path.join(process.cwd(), 'public', 'images', 'edo.png');
    
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Logo not found:', logoPath);
      process.exit(1);
    }
    
    console.log('📂 Logo found:', logoPath);
    console.log('📤 Uploading...\n');
    
    const result = await cloudinary.uploader.upload(logoPath, {
      public_id: 'edo-talent-hunt/email/edo-logo',
      resource_type: 'image',
      overwrite: true,
      transformation: [
        { quality: 'auto:best', fetch_format: 'auto' },
        { width: 256, height: 256, crop: 'limit' } // Optimized for email logo size
      ]
    });
    
    console.log('✅ Upload successful!\n');
    console.log('📋 Logo Details:');
    console.log('   URL:', result.secure_url);
    console.log('   Public ID:', result.public_id);
    console.log('   Format:', result.format);
    console.log('   Dimensions:', `${result.width}x${result.height}`);
    console.log('   Size:', `${(result.bytes / 1024).toFixed(2)} KB\n`);
    
    console.log('🔧 Add this to your .env file:');
    console.log(`LOGO_IMAGE_URL=${result.secure_url}\n`);
    
    return result;
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

uploadLogoToCloudinary();

