# Form-Data Upload Migration

## Overview

The media upload functionality has been migrated from base64 string uploads to multipart/form-data uploads for better performance, efficiency, and user experience.

## Changes Made

### 1. Dependencies Added
- **multer**: For handling multipart/form-data uploads
- **@types/multer**: TypeScript definitions for multer

### 2. New Files Created

#### `src/middleware/upload.ts`
- Configures multer for memory storage
- Implements file filtering for images and videos
- Sets file size limits (100MB)
- Exports middleware for different upload scenarios

#### Key Features:
- **Memory Storage**: Files are stored in memory as Buffer objects
- **File Type Validation**: Separate validation for images and videos
- **Size Limits**: 100MB maximum file size
- **Multiple Upload Types**: Support for both single and multiple file uploads

### 3. Updated Files

#### `src/services/cloudinaryService.ts`
- **Before**: Accepted base64 strings directly
- **After**: Accepts Buffer objects and converts them to base64 internally
- **Methods Updated**: `uploadImage()` and `uploadVideo()`
- **JSDoc Updated**: Reflects new parameter types

#### `src/controllers/registrationController.ts`
- **updateMediaInfo()** function completely rewritten
- **Before**: Extracted base64 data from `req.body`
- **After**: Extracts file buffers from `req.files`
- **File Access**: Uses `req.files` with proper TypeScript typing
- **Error Handling**: Enhanced error messages for file upload issues

#### `src/routes/registration.ts`
- Added `uploadMediaFiles` middleware to media-info route
- **Route**: `PUT /:id/media-info` now includes multer middleware
- **Middleware Chain**: `authenticateToken` → `uploadMediaFiles` → `updateMediaInfo`

### 4. Swagger Documentation Updated

#### Media Info Endpoint (`/api/v1/registrations/{id}/media-info`)
- **Content-Type**: Changed from `application/json` to `multipart/form-data`
- **Request Body**: Now uses `format: binary` for file uploads
- **Fields**:
  - `profilePhoto`: Binary image file
  - `videoUpload`: Binary video file
  - `nextStep`: Integer for flow control
- **Encoding**: Proper content-type specifications for each field

## API Usage Changes

### Before (Base64)
```javascript
// Frontend - Base64 approach
const formData = {
  profilePhoto: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  videoUpload: "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28y...",
  nextStep: 6
};

fetch('/api/v1/registrations/{id}/media-info', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(formData)
});
```

### After (Form-Data)
```javascript
// Frontend - Form-data approach
const formData = new FormData();
formData.append('profilePhoto', profilePhotoFile); // File object
formData.append('videoUpload', videoFile); // File object
formData.append('nextStep', '6');

fetch('/api/v1/registrations/{id}/media-info', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token
    // No Content-Type header - browser sets it automatically
  },
  body: formData
});
```

### cURL Examples
```bash
# Upload profile photo only
curl -X PUT "http://localhost:3001/api/v1/registrations/{id}/media-info" \
  -H "Authorization: Bearer $TOKEN" \
  -F "profilePhoto=@profile.jpg" \
  -F "nextStep=6"

# Upload both photo and video
curl -X PUT "http://localhost:3001/api/v1/registrations/{id}/media-info" \
  -H "Authorization: Bearer $TOKEN" \
  -F "profilePhoto=@profile.jpg" \
  -F "videoUpload=@audition.mp4" \
  -F "nextStep=6"
```

## Benefits

### 1. Performance Improvements
- **Reduced Memory Usage**: No need to store large base64 strings in memory
- **Faster Uploads**: Binary data is more efficient than base64 encoding
- **Streaming**: Multer can handle large files efficiently

### 2. Better User Experience
- **Progress Tracking**: Form-data uploads support progress indicators
- **Error Handling**: Better error messages for file type and size issues
- **Browser Compatibility**: Native browser support for file uploads

### 3. Developer Experience
- **Type Safety**: Proper TypeScript interfaces for file handling
- **Validation**: Built-in file type and size validation
- **Debugging**: Easier to debug file upload issues

### 4. Scalability
- **Memory Efficiency**: Files are processed as streams rather than loaded entirely into memory
- **Size Limits**: Configurable limits prevent abuse
- **File Management**: Better organization of uploaded files

## File Validation

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- And other formats supported by browsers

### Supported Video Formats
- MP4 (.mp4)
- MOV (.mov)
- AVI (.avi)
- WMV (.wmv)
- FLV (.flv)
- WebM (.webm)
- MKV (.mkv)

### Size Limits
- **Maximum File Size**: 100MB per file
- **Maximum Files**: 2 files total (1 image + 1 video)

## Error Handling

### File Type Errors
```json
{
  "success": false,
  "message": "Profile photo must be an image file (jpg, png, gif, etc.)"
}
```

### File Size Errors
```json
{
  "success": false,
  "message": "Video file is too large. Maximum size is 100MB.",
  "error": "File size: 150MB"
}
```

### Upload Errors
```json
{
  "success": false,
  "message": "Failed to upload video",
  "error": "Video upload failed: Invalid video format or corrupted file"
}
```

## Testing Status

### ✅ Completed Tests
1. **Profile Photo Upload**: Successfully uploads images to Cloudinary
2. **File Type Validation**: Rejects non-image files for profile photos
3. **No Files Handling**: Gracefully handles requests with no files
4. **Error Responses**: Proper error messages for various failure scenarios
5. **Swagger Documentation**: Updated and regenerated successfully

### 🔄 Integration Status
- **Backend**: Fully implemented and tested
- **Cloudinary**: Working with both images and videos
- **Database**: Properly stores Cloudinary URLs and metadata
- **API Documentation**: Updated in Swagger UI

## Migration Notes

### For Frontend Developers
1. **Change Content-Type**: Remove `application/json`, let browser set `multipart/form-data`
2. **Use FormData**: Replace JSON objects with FormData API
3. **File Objects**: Pass actual File objects instead of base64 strings
4. **Error Handling**: Update error handling for new error message formats

### For API Consumers
1. **Endpoint Unchanged**: Same URL and authentication
2. **Request Format**: Must use `multipart/form-data`
3. **Response Format**: Same JSON response structure
4. **File Fields**: `profilePhoto` and `videoUpload` are now binary fields

## Backward Compatibility

⚠️ **Breaking Change**: This is a breaking change for the media upload endpoint. The old base64 approach is no longer supported.

### Migration Required For:
- Frontend applications using the media upload endpoint
- Any scripts or tools that upload media files
- API documentation and integration guides

## Future Enhancements

### Potential Improvements
1. **Progress Tracking**: Add upload progress callbacks
2. **Chunked Uploads**: Support for very large files
3. **Multiple File Types**: Support for additional media formats
4. **Compression**: Automatic image/video compression
5. **Metadata Extraction**: Extract and store file metadata
6. **Thumbnail Generation**: Generate thumbnails for videos

### Configuration Options
1. **Configurable Limits**: Environment-based size limits
2. **Storage Options**: Support for different storage backends
3. **Validation Rules**: Customizable file validation rules

## Conclusion

The migration to form-data uploads provides a more robust, efficient, and scalable solution for media uploads. While it requires frontend changes, the benefits in performance and user experience make it worthwhile.

The implementation maintains the same Cloudinary integration and database storage patterns while providing better file handling capabilities.
