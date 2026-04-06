import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { GoogleGenerativeAI } from  // Gemini support
i

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Unified Chat Route (Supports both Gemini and OpenAI)
  app.post("/api/chat", async (req, res) => {
    const { messages, model = "gpt-4o" } = req.body;
    
    const openAIKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // 1. Try OpenAI first (Since Gemini is hitting quota limits)
    if (openAIKey) {
      try {
        const openai = new OpenAI({ apiKey: openAIKey });
        const completion = await openai.chat.completions.create({
          model: model,
          messages: messages,
        });
        return res.json(completion.choices[0].message);
      } catch (error: any) {
        console.error("OpenAI Error:", error.message);
      }
    }

    // 2. Fallback to Gemini if OpenAI is missing or fails
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = messages[messages.length - 1].content;
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return res.json({ role: "assistant", content: response.text() });
      } catch (error: any) {
        console.error("Gemini Error:", error.message);
      }
    }

    res.status(400).json({ error: "No valid API keys found. Please check your .env file." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`J.A.R.V.I.S. Server running on http://localhost:${PORT}`);
  });
}

startServer();