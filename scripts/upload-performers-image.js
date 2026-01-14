require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary with explicit values from cloudinaryService.ts
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbwtjruq8',
  api_key: process.env.CLOUDINARY_API_KEY || '847587541363699',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Njzv0olQin9e3kZUJStYv8n5OCk'
});

async function uploadPerformersImage() {
  try {
    console.log('🖼️  Uploading performers image to Cloudinary...\n');
    
    const imagePath = path.join(process.cwd(), 'public', 'images', 'image.png');
    
    if (!fs.existsSync(imagePath)) {
      console.error('❌ Image not found:', imagePath);
      process.exit(1);
    }
    
    console.log('📂 Image found:', imagePath);
    console.log('📤 Uploading...\n');
    
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: 'edo-talent-hunt/email/performers-collage',
      resource_type: 'image',
      overwrite: true,
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' },
        { width: 1024, crop: 'limit' }
      ]
    });
    
    console.log('✅ Upload successful!\n');
    console.log('📋 Image Details:');
    console.log('   URL:', result.secure_url);
    console.log('   Public ID:', result.public_id);
    console.log('   Format:', result.format);
    console.log('   Dimensions:', `${result.width}x${result.height}`);
    console.log('   Size:', `${(result.bytes / 1024).toFixed(2)} KB\n`);
    
    console.log('🔧 Add this to your .env file:');
    console.log(`PERFORMERS_IMAGE_URL=${result.secure_url}\n`);
    
    return result;
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

uploadPerformersImage();

