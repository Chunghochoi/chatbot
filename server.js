const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// phục vụ file tĩnh trong folder public
app.use(express.static(path.join(__dirname, "public")));

// mặc định về login.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
