import fs from 'fs';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';

//const PRIVATE_KEY_PATH = process.env.JWT_PRIVATE_KEY_PATH || "/keys/jwt_rsa";
const PUBLIC_KEY_PATH = process.env.JWT_PUBLIC_KEY_PATH || './../keys/jwt_rsa.pub';

const api_url = process.env.API_BASE_URL || 'http://localhost:4000';
const frontend_url = process.env.FRONTEND_URL || 'http://localhost:3000';

const pubKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');

const protect = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      const err = new Error('You are not logged in! Please log in to get access.');
      err.statusCode = 401;
      return next(err);
    }

    const decoded = await promisify(jwt.verify)(token, pubKey, { algorithms: 'RS256' });
    // console.log(decoded)

    req.locals = decoded.user;

    next();
  } catch (err) {
    console.log(err);
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: err.message,
    });
  }
};

const getLoginForm = async (req, res) => {
  res.status(200).render('login', { title: 'Sign in', pretty: true, apiUrl: api_url });
};

const goToDashboard = async (req, res) => {
  const uploads = await (
    await fetch(`${process.env.API_GATEWAY}/upload`, {
      method: 'GET',
      headers: { Cookie: req.headers.cookie || '' },
    })
  ).json();
  //console.log(uploads);
  res.status(200).render('dashboard', {
    title: 'Dashboard',
    pretty: true,
    user: req.locals,
    uploads,
    apiUrl: api_url,
    frontendUrl: frontend_url,
  });
};

const uploadPhoto = async (req, res) => {
  res.status(200).render('upload', { title: 'upload', pretty: true, user: req.locals, apiUrl: api_url });
};

const getPhoto = async (req, res) => {
  // fetch single image from endpoint.
  const imageId = req.params.imageId;

  const image = await (
    await fetch(`${process.env.API_GATEWAY}/upload/${imageId}`, {
      method: 'GET',
      headers: { Cookie: req.headers.cookie || '' },
    })
  ).json();

  // defaults
  let likeCount = { Likes: 0 };
  let comment = { data: { authorEmail: '', comment: '' } };

  try {
    likeCount = await (
      await fetch(`${process.env.API_GATEWAY}/like/${imageId}`, {
        method: 'GET',
        headers: { Cookie: req.headers.cookie || '' },
      })
    ).json();
  } catch (err) {
    // Handle error gracefully, log it, and continue with default likeCount
    console.error('Error fetching like count:', err);
  }

  try {
    // get comments
    comment = await (
      await fetch(`${process.env.API_GATEWAY}/comment/${imageId}`, {
        method: 'GET',
        headers: { Cookie: req.headers.cookie || '' },
      })
    ).json();
  } catch (err) {
    // Handle error gracefully, log it, and continue with default comment
    console.error('Error fetching comments:', err);
  }

  res.status(200).render('single', {
    title: 'image-title',
    pretty: true,
    user: req.locals,
    image: image.photo,
    likeCount,
    allComment: comment.data,
    apiUrl: api_url,
  });
};

export { getLoginForm, goToDashboard, protect, uploadPhoto, getPhoto };
