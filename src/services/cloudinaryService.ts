import { v2 as cloudinary } from 'cloudinary';

class CloudinaryService {
  constructor() {
    // Configuration
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbwtjruq8',
      api_key: process.env.CLOUDINARY_API_KEY || '847587541363699',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'Njzv0olQin9e3kZUJStYv8n5OCk'
    });
  }

  /**
   * Upload image buffer to Cloudinary
   * @param fileBuffer - Image file buffer from multer
   * @param publicId - Public ID for the uploaded image
   * @param folder - Folder to organize uploads
   * @returns Promise with upload result
   */
  async uploadImage(fileBuffer: Buffer, publicId: string, folder: string = 'edo-talent-hunt/images'): Promise<any> {
    try {
      // Convert buffer to base64 for Cloudinary upload
      const base64Data = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
      
      const uploadResult = await cloudinary.uploader.upload(base64Data, {
        public_id: `${folder}/${publicId}`,
        resource_type: 'image',
        overwrite: true,
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
          { width: 800, height: 800, crop: 'limit' }
        ]
      });

      return {
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes
      };
    } catch (error) {
      console.error('Cloudinary image upload error:', error);
      throw new Error(`Failed to upload image: ${error}`);
    }
  }

  /**
   * Upload video buffer to Cloudinary
   * @param fileBuffer - Video file buffer from multer
   * @param publicId - Public ID for the uploaded video
   * @param folder - Folder to organize uploads
   * @returns Promise with upload result
   */
  async uploadVideo(fileBuffer: Buffer, publicId: string, folder: string = 'edo-talent-hunt/videos'): Promise<any> {
    try {
      // Convert buffer to base64 for Cloudinary upload
      const base64Data = `data:video/mp4;base64,${fileBuffer.toString('base64')}`;

      const uploadResult = await cloudinary.uploader.upload(base64Data, {
        public_id: `${folder}/${publicId}`,
        resource_type: 'video',
        overwrite: true,
        allowed_formats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'],
        transformation: [
          { quality: 'auto' },
          { width: 1280, height: 720, crop: 'limit' }
        ],
        eager: [
          { width: 300, height: 200, crop: 'pad', format: 'jpg' } // Generate thumbnail
        ]
      });

      return {
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        bytes: uploadResult.bytes
      };
    } catch (error: any) {
      console.error('Cloudinary video upload error:', error);

      // Provide more specific error messages
      if (error.http_code === 400) {
        throw new Error(`Video upload failed: ${error.message || 'Invalid video format or corrupted file'}`);
      } else if (error.http_code === 413) {
        throw new Error('Video file is too large. Please use a smaller file.');
      } else if (error.http_code === 420) {
        throw new Error('Video upload rate limit exceeded. Please try again later.');
      }

      throw new Error(`Failed to upload video: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Delete a resource from Cloudinary
   * @param publicId - Public ID of the resource to delete
   * @param resourceType - Type of resource ('image' or 'video')
   * @returns Promise with deletion result
   */
  async deleteResource(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });

      return {
        success: result.result === 'ok',
        result: result.result
      };
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error(`Failed to delete resource: ${error}`);
    }
  }

  /**
   * Generate optimized URL for an existing Cloudinary resource
   * @param publicId - Public ID of the resource
   * @param options - Transformation options
   * @returns Optimized URL
   */
  generateOptimizedUrl(publicId: string, options: any = {}): string {
    return cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto',
      ...options
    });
  }

  /**
   * Generate thumbnail URL for video
   * @param publicId - Public ID of the video
   * @param options - Transformation options
   * @returns Thumbnail URL
   */
  generateVideoThumbnail(publicId: string, options: any = {}): string {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        { width: 300, height: 200, crop: 'fill' },
        { quality: 'auto' }
      ],
      ...options
    });
  }
}

export default new CloudinaryService();
