const fs = require('fs');

// Create a minimal MP4 file header (this is a very basic MP4 structure)
// This creates a valid but minimal MP4 file that should be accepted by Cloudinary
const mp4Header = Buffer.from([
  // ftyp box
  0x00, 0x00, 0x00, 0x20, // box size (32 bytes)
  0x66, 0x74, 0x79, 0x70, // 'ftyp'
  0x69, 0x73, 0x6F, 0x6D, // major brand 'isom'
  0x00, 0x00, 0x02, 0x00, // minor version
  0x69, 0x73, 0x6F, 0x6D, // compatible brand 'isom'
  0x69, 0x73, 0x6F, 0x32, // compatible brand 'iso2'
  0x61, 0x76, 0x63, 0x31, // compatible brand 'avc1'
  0x6D, 0x70, 0x34, 0x31, // compatible brand 'mp41'
  
  // mdat box (minimal)
  0x00, 0x00, 0x00, 0x08, // box size (8 bytes)
  0x6D, 0x64, 0x61, 0x74  // 'mdat'
]);

fs.writeFileSync('test-video.mp4', mp4Header);

console.log('Test video file created: test-video.mp4');
console.log('File size:', mp4Header.length, 'bytes');
console.log('\nYou can test video upload with:');
console.log('curl -X PUT "http://localhost:3001/api/v1/registrations/68cd47854e5085179cbc1074/media-info" \\');
console.log('  -H "Authorization: Bearer $GOCIX_TOKEN" \\');
console.log('  -F "videoUpload=@test-video.mp4" \\');
console.log('  -F "nextStep=6"');
