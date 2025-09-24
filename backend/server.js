import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";
import User from "./models/User.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("user_online", async (userId) => {
    onlineUsers.set(userId, socket.id);

    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });

      socket.broadcast.emit("user_status_change", {
        userId,
        isOnline: true,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  });

  socket.on("send_message", async (data) => {
    try {
      const receiverSocketId = onlineUsers.get(data.receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", data);
      }

      socket.emit("message_sent", data);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("typing_start", (data) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing_start", data);
    }
  });

  socket.on("typing_stop", (data) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing_stop", data);
    }
  });

  socket.on("disconnect", async () => {
    let disconnectedUserId = null;

    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUserId) {
      try {
        await User.findByIdAndUpdate(disconnectedUserId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        socket.broadcast.emit("user_status_change", {
          userId: disconnectedUserId,
          isOnline: false,
        });
      } catch (error) {
        console.error("Error updating user status on disconnect:", error);
      }
    }

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
