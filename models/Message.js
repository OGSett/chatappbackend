import { Schema, model } from "mongoose";

const MessageSchema = new Schema({
  room: { type: String, required: true },
  sender: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default model("Message", MessageSchema);
