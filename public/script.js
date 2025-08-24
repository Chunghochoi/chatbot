const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") || "guest"; 
const chatTitle = document.getElementById("chatTitle");

if (mode === "persona") {
  chatTitle.textContent = "🔒 Chatbot Riêng tư";
} else {
  chatTitle.textContent = "👤 Chatbot Khách";
}

let theme = "light";
function toggleTheme() {
  theme = theme === "light" ? "dark" : "light";
  document.body.className = theme;
}

const GEMINI_API_KEY = "AIzaSyDtovOnKqGNYdamLaVDlp3UYDSFfnD2fbk";
const MODEL = "gemini-1.5-flash";

async function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;

  const chatWindow = document.getElementById("chatWindow");

  // hiển thị tin nhắn user
  const userMsg = document.createElement("div");
  userMsg.className = "message user";
  userMsg.textContent = text;
  chatWindow.appendChild(userMsg);
  input.value = "";

  // gọi Gemini API
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text }] }]
        })
      }
    );

    const data = await response.json();
    let botReply = "⚠️ Không nhận được phản hồi từ Gemini";
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      botReply = data.candidates[0].content.parts[0].text;
    }

    const botMsg = document.createElement("div");
    botMsg.className = "message bot";
    botMsg.textContent = botReply;
    chatWindow.appendChild(botMsg);
    chatWindow.scrollTop = chatWindow.scrollHeight;

  } catch (err) {
    console.error(err);
    const botMsg = document.createElement("div");
    botMsg.className = "message bot";
    botMsg.textContent = "❌ Lỗi khi gọi API Gemini!";
    chatWindow.appendChild(botMsg);
  }
}
