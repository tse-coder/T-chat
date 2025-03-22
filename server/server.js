import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import auth from "./routes/auth.js";
import router from "./routes/route.js";
import variables from "./config/env.js";

await connectDB();

const origin = "http://localhost:3000"; //set origin to enable cors for it

const app = express();
const server = http.createServer(app);

app.use(auth); //handles authentication requests

app.use(router); //handles normal requests

app.use(cors({ origin: origin, methods: ["GET", "POST"] })); // Enable CORS for Express requests

const io = new Server(server, {
  // Enable CORS for Socket.io
  cors: {
    origin: origin,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("joinroom", (room) => {
    socket.join(room);
  });

  socket.on("message", (message, room) => {
    socket.join(room);
    socket.to(room).emit("reply", message);
  });
});

server.listen(variables.port, () => {
  console.log("listening on port " + variables.port);
});
