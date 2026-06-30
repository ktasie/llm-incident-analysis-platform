import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from './../models/userModel.js';
import { logger } from '../utils/logger.js';

const PRIVATE_KEY_PATH = process.env.JWT_PRIVATE_KEY_PATH || './../../keys/jwt_rsa';
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

// console.log(privateKey)

const signToken = (user, req) => {
  try {
    // return jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: `${process.env.JWT_EXPIRES_IN}h` });
    //return jwt.sign({ user }, privateKey, { algorithm: 'RS256', expiresIn: `${process.env.JWT_EXPIRES_IN}h` });
    const jwtGenerated = jwt.sign({ user }, privateKey, {
      algorithm: 'RS256',
      expiresIn: `${process.env.JWT_EXPIRES_IN}h`,
    });

    // Log the successful JWT generation event to the logging service.
    void logger.info({
      correlationId: req.correlationId || null,
      event: 'JWT_ISSUED',
      message: 'JWT token generated successfully',
      metadata: {
        userId: user._id,
        email: user.email,
        tokenType: 'accessToken',
        algorithm: 'RS256',
        expiresIn: `${process.env.JWT_EXPIRES_IN}h`,
      },
    });

    return jwtGenerated;
  } catch (err) {
    void logger.error({
      correlationId: req.correlationId,
      event: 'JWT_GENERATION_FAILED',
      message: 'Error occurred while signing the JWT token',
      metadata: {
        userId: user._id,
        algorithm: 'RS256',
        errorMessage: err.message,
      },
    });
    throw err;
  }
};

const createSignToken = (user, statusCode, res, req) => {
  const token = signToken(user, req);

  // Does not need to return cookie token as it is handled by the gateway.
  /*
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_EXPIRES_IN * 3600 * 1000),
    httpOnly: true,
  };
  res.cookie('jwt', token, cookieOptions);
  */
  void logger.info({
    correlationId: req.correlationId || null,
    event: 'USER_AUTHENTICATED',
    message: 'User logged in successfully',
    metadata: {
      userId: user._id,
      email: user.email,
      authenticationMethod: 'password',
      clientIp: req.ip,
      userAgent: req.get('User-Agent') || null,
      loginDuration: `${process.env.JWT_EXPIRES_IN}h`,
    },
  });

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    // console.log(email, password);
    if (!email || !password) {
      throw new Error('All fields are required');
    }

    // const hash = await bcrypt.hash(password, 10);
    // console.log(hash);
    let user;
    try {
      // Query the database for the user with the provided email and include the password field for comparison.
      user = await User.findOne({ email }).select('+password');
    } catch (err) {
      // Log the database query failure event
      void logger.error({
        correlationId: req.correlationId || null,
        event: 'DATABASE_QUERY_FAILED',
        message: 'Error occurred while querying the database for user login',
        metadata: {
          operation: "User.findOne().select('+password')",
          email,
          clientIp: req.ip,
          userAgent: req.get('User-Agent') || null,
        },
      });
      throw err;
    }

    if (!user) {
      // Log the failed login attempt due to invalid credentials.
      void logger.warn({
        correlationId: req.correlationId || null,
        event: 'USER_NOT_FOUND',
        message: 'Login attempt failed: User not found',
        metadata: {
          email,
          clientIp: req.ip,
          userAgent: req.get('User-Agent') || null,
        },
      });

      // Return a 401 Unauthorized response for invalid credentials.
      const err = new Error('Username and password combination do not match.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // Log the password comparison result for debugging purposes.
    if (!isMatch) {
      // Log the failed login attempt due to invalid credentials.
      void logger.warn({
        correlationId: req.correlationId || null,
        event: 'INVALID_PASSWORD',
        message: 'Login attempt failed: Invalid password',
        metadata: {
          email,
          clientIp: req.ip,
          userAgent: req.get('User-Agent') || null,
        },
      });

      const err = new Error('Username and password combination do not match.');
      err.statusCode = 401;
      throw err;
    }

    // hide the password from the output.
    user.password = undefined;

    // console.log(user, isMatch);
    createSignToken(user, 200, res, req);
  } catch (err) {
    //console.log(err.message);
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: `${err.message}`,
    });
  }
};

export { login };
