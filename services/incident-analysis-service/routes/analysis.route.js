import express from 'express';
import { analyzeIncident } from './../controllers/analysis.controller.js';

const router = express.Router();

router.post('/analysis', analyzeIncident);

export default router;
