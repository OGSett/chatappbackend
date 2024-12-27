import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import ChatRoutes from './routes/ChatRoutes.js';
import Message from './models/Message.js';
import UserRoutes from './routes/UserRoutes.js';
import User from './models/User.js';
import jwt from 'jsonwebtoken';



dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', UserRoutes);
app.use('/api/chat', ChatRoutes);


const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://chatappv2-2.onrender.com/',
        // origin: ['https://chatbotedit.vercel.app'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// connect to db
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

io.on('connection', async (socket) => {
    const token = socket.handshake.auth.token; 
    if (!token) {
        socket.emit('authError', { message: "Authentication token missing" });
        socket.disconnect();
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
            socket.emit('authError', { message: "Invalid user ID" });
            socket.disconnect();
            return;
        }

        const user = await User.findById(decoded.id).select('userId username email');
        if (!user) {
            socket.emit('authError', { message: "User not found" });
            socket.disconnect();
            return;
        }

        const userId = user.userId;
        const username = user.username;

        console.log(`User connected: ${socket.id} (${username})`);
        socket.emit('assignUserInfo', { userId, userInfo: user });
        socket.on('joinRoom', (room) => {
            if (!room) {
                console.error("Invalid room name");
                return;
            }
            socket.join(room);
            console.log(`User ${username} joined room: ${room}`);
        });

        socket.on('sendMessage', async (data) => {
            const { room, message } = data;
            if (!room || !message) {
                console.error("Invalid message data");
                return;
            }
            io.to(room).emit('receiveMessage', { idSender: userId, sender: username, message, time: new Date() });

            const newMessage = new Message({ room, sender: userId, message });
            await newMessage.save();
            console.log("Message saved to database:", newMessage);
        });

        socket.on("disconnect", () => {
            const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
            rooms.forEach((room) => {
                socket.leave(room);
                console.log(`User ${socket.id} left room: ${room}`);
            });
            console.log(`User disconnected: ${socket.id}`);
        });
    } catch (err) {
        console.error("Authentication error:", err.message);
        socket.emit('authError', { message: "Authentication error" });
        socket.disconnect();
    }
});
console.log("JWT_SECRET:", process.env.JWT_SECRET);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
