import path from 'path';
import mongoose from 'mongoose';
import { BlobServiceClient } from '@azure/storage-blob';

import Photo from './../models/photoModel.js';
import { logger, withOperationTimeoutLog } from '../utils/logger.js';

const timeout = process.env.OPERATION_TIMEOUT ? parseInt(process.env.OPERATION_TIMEOUT, 10) : 5000; // Default to 5 seconds if not set

// Initialize Azure Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

// Get a reference to the container client for the specified container name
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME);

// create container if it was not created.
await containerClient.createIfNotExists();
await containerClient.setAccessPolicy('blob');

// Controller to handle photo retrieval by ID
const getOnePhoto = async (req, res) => {
  try {
    let photo;
    const imageId = req.params.imageId;

    try {
      // Query database for the photo with a timeout
      photo = await withOperationTimeoutLog(
        req,
        () => Photo.findById(imageId),
        'Photo retrieval operation exceeded timeout',
        { operation: 'Photo.findById', imageId },
        timeout,
      );
    } catch (err) {
      // Log the database query failure event
      void logger.error({
        correlationId: req.correlationId || null,
        event: 'DATABASE_QUERY_FAILED',
        message: 'Failed to query the database for photo retrieval',
        metadata: {
          imageId,
          errorMessage: err.message,
        },
      });

      throw err;
    }

    // If the photo is not found, log a warning and return a 404 response
    if (!photo) {
      void logger.warn({
        correlationId: req.correlationId || null,
        event: 'PHOTO_NOT_FOUND',
        message: 'Requested photo not found',
        metadata: {
          imageId,
        },
      });
      res.status(404).json({
        status: 'fail',
        message: `Photo with ID ${imageId} not found`,
      });
      return;
    }

    // Log the successful photo retrieval event
    res.status(200).json({
      status: 'Success',
      photo,
    });
  } catch (err) {
    // Log the error details for debugging and monitoring purposes
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: `${err.message}`,
    });
  }
};

// Controller to handle retrieval of all photos
const getPhotos = async (req, res) => {
  try {
    // Query the database for all photos with a timeout
    const allPhotos = await withOperationTimeoutLog(
      req,
      () => Photo.find(),
      'Photo list query exceeded the timeout threshold',
      { operation: 'Photo.find' },
      timeout,
    );

    // Log the successful retrieval of all photos
    res.status(200).json({
      status: 'Success',
      count: allPhotos.length,
      allPhotos,
    });
  } catch (err) {
    void logger.error({
      correlationId: req.correlationId || null,
      event: 'DATABASE_QUERY_FAILED',
      message: 'Photo list query failed',
      metadata: {
        errorMessage: err.message,
      },
    });

    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: `${err.message}`,
    });
  }
};

// Controller to handle photo uploads
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

    // Get a block blob client
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

    // Simulate an unexpected exception for testing purposes if the environment variable is set
    try {
      if (process.env.SIMULATE_PHOTO_EXCEPTION === 'true') {
        throw new Error('Simulated unexpected exception during photo upload');
      }
    } catch (err) {
      void logger.error({
        correlationId: req.correlationId || null,
        event: 'SERVICE_EXCEPTION',
        message: 'Unexpected exception during photo upload',
        metadata: { userId, fileName: req.file.originalname, errorMessage: err.message },
      });
      throw new Error('Internal server error');
    }

    try {
      // Upload the file to Azure Blob Storage with a timeout
      await withOperationTimeoutLog(
        req,
        async () => {
          // Simulate a storage delay for testing purposes if the environment variable is set
          if (process.env.SIMULATE_STORAGE_DELAY === 'true') {
            await new Promise((resolve) => setTimeout(resolve, 6000));
          }

          return blockBlobClient.uploadData(req.file.buffer, {
            blobHTTPHeaders: {
              blobContentType: req.file.mimetype,
              blobContentDisposition: 'inline',
            },
          });
        },
        'Photo upload to Azure Blob Storage exceeded the timeout threshold',
        { operation: 'BlockBlobClient.uploadData', blobName, fileName: req.file.originalname },
        timeout,
      );
    } catch (err) {
      // Log the upload failure event
      void logger.error({
        correlationId: req.correlationId || null,
        event: 'BLOB_UPLOAD_FAILED',
        message: 'Failed to upload photo to Azure Blob Storage',
        metadata: {
          userId,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          blobName,
          errorMessage: err.message,
        },
      });
      throw new Error('Failed to upload photo to storage');
    }

    // quick fix for containers with azurite.
    const imageUrl =
      process.env.NODE_ENV === 'development'
        ? blockBlobClient.url.replace('http://azurite:10000', 'http://localhost:10000')
        : blockBlobClient.url;

    let newPhoto;

    try {
      // Save photo metadata to the database with a timeout
      newPhoto = await withOperationTimeoutLog(
        req,
        () =>
          Photo.create({
            uploadedBy: userId,
            title,
            caption,
            location,
            peoplePresent,
            imageUrl,
            blobName,
          }),
        'Photo metadata write exceeded the timeout threshold',
        { operation: 'Photo.create', userId, blobName },
        timeout,
      );
    } catch (err) {
      // Log the database write failure event
      void logger.error({
        correlationId: req.correlationId || null,
        event: 'DATABASE_QUERY_FAILED',
        message: 'Photo metadata write failed',
        metadata: {
          userId,
          blobName,
          errorMessage: err.message,
        },
      });
      throw err;
    }

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
