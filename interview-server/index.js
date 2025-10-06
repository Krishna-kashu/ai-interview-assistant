import dotenv from "dotenv";
dotenv.config();   

import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/ai", aiRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
