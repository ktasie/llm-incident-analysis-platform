import mongoose from 'mongoose';
import Like from './../models/likeModel.js';
import logger from '../utils/logger.js';

const getLikes = async (req, res) => {
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
      data = await Like.find({ targetId: imageId });
    } catch (err) {
      void logger.error({
        correlationId: req.correlationId,
        event: 'DATABASE_QUERY_FAILED',
        message: 'Failed to retrieve likes from database',
        metadata: {
          targetId: imageId,
          errorMessage: err.message,
        },
      });
      throw err;
    }

    void logger.info({
      correlationId: req.correlationId,
      event: 'LIKES_RETRIEVED',
      message: 'Successfully retrieved likes for the target',
      metadata: {
        targetId: imageId,
        likesCount: data.length,
      },
    });

    res.status(200).json({
      status: 'Success',
      Likes: data.length,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: `${err.message}`,
    });
  }
};

const postLike = async (req, res) => {
  try {
    // Receive incoming json fields
    const { targetType } = req.body;
    const { targetId } = req.params;

    if (req.headers['x-user']) {
      try {
        req.user = JSON.parse(req.headers['x-user']);
      } catch {
        req.user = null;
      }
    }
    const userId = req.user._id;

    // console.log(email, password);
    if (!targetId) {
      const err = new Error('An image has to be selected to like.');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      const err = new Error('Invalid imageId.');
      err.statusCode = 400;
      throw err;
    }

    let newLike;

    try {
      newLike = await Like.create({
        authorId: userId,
        targetId,
        targetType,
      });
    } catch (err) {
      if (err.code === 11000) {
        void logger.warn({
          correlationId: req.correlationId,
          event: 'ALREADY_LIKED',
          message: 'User has already liked this target',
          metadata: {
            authorId: userId,
            targetId,
            targetType,
          },
        });

        //const err = new Error('You have already liked this target.');
        //err.statusCode = 409;
        //throw err;
        res.status(409).json({
          status: 'fail',
          message: 'You have already liked this target.',
        });
        return;
      }

      void logger.error({
        correlationId: req.correlationId,
        event: 'DATABASE_QUERY_FAILED',
        message: 'Failed to save like to database',
        metadata: {
          authorId: userId,
          targetId,
          targetType,
          errorMessage: err.message,
        },
      });

      throw err;
    }

    void logger.info({
      correlationId: req.correlationId,
      event: 'LIKE_CREATED',
      message: 'Like created successfully',
      metadata: {
        likeId: newLike._id,
        authorId: userId,
        targetId,
        targetType,
      },
    });

    // console.log(newComment);
    res.status(201).json({
      status: 'success',
      liked: true,
    });
  } catch (err) {
    // console.log(err.message);
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: `${err.message}`,
    });
  }
};

export { postLike, getLikes };
