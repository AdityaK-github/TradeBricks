// Simple debug server to identify issues
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Debug server running" });
});

app.listen(5001, () => {
  console.log("Debug server running on port 5001");
});
