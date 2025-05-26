import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import stringSimilarity from 'string-similarity';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar DeepSeek como proveedor
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Tu clave DeepSeek
  baseURL: 'https://api.deepseek.com' // Endpoint de DeepSeek
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
  res.send('🧠 AtenasBot backend con DeepSeek está en línea');
});

// Endpoint para obtener FAQs
app.get('/faqs', (req, res) => {
  res.json(faqs);
});

// Endpoint para manejar preguntas
app.post('/ask', async (req, res) => {
  const { question } = req.body;

  if (!question) return res.status(400).json({ error: 'Pregunta no recibida' });

  // Intentar responder desde FAQs
  const questions = faqs.map((faq) => faq.pregunta);
  const matches = stringSimilarity.findBestMatch(question, questions);
  const bestMatch = matches.bestMatch;

  if (bestMatch.rating > 0.6) {
    const respuesta = faqs.find((faq) => faq.pregunta === bestMatch.target)?.respuesta;
    return res.json({ answer: respuesta, source: 'faq' });
  }

  // Si no encuentra coincidencia en FAQs, consultar a DeepSeek
  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: question }],
    });

    const aiResponse = completion.choices[0].message.content;
    res.json({ answer: aiResponse, source: 'deepseek' });

  } catch (err) {
    console.error('Error al usar DeepSeek:', err);
    res.status(500).json({ error: 'Error al generar respuesta con IA' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`✅ Servidor corriendo en puerto ${port}`);
});
