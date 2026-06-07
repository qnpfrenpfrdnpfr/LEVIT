import express from "express";
import { chatWithAgent } from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/", chatWithAgent);

export default router;