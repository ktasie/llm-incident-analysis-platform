import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import analysisRoute from './routes/analysis.route.js';

const app = express();
const port = process.env.PORT || 4006;

app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

app.use('/api/v1/', analysisRoute);

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: 'fail',
    message: err.message || 'Internal server error',
  });
});

app.listen(port, () => {
  console.log(`Incident analysis service listening on port ${port}`);
});
