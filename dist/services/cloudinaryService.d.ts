declare class CloudinaryService {
    constructor();
    uploadImage(fileBuffer: Buffer, publicId: string, folder?: string): Promise<any>;
    uploadVideo(fileBuffer: Buffer, publicId: string, folder?: string): Promise<any>;
    deleteResource(publicId: string, resourceType?: 'image' | 'video'): Promise<any>;
    generateOptimizedUrl(publicId: string, options?: any): string;
    generateVideoThumbnail(publicId: string, options?: any): string;
}
declare const _default: CloudinaryService;
export default _default;
//# sourceMappingURL=cloudinaryService.d.ts.map