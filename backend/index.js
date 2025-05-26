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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let faqs = [];
try {
  const data = fs.readFileSync('./faqs.json', 'utf8');
  faqs = JSON.parse(data);
} catch (err) {
  console.error('Error al leer faqs.json:', err);
}

app.get('/', (req, res) => res.send('✅ AtenasBot backend activo'));

app.get('/faqs', (req, res) => res.json(faqs));

app.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Pregunta vacía' });

  const preguntas = faqs.map(f => f.pregunta);
  const similitudes = stringSimilarity.findBestMatch(question, preguntas);
  const mejor = similitudes.bestMatch;

  if (mejor.rating > 0.6) {
    const respuesta = faqs.find(f => f.pregunta === mejor.target)?.respuesta;
    return res.json({ answer: respuesta, source: 'faq' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: question }],
    });

    const aiReply = completion.choices[0].message.content;
    res.json({ answer: aiReply, source: 'openai' });
  } catch (error) {
    console.error('Error con OpenAI:', error);
    res.status(500).json({ error: 'Error con el modelo de IA' });
  }
});

app.listen(port, () => console.log(`🚀 Backend corriendo en puerto ${port}`));
