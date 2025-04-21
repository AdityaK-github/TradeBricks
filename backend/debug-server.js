// Simple debug server to identify issues
import express from "express";
import cors from "cors";

const app = express();
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "https://tradebricks-frontend.onrender.com",
          "https://tradebricks-static.onrender.com",
          "https://tradebricks-1.onrender.com",
        ]
      : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.json({ message: "Debug server running" });
});

app.listen(5001, () => {
  console.log("Debug server running on port 5001");
});
