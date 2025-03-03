import dotenv from "dotenv";
dotenv.config();
import { Server } from "socket.io";
import http from "http";
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import md5 from "md5";
import cors from "cors";

mongoose
  .connect(process.env.CONNECTION_STRING)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const mySchema = new mongoose.Schema(
  {
    name: String,
    password: String,
    pp: String,
    status: String,
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    sender: String,
    receiver: String,
    message: String,
  },
  { timestamps: true }
);

const User = new mongoose.model("user", mySchema);
const Message = new mongoose.model("message", messageSchema);

const port = process.env.PORT || 5000;
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
const server = http.createServer(app);
//const origin = "https://t-chat-e5ss.onrender.com";
const origin = "http://localhost:3000"
// Enable CORS for Express requests (if needed)
app.use(cors({ origin: origin, methods: ["GET", "POST"] }));

// Enable CORS for Socket.io
const io = new Server(server, {
  cors: {
    origin: origin,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("connected to " + socket.id);

  socket.on("joinroom", (room) => {
    socket.join(room);
    console.log(`${socket.id} joined room ${room}`);
  });

  socket.on("message", (message, room) => {
    socket.join(room);
    socket.to(room).emit("reply", message);
    console.log(message + " sent to " + room);
  });
});

server.listen(port, () => {
  console.log("listening on port " + port);
});

app.get("/users", async (req, res) => {
  const result = await User.find({ name: { $ne: req.query.sender } });
  res.json(result);
});
app.get("/allusers", async (req, res) => {
  const result = await User.find();
  res.json(result);
});
app.get("/messages", async (req, res) => {
  const result = await Message.find({
    $or: [{ sender: req.query.sender }, { receiver: req.query.sender }],
  });
  res.json(result);
});

app.post("/adduser", async (req, res) => {
  try {
    const newUser = new User({
      name: req.body.newUser.name,
      password: md5(req.body.newUser.password),
      pp: req.body.newUser.pp,
      status: req.body.newUser.status,
    });
    await newUser.save();
    res.status(201).json({ message: "user added successfully" });
  } catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.post("/addmessage", async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    res.status(201).json({ message: "message added successfully" });
  } catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

app.post("/updateUser", async (req, res) => {
  try {
    await User.updateOne(
      { name: req.query.oldName },
      { $set: { name: req.query.newName } }
    );
    await Message.updateMany(
      { sender: req.query.oldName },
      { $set: { sender: req.query.newName } }
    );
    await Message.updateMany(
      { receiver: req.query.oldName },
      { $set: { receiver: req.query.newName } }
    );
    res.status(201).json({ message: "updated successfully" });
  } catch (err) {
    console.log(err);
  }
});

app.post("/deleteUser", async (req, res) => {
  try {
    await User.deleteOne({ name: req.query.user });
    await Message.deleteMany({
      $or: [{ sender: req.query.user }, { receiver: req.query.user }],
    });
    res.status(201).json({ message: `deleted user: ${req.query.user}` });
  } catch (err) {
    res.status(501).json({ message: err.message });
  }
});

app.post("/logIn", async (req, res) => {
  try {
    await User.updateOne(
      { name: req.query.user },
      { $set: { status: "online" } }
    );
    res.status(201).json({ message: `logged in user: ${req.query.user}` });
  } catch (err) {
    res.status(501).json({ message: err.message });
  }
});
app.post("/logOut", async (req, res) => {
  try {
    await User.updateOne(
      { name: req.query.user },
      { $set: { status: "offline" } }
    );
    res.status(201).json({ message: `logged out user: ${req.query.user}` });
  } catch (err) {
    res.status(501).json({ message: err.message });
  }
});

app.post("/changePassword", async (req, res) => {
  if (req.body.newPassword == req.body.CheckPassword) {
    const user = await User.findOne({ name: req.body.username });
    if (user.password == md5(req.body.oldPassword)) {
      await User.updateOne(
        { name: req.body.username },
        { $set: { password: md5(req.body.newPassword) } }
      );
      res.status(201).json({ message: "Password changed" });
    } else {
      res.json({ error: "The old password is wrong" });
    }
  } else {
    res.json({ error: "The new passwords are different" });
  }
  console.log(req.body);
});

app.post("/changepp",async(req,res)=>{
  try{
    await User.updateOne({name:req.body.name},{$set:{pp:req.body.pp}})
    res.status(201).json({message:"profile picture changed successfully"})
  }catch(err){
    res.status(501).json({error:"failed to change profile picture"})
  }
})
