import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import authRouter from './routes/auth.js';
import itemsRouter from './routes/items.js';
import recommendRouter from './routes/recommend.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

function getClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, key_configured: !!process.env.OPENAI_API_KEY, db_configured: !!process.env.DATABASE_URL });
});

app.use('/auth', authRouter);
app.use('/api/items', itemsRouter);
app.use('/api/recommend', recommendRouter);

app.post('/api/speech-to-text', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file_required' });
    const client = getClient();
    const audioFile = new File([req.file.buffer], req.file.originalname || 'audio.webm', { type: req.file.mimetype || 'audio/webm' });
    const transcription = await client.audio.transcriptions.create({ file: audioFile, model: 'gpt-4o-transcribe' });
    res.json({ text: transcription.text || '' });
  } catch (err) {
    res.status(500).json({ error: 'speech_to_text_failed', detail: err.message });
  }
});

app.post('/api/vision-analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file_required' });
    const client = getClient();
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${base64}`;
    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [{ role: 'user', content: [
        { type: 'input_text', text: '你是一个家庭物品整理助手。请识别图片中的主要物品，并只返回 JSON，字段包含 object_name、caption、suggested_location、category（物品类别，如证件、电子、衣物、厨房、书籍、工具等）。' },
        { type: 'input_image', image_url: dataUrl }
      ]}],
      text: { format: { type: 'json_schema', name: 'vision_result', schema: {
        type: 'object', additionalProperties: false,
        properties: {
          object_name: { type: 'string' }, caption: { type: 'string' },
          suggested_location: { type: 'string' }, category: { type: 'string' }
        },
        required: ['object_name', 'caption', 'suggested_location', 'category']
      }}}
    });
    res.json(JSON.parse(response.output_text || '{}'));
  } catch (err) {
    res.status(500).json({ error: 'vision_analyze_failed', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✓' : '✗ NOT SET'}`);
  console.log(`DATABASE_URL:   ${process.env.DATABASE_URL ? '✓' : '✗ NOT SET'}`);
});
