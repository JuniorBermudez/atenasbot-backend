import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import stringSimilarity from 'string-similarity';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Leer FAQs desde archivo
let faqs = [];
try {
  const data = fs.readFileSync('./faqs.json', 'utf8');
  faqs = JSON.parse(data);
} catch (err) {
  console.error('Error al leer faqs.json:', err);
}

// Endpoint raíz
app.get('/', (req, res) => {
  res.send('🧠 AtenasBot backend está en línea');
});

// Endpoint para obtener las FAQs
app.get('/faqs', (req, res) => {
  res.json(faqs);
});

// Endpoint principal para recibir preguntas del usuario
app.post('/api/chat', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Pregunta no recibida' });

  // Intentar responder desde las FAQs
  const questions = faqs.map((faq) => faq.pregunta);
  const matches = stringSimilarity.findBestMatch(question, questions);
  const bestMatch = matches.bestMatch;

  // Si la coincidencia es buena, respondemos con la FAQ
  if (bestMatch.rating > 0.6) {
    const respuesta = faqs.find((faq) => faq.pregunta === bestMatch.target)?.respuesta;
    return res.json({ answer: respuesta, source: 'faq' });
  }

  // Si no, preguntar a OpenAI
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: question }],
    });

    const aiResponse = completion.choices[0].message.content;
    res.json({ answer: aiResponse, source: 'openai' });
  } catch (err) {
    console.error('Error con OpenAI:', err);
    res.status(500).json({ error: 'Error al procesar la respuesta con IA' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`✅ Servidor corriendo en puerto ${port}`);
});
