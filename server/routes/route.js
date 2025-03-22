import express from "express";
import User from "../models/user.js";
import Message from "../models/message.js";
import bodyParser from "body-parser";

const router = new express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/users", async (req, res) => {
  const result = await User.find({ name: { $ne: req.query.sender } });
  res.json(result);
});

router.get("/allusers", async (req, res) => {
  const result = await User.find();
  res.json(result);
});

router.get("/messages", async (req, res) => {
  const result = await Message.find({
    $or: [{ sender: req.query.sender }, { receiver: req.query.sender }],
  });
  res.json(result);
});

router.post("/addmessage", async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    res.status(201).json({ message: "message added successfully" });
  } catch (err) {
    res.status(500).json({ Error: err.message });
  }
});

router.post("/updateUser", async (req, res) => {
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

router.post("/deleteUser", async (req, res) => {
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

router.post("/changepp", async (req, res) => {
  try {
    await User.updateOne(
      { name: req.body.name },
      { $set: { pp: req.body.pp } }
    );
    res.status(201).json({ message: "profile picture changed successfully" });
  } catch (err) {
    res.status(501).json({ error: "failed to change profile picture" });
  }
});

export default router;