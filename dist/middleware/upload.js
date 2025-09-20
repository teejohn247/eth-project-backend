"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingleVideo = exports.uploadSingleImage = exports.uploadMediaFiles = void 0;
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'profilePhoto') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Profile photo must be an image file (jpg, png, gif, etc.)'));
        }
    }
    else if (file.fieldname === 'videoUpload') {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Video upload must be a video file (mp4, mov, avi, etc.)'));
        }
    }
    else {
        cb(new Error('Unexpected field name'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 2
    }
});
exports.uploadMediaFiles = upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'videoUpload', maxCount: 1 }
]);
exports.uploadSingleImage = upload.single('profilePhoto');
exports.uploadSingleVideo = upload.single('videoUpload');
exports.default = upload;
//# sourceMappingURL=upload.js.map