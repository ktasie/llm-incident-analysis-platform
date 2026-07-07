import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3001;
const apiBaseUrl = process.env.LOGGING_SERVICE || 'http://localhost:4005';

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.render('index', { apiBaseUrl });
});

app.post('/search', async (req, res) => {
  try {
    const { correlationId } = req.body;

    const url = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/logs/${correlationId}`;
    const response = await fetch(url);
    const data = await response.json();

    res.render('search', { apiBaseUrl, logs: data.data || [], count: data.count });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/analyze', async (req, res) => {
  try {
    
    const { correlationId } = req.body;

    //const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/v1/analysis`, {
    const response = await fetch(`${process.env.AI_ANALYSIS_SERVICE}/api/v1/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correlationId }),
    });

    const data = await response.json();
    res.render('analysis', { analysis: data.data || null, error: data.status === 'fail' ? data.message : null });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port, () => console.log(`Incident dashboard listening on port ${port}`));
