const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

//Initialize
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

//middleware
app.use(express.static(path.resolve("./public")));

//constants or working
const port = process.env.PORT || 5000;

const users = new Map();

//socket.io
try {
  io.on("connection", (socket) => {
    console.log(`user connected: ${socket.id}`);

    users.set(socket.id, socket.id);

    io.emit("user:joined", socket.id);
    socket.emit("hello", { id: socket.id });

    socket.on("outgoing:call", (data) => {
      const { fromOffer, to } = data;
      console.log(data);
      socket
        .to(to)
        .emit("incoming:call", { from: socket.id, offer: fromOffer });
    });

    socket.on("call:accepted", (data) => {
      const { answer, to } = data;
      socket.to(to).emit("incoming:answer", { from: socket.id, offer: answer });
    });

    socket.on("disconnect", () => {
      console.log(`user disconnected: ${socket.id}`);
      users.delete(socket.id);
      io.emit("user:disconnect", socket.id);
    });
  });
} catch (error) {
  console.log(error);
}

//Routes
app.get("/users", (req, res) => {
  return res.json(Array.from(users));
});

//listen server
server.listen(port, () => {
  console.log(`Sever is started on port ${port}`);
});
