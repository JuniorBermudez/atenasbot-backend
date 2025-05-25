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

app.get('/', (req, res) => {
  res.send('🧠 AtenasBot backend está en línea');
});

app.get('/faqs', (req, res) => {
  res.json(faqs);
});

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Mensaje no recibido' });

  const questions = faqs.map((faq) => faq.pregunta);
  const matches = stringSimilarity.findBestMatch(message, questions);
  const bestMatch = matches.bestMatch;

  if (bestMatch.rating > 0.6) {
    const respuesta = faqs.find((faq) => faq.pregunta === bestMatch.target)?.respuesta;
    return res.json({ reply: respuesta, source: 'faq', history: [...history, { user: message, bot: respuesta }] });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        ...history.flatMap(({ user, bot }) => [
          { role: 'user', content: user },
          { role: 'assistant', content: bot },
        ]),
        { role: 'user', content: message },
      ],
    });

    const aiResponse = completion.choices[0].message.content;
    res.json({
      reply: aiResponse,
      source: 'openai',
      history: [...history, { user: message, bot: aiResponse }],
    });
  } catch (err) {
    console.error('Error con OpenAI:', err);
    res.status(500).json({ error: 'Error al procesar la respuesta con IA' });
  }
});

app.listen(port, () => {
  console.log(`✅ Servidor corriendo en puerto ${port}`);
});
