// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import stringSimilarity from 'string-similarity';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cargar FAQs
let faqs = [];
try {
  const data = fs.readFileSync('./faqs.json', 'utf8');
  faqs = JSON.parse(data);
} catch (err) {
  console.error('Error al leer faqs.json:', err);
}

// Ruta raíz
app.get('/', (req, res) => {
  res.send('🧠 AtenasBot backend está en línea');
});

// Ruta para ver FAQs
app.get('/faqs', (req, res) => {
  res.json(faqs);
});

// Ruta principal para preguntas
app.post('/ask', async (req, res) => {
  const { question } = req.body;
  console.log('📩 Pregunta recibida:', question);

  if (!question) return res.status(400).json({ error: 'Pregunta no recibida' });

  // Buscar en las FAQs
  const preguntas = faqs.map((faq) => faq.pregunta);
  const matches = stringSimilarity.findBestMatch(question, preguntas);
  const bestMatch = matches.bestMatch;

   if (bestMatch.rating > 0.6) {
    const respuesta = faqs.find((faq) => faq.pregunta === bestMatch.target)?.respuesta;
    return res.json({ answer: respuesta, source: 'faq' });
  }

  // Si no se encuentra coincidencia, usar OpenAI
  try {
    console.log('⚙️  Consultando OpenAI...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: question }],
    });

    const aiResponse = completion.choices[0].message.content;
    console.log('✅ Respuesta de OpenAI:', aiResponse);
    res.json({ answer: aiResponse, source: 'openai' });

  } catch (err) {
    console.error('❌ Error con OpenAI:', err?.response?.data || err.message || err);
    res.status(500).json({ error: 'Error al procesar la respuesta con IA' });
  }
});

app.listen(port, () => {
  console.log(`✅ Servidor corriendo en puerto ${port}`);
});
