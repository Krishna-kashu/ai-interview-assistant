import express from "express";
import OpenAI from "openai";

const router = express.Router();

let openai;


router.use((req, res, next) => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "sk-1234567890abcdef", 
    });
    console.log("🔑 OpenAI initialized with key:", process.env.OPENAI_API_KEY ? "Loaded" : "Missing");
  }
  next();
});

router.get("/generate-questions", async (req, res) => {
  try {
    res.json([
      { level: "Easy", time: 20, question: "What is React?" },
      { level: "Easy", time: 20, question: "Explain useState hook." },
      { level: "Medium", time: 60, question: "Describe Redux and its benefits." },
      { level: "Medium", time: 60, question: "Explain React lifecycle methods." },
      { level: "Hard", time: 120, question: "How would you optimize React performance?" },
      { level: "Hard", time: 120, question: "Explain context API vs Redux." },
    ]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

router.post("/score", async (req, res) => {
  const { answer } = req.body;
  res.json({ score: answer.trim() ? 10 : 0 });
});

router.post("/finalize", async (req, res) => {
  res.json({ summary: "Candidate answered all questions." });
});

export default router;
