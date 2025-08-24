import express from "express";
import cors from "cors";
import session from "cookie-session";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PERSONA_PASSWORD = process.env.PERSONA_PASSWORD || "changeme";
const PORT = process.env.PORT || 3000;

if (!GEMINI_API_KEY) {
  console.error("❌ Thiếu GEMINI_API_KEY trong biến môi trường.");
  process.exit(1);
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(
  session({ name: "sess", secret: "replace_me", httpOnly: true, sameSite: "lax" })
);
app.use(express.static("public"));

// --- Bộ nhớ tạm ---
let messengerCorpus = [];

// Upload file messenger.json
const upload = multer({ dest: "uploads/" });
app.post("/api/messenger/upload", upload.single("file"), (req, res) => {
  try {
    const raw = JSON.parse(fs.readFileSync(req.file.path, "utf-8"));
    messengerCorpus = normalizeMessenger(raw);
    res.json({ ok: true, count: messengerCorpus.length });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// Đăng nhập persona
app.post("/api/login", (req, res) => {
  const { password } = req.body || {};
  if (password && password === PERSONA_PASSWORD) {
    req.session.persona = true;
    return res.json({ ok: true, persona: true });
  }
  req.session.persona = false;
  return res.json({ ok: true, persona: false });
});

// Đăng xuất persona
app.post("/api/logout", (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

// API chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, mode = "normal" } = req.body || {};
    if (!message) return res.status(400).json({ ok: false, error: "Thiếu message" });

    let personaInstruction = "";
    let personaContext = "";

    if (mode === "persona" && req.session?.persona) {
      personaInstruction =
        "Hãy đóng vai người dùng gốc (tôi) dựa trên các ví dụ chat Messenger. Bắt chước giọng điệu, thói quen câu chữ khi phù hợp.";
      const examples = messengerCorpus.slice(0, 10)
        .map((m) => `- ${m.sender}: ${m.text}`)
        .join("\n");
      personaContext = "Ví dụ chat:\n" + examples;
    }

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "SYSTEM: Bạn là chatbot tiếng Việt lịch sự.\n" +
                personaInstruction +
                "\n" +
                personaContext,
            },
          ],
        },
        { role: "user", parts: [{ text: message }] },
      ],
    };

    const gemUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      encodeURIComponent(GEMINI_API_KEY);

    const resp = await fetch(gemUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error?.message || "Gemini API error");

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "(không có phản hồi)";

    res.json({ ok: true, mode, text });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Helper: chuẩn hóa dữ liệu Messenger
function normalizeMessenger(raw) {
  let msgs = [];
  if (Array.isArray(raw)) msgs = raw;
  else if (Array.isArray(raw.messages)) msgs = raw.messages;
  return msgs
    .map((m) => ({
      sender: m.sender || m.author || "me",
      text: (m.text || "").toString(),
    }))
    .filter((m) => m.text.trim().length > 0);
}

app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
