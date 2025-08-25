// server.js (updated)
const express = require("express");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, "public")));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model configuration
const MODEL_CONFIG = {
  "gemini-1.5-flash": { model: "gemini-1.5-flash", temperature: 0.7 },
  "gemini-2.0-flash": { model: "gemini-2.0-flash", temperature: 0.7 },
  "gemini-2.5-pro-preview": { model: "gemini-2.5-pro-preview", temperature: 0.3 }
};

// API endpoint to get available models
app.get("/api/models", (req, res) => {
  res.json({
    models: Object.keys(MODEL_CONFIG),
    defaultModel: "gemini-2.0-flash"
  });
});

// API endpoint for chat
app.post("/api/chat", upload.any(), async (req, res) => {
  try {
    const { message, model: modelName = "gemini-2.0-flash", chatHistory = [] } = req.body;
    const files = req.files || [];

    if (!message && files.length === 0) {
      return res.status(400).json({ error: "Message or file is required" });
    }

    const modelConfig = MODEL_CONFIG[modelName];
    if (!modelConfig) {
      return res.status(400).json({ error: "Invalid model specified" });
    }

    const model = genAI.getGenerativeModel({ 
      model: modelConfig.model,
      generationConfig: {
        temperature: modelConfig.temperature,
      }
    });

    // Prepare content with files if any
    const contents = [];
    
    // Add text content
    if (message) {
      contents.push({ text: message });
    }

    // Add file content
    for (const file of files) {
      if (file.mimetype.startsWith('image/')) {
        contents.push({
          inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype
          }
        });
      } else if (file.mimetype === 'application/json' || 
                 file.mimetype.startsWith('text/') ||
                 file.mimetype === 'application/pdf') {
        // For text-based files, extract and include as text
        const textContent = file.buffer.toString('utf-8');
        contents.push({ text: `File: ${file.originalname}\nContent:\n${textContent}` });
      }
    }

    // Generate content
    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: contents 
      }],
      history: chatHistory
    });

    const response = await result.response;
    const text = response.text();

    res.json({ 
      response: text,
      model: modelName
    });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
      error: "Failed to generate response",
      details: error.message 
    });
  }
});

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`Using Gemini API key: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing'}`);
});