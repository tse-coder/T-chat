import express from "express";
import User from "../models/user.js";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";

const auth = new express.Router();
auth.use(bodyParser.urlencoded({extended:true}));
auth.use(express.json());

auth.post("/adduser", async (req, res) => {
  
    try {
      bcrypt.hash(req.body.newUser.password, 10, async(err, hash)=> {
        const newUser = new User({
          name: req.body.newUser.name,
          password: hash,
          pp: req.body.newUser.pp,
          status: req.body.newUser.status,
        });
        await newUser.save();
        res.status(201).json({ message: "user added successfully" });
      });
    } catch (err) {
      res.status(500).json({ Error: err.message });
    }
});

auth.post("/logIn", async (req, res) => {
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

auth.post("/logOut", async (req, res) => {
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

auth.post("/changePassword", async (req, res) => {
    if (req.body.newPassword == req.body.CheckPassword) {
      const user = await User.findOne({ name: req.body.username });
      bcrypt.compare(req.body.oldPassword, user.password, (err, result)=> {
        if(result){
          bcrypt.hash(req.body.newPassword, 10, async(err, hash)=> {
            await User.updateOne(
              { name: req.body.username },
              { $set: { password: hash } }
            );
            res.status(201).json({ message: "Password changed" });
          });
        }else{
          res.json({ error: "The old password is wrong" });
        }
      });
    } else {
      res.json({ error: "The new passwords are different" });
    }
  });

export default auth