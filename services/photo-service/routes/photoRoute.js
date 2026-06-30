import express from 'express';
import { uploadPhoto, getPhotos, getOnePhoto } from './../controllers/photoController.js';
import multer from 'multer';
import logger from '../utils/logger.js';

const router = express.Router();
const storage = multer.memoryStorage();
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const invalidFileTypeMessage = 'Invalid file type';

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, //5mb limit
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      logPhotoEvent('warn', req, 'INVALID_FILE_TYPE', 'Unsupported file type rejected for photo upload', {
        fieldName: file.fieldname,
        fileName: file.originalname,
        mimeType: file.mimetype,
        allowedMimeTypes: Array.from(allowedMimeTypes),
      });

      const error = new Error(invalidFileTypeMessage);
      error.statusCode = 400;
      return cb(error);
    }

    return cb(null, true);
  },
});

const handlePhotoUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      res.status(err.statusCode || 400).json({
        status: 'fail',
        message: err.message || invalidFileTypeMessage,
      });

      return;
    }

    next();
  });
};

router.get('/photo/', getPhotos).get('/photo/:imageId', getOnePhoto).post('/photo/', handlePhotoUpload, uploadPhoto);

export default router;
