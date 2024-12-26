import { Router } from "express";
import Message from "../models/Message.js";

const ChatRoutes = Router();

ChatRoutes.get("/:room", async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default ChatRoutes;
