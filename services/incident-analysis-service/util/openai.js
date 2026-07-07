import Openai from 'openai';

const openai = new Openai({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
