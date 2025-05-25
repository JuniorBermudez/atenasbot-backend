
# 🧠 AtenasBot Backend

Este es el backend para el chatbot de soporte técnico universitario **AtenasBot**, desarrollado con Node.js, Express y OpenAI.

## 🚀 Despliegue en Render

1. Crea una cuenta en [Render](https://render.com).
2. Sube este repositorio a GitHub (por ejemplo: `atenasbot-backend`).
3. En Render, selecciona "New Web Service" y conecta tu GitHub.
4. Configura:

   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment Variable**:
     ```
     OPENAI_API_KEY = TU_API_KEY_DE_OPENAI
     ```

5. Espera que Render construya y despliegue tu API. Guarda la URL generada.

## 📁 Archivos

- `index.js`: servidor principal con integración OpenAI y FAQs.
- `faqs.json`: preguntas frecuentes que se responden automáticamente.

---

