import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

// Lazy init: create client per-request so missing key only fails at call time,
// not at startup — server can boot and pass /health check without the key.
function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Add it in Railway → Variables.');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, key_configured: !!process.env.OPENAI_API_KEY });
});

app.post('/api/speech-to-text', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file_required' });
    const client = getClient();

    const audioFile = new File(
      [req.file.buffer],
      req.file.originalname || 'audio.webm',
      { type: req.file.mimetype || 'audio/webm' }
    );

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'gpt-4o-transcribe'
    });

    res.json({ text: transcription.text || '' });
  } catch (error) {
    res.status(500).json({ error: 'speech_to_text_failed', detail: error.message });
  }
});

app.post('/api/vision-analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file_required' });
    const client = getClient();

    const base64 = req.file.buffer.toString('base64');
    const mime = req.file.mimetype || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${base64}`;

    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [{
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: '你是一个家庭物品整理助手。请识别图片中的主要物品，并只返回 JSON，字段包含 object_name、caption、suggested_location。caption 用简洁中文描述，suggested_location 给出一个可能的存放位置建议。'
          },
          {
            type: 'input_image',
            image_url: dataUrl
          }
        ]
      }],
      text: {
        format: {
          type: 'json_schema',
          name: 'vision_result',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              object_name: { type: 'string' },
              caption: { type: 'string' },
              suggested_location: { type: 'string' }
            },
            required: ['object_name', 'caption', 'suggested_location']
          }
        }
      }
    });

    const parsed = JSON.parse(response.output_text || '{}');
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'vision_analyze_failed', detail: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'configured ✓' : 'NOT SET ✗ — add in Railway Variables'}`);
});
