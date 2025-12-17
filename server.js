const express = require("express");

const app = express();

// Basic route (test)
app.get("/", (req, res) => {
  res.send("Server is running on Render 🚀");
});

// IMPORTANT: use Render's PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
