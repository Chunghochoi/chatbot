const express = require("express");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API Endpoint chính cho chatbot
app.post("/chat", async (req, res) => {
    const userQuery = req.body.query;
    if (!userQuery) {
        return res.status(400).json({ error: "Query is required" });
    }

    try {
        // --- BƯỚC 1: HỎI AI XEM CÓ CẦN TÌM KIẾM KHÔNG ---
        console.log("Đang phân tích câu hỏi của người dùng...");
        const decisionPrompt = \`Is a real-time web search required to answer the following user query accurately? Answer with only the word "SEARCH" or "NO_SEARCH". User query: "\${userQuery}"\`;

        const decisionUrl = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${process.env.GEMINI_API_KEY}\`;

        const decisionPayload = {
            contents: [{ parts: [{ text: decisionPrompt }] }]
        };

        const decisionResponse = await axios.post(decisionUrl, decisionPayload);
        const decision = decisionResponse.data.candidates[0].content.parts[0].text.trim().toUpperCase();
        console.log(\`Quyết định của AI: \${decision}\`);

        let botReply = "";

        // --- BƯỚC 2: HÀNH ĐỘNG DỰA TRÊN QUYẾT ĐỊNH ---
        if (decision === "SEARCH") {
            console.log("Thực hiện tìm kiếm trên Google...");
            let searchResults = "Không tìm thấy thông tin nào.";

            try {
                const searchUrl = \`https://www.googleapis.com/customsearch/v1\`;
                const searchParams = {
                    key: process.env.GOOGLE_SEARCH_API_KEY,
                    cx: process.env.SEARCH_ENGINE_ID,
                    q: userQuery,
                    num: 3
                };
                const searchResponse = await axios.get(searchUrl, { params: searchParams });
                if (searchResponse.data.items && searchResponse.data.items.length > 0) {
                    searchResults = searchResponse.data.items.map(item => \`Snippet: \${item.snippet}, Link: \${item.link}\`).join("\\n");
                    console.log("Tìm kiếm thành công.");
                }
            } catch (searchError) {
                console.error("LỖI KHI GỌI GOOGLE SEARCH API:", searchError.message);
            }

            const finalPrompt = \`Based on the following real-time search results:\\n\\n"""\\n\${searchResults}\\n"""\\n\\nPlease provide a comprehensive and accurate answer to the user's original query: "\${userQuery}"\`;

            const finalAnswerUrl = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=\${process.env.GEMINI_API_KEY}\`;
            const finalAnswerPayload = { contents: [{ parts: [{ text: finalPrompt }] }] };
            const finalAnswerResponse = await axios.post(finalAnswerUrl, finalAnswerPayload);
            botReply = finalAnswerResponse.data.candidates[0].content.parts[0].text;

        } else {
            console.log("Trả lời trực tiếp mà không cần tìm kiếm...");
            const directAnswerUrl = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=\${process.env.GEMINI_API_KEY}\`;
            const directAnswerPayload = { contents: [{ parts: [{ text: userQuery }] }] };
            const directAnswerResponse = await axios.post(directAnswerUrl, directAnswerPayload);
            botReply = directAnswerResponse.data.candidates[0].content.parts[0].text;
        }

        console.log("Đã có câu trả lời cuối cùng.");
        res.json({ reply: botReply });

    } catch (error) {
        console.error("LỖI CHÍNH TRONG QUÁ TRÌNH XỬ LÝ:", error.response ? JSON.stringify(error.response.data) : error.message);
        res.status(500).json({ error: "Một lỗi nghiêm trọng đã xảy ra." });
    }
});

// Route mặc định
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(\`🚀 Server đang chạy tại http://localhost:\${PORT}\`);
});