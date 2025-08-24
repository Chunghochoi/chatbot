const el = (s) => document.querySelector(s);
const messagesEl = el("#messages");
const inputEl = el("#userInput");
const sendBtn = el("#sendBtn");
const botSelector = el("#botSelector");
const themeSwitch = el("#themeSwitch");

// Theme
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.classList.toggle("dark", savedTheme === "dark");
themeSwitch.checked = savedTheme === "dark";

themeSwitch.addEventListener("change", () => {
  const next = themeSwitch.checked ? "dark" : "light";
  document.documentElement.classList.toggle("dark", next === "dark");
  localStorage.setItem("theme", next);
});

// Auth
el("#btnLogin").addEventListener("click", async () => {
  const password = el("#password").value.trim();
  const r = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await r.json();
  if (data.ok && data.persona) alert("✅ Đã bật persona.");
  else alert("Chỉ dùng bot thường.");
});

el("#btnLogout").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  alert("❌ Persona đã tắt.");
});

// Upload Messenger
el("#btnUpload").addEventListener("click", async () => {
  const f = el("#fileUpload").files?.[0];
  if (!f) return;
  const fd = new FormData();
  fd.append("file", f);
  const r = await fetch("/api/messenger/upload", { method: "POST", body: fd });
  const data = await r.json();
  el("#uploadMsg").textContent = data.ok
    ? `Đã tải ${data.count} tin nhắn`
    : `Lỗi: ${data.error}`;
});

// Chat
sendBtn.addEventListener("click", send);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") send();
});

async function send() {
  const text = inputEl.value.trim();
  if (!text) return;
  addMsg("user", text);
  inputEl.value = "";

  const mode = botSelector.value;
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, mode }),
    });
    const data = await r.json();
    if (!data.ok) throw new Error(data.error || "Lỗi");
    addMsg("bot", data.text);
  } catch (e) {
    addMsg("bot", "⚠️ " + e.message);
  }
}

function addMsg(role, text) {
  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "user" : "bot");
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
