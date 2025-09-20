import multer from 'multer';
import { Request } from 'express';

// Configure multer for memory storage (files stored in memory as Buffer)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file types
  if (file.fieldname === 'profilePhoto') {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Profile photo must be an image file (jpg, png, gif, etc.)'));
    }
  } else if (file.fieldname === 'videoUpload') {
    // Accept only video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Video upload must be a video file (mp4, mov, avi, etc.)'));
    }
  } else {
    cb(new Error('Unexpected field name'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 2 // Maximum 2 files (profilePhoto + videoUpload)
  }
});

// Export middleware for handling media uploads
export const uploadMediaFiles = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'videoUpload', maxCount: 1 }
]);

// Export single file upload middleware for flexibility
export const uploadSingleImage = upload.single('profilePhoto');
export const uploadSingleVideo = upload.single('videoUpload');

export default upload;
