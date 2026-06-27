import path from 'path';
import mongoose from 'mongoose';
import { BlobServiceClient } from '@azure/storage-blob';

import Photo from './../models/photoModel.js';
import logger from '../utils/logger.js';

// Initialize Azure Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

//
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME);

// create container if it was not created.
await containerClient.createIfNotExists();
await containerClient.setAccessPolicy('blob');

//const getCorrelationId = (req) => req.correlationId || req.get('x-correlation-id') || null;

const getOnePhoto = async (req, res) => {
  try {
    const imageId = req.params.imageId;
    const photo = await Photo.findById(imageId);

    res.status(200).json({
      status: 'Success',
      photo,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: `${err.message}`,
    });
  }
};

// For this assignment we would get all photos since the data will be very small and filter within the frontend webapp.
const getPhotos = async (req, res) => {
  try {
    const allPhotos = await Photo.find();

    res.status(200).json({
      status: 'Success',
      count: allPhotos.length,
      allPhotos,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: `${err.message}`,
    });
  }
};

const uploadPhoto = async (req, res) => {
  try {
    if (req.headers['x-user']) {
      try {
        req.user = JSON.parse(req.headers['x-user']);
      } catch {
        req.user = null;
      }
    }
    const userId = req.user._id;

    const { title, caption, location, peoplePresent } = req.body;

    if (!title || !caption || !location || !peoplePresent) {
      const err = new Error('All Meta data has to filled.');
      err.statusCode = 400;
      throw err;
    }

    // Generate ObjectId
    const objectId = new mongoose.Types.ObjectId();

    //Get file extension
    const ext = path.extname(req.file.originalname);

    // construct blob name
    const blobName = objectId.toString() + ext;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Log the start of the upload event
    void logger.info({
      correlationId: req.correlationId || null,
      event: 'PHOTO_UPLOAD_STARTED',
      message: 'Photo upload started',
      metadata: {
        userId,
        title,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        blobName,
      },
    });

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: {
        blobContentType: req.file.mimetype,
        blobContentDisposition: 'inline',
      },
    });

    // quick fix for containers with azurite.
    const imageUrl =
      process.env.NODE_ENV === 'development'
        ? blockBlobClient.url.replace('http://azurite:10000', 'http://localhost:10000')
        : blockBlobClient.url;

    const newPhoto = await Photo.create({
      uploadedBy: userId,
      title,
      caption,
      location,
      peoplePresent,
      imageUrl,
      blobName,
    });

    // Log the successful upload event
    void logger.info({
      correlationId: req.correlationId || null,
      event: 'PHOTO_UPLOAD_COMPLETED',
      message: 'Photo upload completed successfully',
      metadata: {
        userId,
        photoId: newPhoto._id,
        blobName,
        fileName: req.file.originalname,
      },
    });

    // console.log(newComment);
    res.status(201).json({
      status: 'success',
      photo: newPhoto,
    });
  } catch (err) {
    // console.log(err.message);
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: `${err.message}`,
    });
  }
};

export { getPhotos, uploadPhoto, getOnePhoto };
