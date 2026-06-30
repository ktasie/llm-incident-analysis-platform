import { promisify } from 'util';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import createDownstreamServiceErrorHandler from '../middleware/downstreamServiceError.js';

//const PRIVATE_KEY_PATH = process.env.JWT_PRIVATE_KEY_PATH || "/keys/jwt_rsa";
const PUBLIC_KEY_PATH = process.env.JWT_PUBLIC_KEY_PATH || './../keys/jwt_rsa.pub';

// Read public key from filesystem to decode jwt
const pubKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');

// Middleware to protect routes by verifying JWT tokens and attaching user information to the request object.
const protect = async (req, res, next) => {
  try {
    let token;
    let tokenAuthType = null;

    // Check for token in Authorization header or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      tokenAuthType = 'Bearer';
    } else {
      token = req.cookies.jwt;
      tokenAuthType = 'Cookie';
    }

    // 2. If token is not present, log the event and return an error
    if (!token) {
      void logger.warn({
        correlationId: req.correlationId || null,
        event: 'JWT_MISSING',
        message: 'Authorization header is missing from the request',
        metadata: {
          method: req.method,
          path: req.originalUrl || req.url,
          clientIp: req.ip,
        },
      });

      const err = new Error('You are not logged in! Please log in to get access.');
      err.statusCode = 401;
      //return next(err);
      throw err;
      return;
    }

    // 3. Verify the token using the public key and handle any verification errors
    let decoded;

    try {
      decoded = await promisify(jwt.verify)(token, pubKey, { algorithms: 'RS256' });
    } catch (verifyErr) {
      void logger.warn({
        correlationId: req.correlationId || null,
        event: 'JWT_INVALID',
        message: 'JWT token validation failed in the gateway',
        metadata: {
          method: req.method,
          path: req.originalUrl || req.url,
          failureReason: verifyErr.name || 'JWT verification failed',
          errorMessage: verifyErr.message,
        },
      });

      const err = new Error('Invalid token! Please log in again.');
      err.statusCode = 401;
      //return next(err);
      throw err;
      return;
    }

    // 4. Attach the decoded user information to the request object and log the successful validation
    req.user = decoded.user;
    void logger.info({
      correlationId: req.correlationId || null,
      event: 'JWT_VALIDATED',
      message: 'JWT token successfully validated by the gateway',
      metadata: {
        userId: req.user?._id || req.user?.id || null,
        method: req.method,
        path: req.originalUrl || req.url,
        tokenAuthType,
      },
    });
    //console.log(req.user)
    next();
  } catch (err) {
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: err.message,
    });
  }
};

// Controller function to handle user login by forwarding the request to the authentication service and setting a JWT cookie upon successful authentication.
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const raw = JSON.stringify({ email, password });

    const reqOptions = {
      method: 'POST',
      headers: { 'content-Type': 'application/json', 'x-correlation-id': req.correlationId || null },
      body: raw,
    };

    const resp = await fetch(`${process.env.AUTH_SERVICE}/api/v1/login`, reqOptions);

    const data = await resp.json();
    // console.log(data);
    if (data.status === 'fail') {
      const err = new Error(data.message);
      err.statusCode = resp.status || 401;
      throw err;
    }

    const token = data.token;
    const cookieOptions = {
      expires: new Date(Date.now() + process.env.JWT_EXPIRES_IN * 3600 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };

    // Set cookie domain if defined.
    if (process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    res.cookie('jwt', token, cookieOptions);
    res.json({
      status: data.status,
      token: token,
      data: data.data,
    });
  } catch (err) {
    const responseTimeMs =
      typeof req.downstreamRequestStartedAt === 'number' ? Date.now() - req.downstreamRequestStartedAt : null;
    const downstreamStatusCode = typeof err?.statusCode === 'number' ? err.statusCode : null;

    await logger.error({
      correlationId: req.correlationId || null,
      event: 'DOWNSTREAM_SERVICE_ERROR',
      message: 'Downstream microservice request failed',
      metadata: {
        targetServiceName: 'auth-service',
        method: req.method,
        requestRoute: req.originalUrl || req.url,
        downstreamStatusCode,
        errorMessage: err?.message || 'Downstream service request failed',
        responseTimeMs,
      },
    });

    res.status(err.statusCode || 500).json({ status: 'fail', message: err.message });
  }
};

// Export the protect middleware and login controller for use in other parts of the application.
export { protect, login };
