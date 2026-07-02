import mongoose from 'mongoose';
import Comment from './../models/commentModel.js';
import logger from '../utils/logger.js';

const getComments = async (req, res) => {
  try {
    const { imageId } = req.params;

    if (!imageId) {
      const err = new Error('An image has to be selected to get more information');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      const err = new Error('Invalid imageId.');
      err.statusCode = 400;
      throw err;
    }

    let data;

    try {
      data = await Comment.find({ imageId });
    } catch (err) {
      void logger.error({
        correlationId: req.correlationId || null,
        event: 'DATABASE_QUERY_FAILED',
        message: 'Failed to retrieve comments from the database',
        metadata: {
          imageId,
          errorMessage: err.message,
        },
      });

      err._commentServiceLogged = true;
      throw err;
    }

    void logger.info({
      correlationId: req.correlationId || null,
      event: 'COMMENTS_RETRIEVED',
      message: 'Comments retrieved successfully',
      metadata: {
        imageId,
        count: data.length,
      },
    });

    res.status(200).json({
      status: 'Success',
      count: data.length,
      data,
    });
  } catch (err) {
    if ((!err.statusCode || err.statusCode >= 500) && !err._commentServiceLogged) {
      void logger.error({
        correlationId: req.correlationId || null,
        event: 'SERVICE_EXCEPTION',
        message: 'Unhandled exception in the comment service',
        metadata: {
          method: req.method,
          path: req.originalUrl || req.url,
          errorMessage: err?.message || 'Unexpected comment service error',
          stackTrace: err?.stack || null,
        },
      });
    }

    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: `${err.message}`,
    });
  }
};

const postComment = async (req, res) => {
  try {
    // Receive incoming json fields
    const { imageId, commentText } = req.body;

    if (req.headers['x-user']) {
      try {
        req.user = JSON.parse(req.headers['x-user']);
      } catch {
        req.user = null;
      }
    }
    const authorEmail = req.user.email;

    // console.log(email, password);
    if (!imageId || !commentText) {
      const err = new Error('All fields are required');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      const err = new Error('Invalid imageId.');
      err.statusCode = 400;
      throw err;
    }

    let newComment;

    try {
      newComment = await Comment.create({
        authorEmail,
        imageId,
        comment: commentText,
      });
    } catch (err) {
      void logger.error({
        correlationId: req.correlationId || null,
        event: 'COMMENTS_SAVE_FAILED',
        message: 'Failed to save comment to the database',
        metadata: {
          imageId,
          authorEmail,
          errorMessage: err.message,
          stackTrace: err?.stack || null,
        },
      });

      err._commentServiceLogged = true;
      throw err;
    }

    void logger.info({
      correlationId: req.correlationId || null,
      event: 'COMMENTS_CREATED',
      message: 'Comment created successfully',
      metadata: {
        imageId,
        commentId: newComment._id,
        authorEmail,
      },
    });

    // console.log(newComment);
    res.status(201).json({
      status: 'success',
      message: `${newComment._id} submitted successfully.`,
    });
  } catch (err) {
    if ((!err.statusCode || err.statusCode >= 500) && !err._commentServiceLogged) {
      void logger.error({
        correlationId: req.correlationId || null,
        event: 'SERVICE_EXCEPTION',
        message: 'Unhandled exception in the comment service',
        metadata: {
          method: req.method,
          path: req.originalUrl || req.url,
          errorMessage: err?.message || 'Unexpected comment service error',
          stackTrace: err?.stack || null,
        },
      });
    }

    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: `${err.message}`,
    });
  }
};

export { postComment, getComments };
