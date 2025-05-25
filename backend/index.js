import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import stringSimilarity from 'string-similarity';

dotenv.config();

const app = express();

const allowedOrigins = [
  'https://atenasbot-frontend-40c0r3cn5-juniorbermudezs-projects.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const faqsPath = path.resolve('./faqs.json');
const faqs = JSON.parse(fs.readFileSync(faqsPath, 'utf-8'));

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  const preguntas = faqs.map((f) => f.pregunta);
  const { bestMatch } = stringSimilarity.findBestMatch(message, preguntas);

  if (bestMatch.rating > 0.7) {
    const respuestaFAQ = faqs.find((f) => f.pregunta === bestMatch.target).respuesta;
    return res.json({
      reply: respuestaFAQ,
      history: [...history, { role: 'user', content: message }, { role: 'assistant', content: respuestaFAQ }],
    });
  }

  const messages = [
    {
      role: 'system',
      content:
        'Eres un asistente de soporte técnico universitario llamado AtenasBot. Eres preciso, útil, amigable y conoces todos los sistemas universitarios.',
    },
    ...history,
    { role: 'user', content: message },
  ];

  try {
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.6,
      max_tokens: 500,
    });

    const reply = chatResponse.choices[0].message.content;
    res.json({
      reply,
      history: [...history, { role: 'user', content: message }, { role: 'assistant', content: reply }],
    });
  } catch (error) {
    console.error('Error en OpenAI:', error);
    res.status(500).json({ reply: 'Error al contactar con el servidor.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
