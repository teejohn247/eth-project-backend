"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
class CloudinaryService {
    constructor() {
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbwtjruq8',
            api_key: process.env.CLOUDINARY_API_KEY || '847587541363699',
            api_secret: process.env.CLOUDINARY_API_SECRET || 'Njzv0olQin9e3kZUJStYv8n5OCk'
        });
    }
    async uploadImage(fileBuffer, publicId, folder = 'edo-talent-hunt/images') {
        try {
            const base64Data = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
            const uploadResult = await cloudinary_1.v2.uploader.upload(base64Data, {
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
        }
        catch (error) {
            console.error('Cloudinary image upload error:', error);
            throw new Error(`Failed to upload image: ${error}`);
        }
    }
    async uploadVideo(fileBuffer, publicId, folder = 'edo-talent-hunt/videos') {
        try {
            const base64Data = `data:video/mp4;base64,${fileBuffer.toString('base64')}`;
            const uploadResult = await cloudinary_1.v2.uploader.upload(base64Data, {
                public_id: `${folder}/${publicId}`,
                resource_type: 'video',
                overwrite: true,
                allowed_formats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'],
                transformation: [
                    { quality: 'auto' },
                    { width: 1280, height: 720, crop: 'limit' }
                ],
                eager: [
                    { width: 300, height: 200, crop: 'pad', format: 'jpg' }
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
        }
        catch (error) {
            console.error('Cloudinary video upload error:', error);
            if (error.http_code === 400) {
                throw new Error(`Video upload failed: ${error.message || 'Invalid video format or corrupted file'}`);
            }
            else if (error.http_code === 413) {
                throw new Error('Video file is too large. Please use a smaller file.');
            }
            else if (error.http_code === 420) {
                throw new Error('Video upload rate limit exceeded. Please try again later.');
            }
            throw new Error(`Failed to upload video: ${error.message || 'Unknown error'}`);
        }
    }
    async deleteResource(publicId, resourceType = 'image') {
        try {
            const result = await cloudinary_1.v2.uploader.destroy(publicId, {
                resource_type: resourceType
            });
            return {
                success: result.result === 'ok',
                result: result.result
            };
        }
        catch (error) {
            console.error('Cloudinary delete error:', error);
            throw new Error(`Failed to delete resource: ${error}`);
        }
    }
    generateOptimizedUrl(publicId, options = {}) {
        return cloudinary_1.v2.url(publicId, {
            fetch_format: 'auto',
            quality: 'auto',
            ...options
        });
    }
    generateVideoThumbnail(publicId, options = {}) {
        return cloudinary_1.v2.url(publicId, {
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
exports.default = new CloudinaryService();
//# sourceMappingURL=cloudinaryService.js.map