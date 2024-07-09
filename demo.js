const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// Initialize
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Middleware
app.use(express.static(path.resolve("./public")));

// Constants
const port = process.env.PORT || 5000;
const users = new Map();

// Socket.io
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  users.set(socket.id, socket.id);
  socket.broadcast.emit("user:joined", socket.id);

  socket.on("offer", (data) => {
    const { offer, to } = data;
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", (data) => {
    const { answer, to } = data;
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("candidate", (candidate) => {
    io.emit("candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    users.delete(socket.id);
    socket.broadcast.emit("user:disconnect", socket.id);
  });
});

// Routes
app.get("/users", (req, res) => {
  res.json(Array.from(users));
});

// Start Server
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
