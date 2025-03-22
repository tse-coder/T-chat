import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import axios from 'axios';
import multer from "multer";
import imgbbUploader from 'imgbb-uploader';
import fs from 'fs';
import bcrypt from "bcrypt";

const app = express();
const port = process.env.PORT || 3000;
const serverURL = `https://t-chat-server.onrender.com`;

let users = []
let messages = []

app.use(express.json());
app.use(express.static("public"));
const upload = multer({dest: "uploads/"});
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", 'ejs' )

app.get("/", (req, res) => {
  res.render('start.ejs')
});

app.get("/login",(req,res)=>{
  res.render("start",{
    login:1
  })
})

app.get("/signup",(req,res)=>{
  res.render("start",{
    signup:1
  })
})

const getUsers = async(sender)=>{
  const result = await axios.get(serverURL+`/users?sender=${sender}`);
  users = result.data;
}
const getAllUsers = async()=>{
  const result = await axios.get(serverURL+`/allusers`);
  users = result.data;
}
const getMessages = async(sender)=>{
  const result = await axios.get(serverURL+`/messages?sender=${sender}`);
  return result.data;
}
app.post("/changepp",upload.single('picture'),async(req,res)=>{
  const img = await imgbbUploader(process.env.IMGBB_API_KEY,req.file.path)
  axios.post(serverURL+"/changepp",{
    pp:img.url,
    name:req.body.username
  }).then(async(response)=>{
    if(response.error){
      res.render("changePP",{error:"failed to change try again"})
    }else{
      await getAllUsers();
      let user;
      users.forEach(usr => {
        if(usr.name.toLowerCase() == req.body.username.toLowerCase()){
          user = usr
        }
      });
      await getUsers(req.body.username)
      res.render("index",{
        users: users,
        user: user,
        messages: messages
      })
    }
  }).catch(err=>res.render("changePP",{error:"failed to change try again"}))
  fs.unlink(req.file.path,(err)=>{
    if(err) console.log("delete failed")
    else console.log("deleted success")
  })
})

app.post("/login", async (req, res) => {
  try {
    const name = req.body.username;
    const password = req.body.password;
    //check if the user is in the database and render the index
    let found = false;
    let activeUser;
    await getAllUsers();
    users.forEach((user) => {
      if (user.name.toLowerCase() == name.toLowerCase()) {
        found = true;
        activeUser = user;
      }
    });
    if (found) {
      await axios
        .post(`${serverURL}/logIn?user=${activeUser.name}`)
        .then(() => console.log("loged In"))
        .catch((err) => console.log(err));
      await getUsers(name);
      bcrypt.compare(password, activeUser.password, (err, result) => {
        if (result) {
          res.render("index", {
            users: users,
            user: activeUser,
            messages: messages,
          });
        } else {
          res.render("start", {
            login: 1,
            error: "incorrect password. Try again",
          });
        }
      });
    } else {
      res.render("start", {
        login: 1,
        error: "incorrect username. Try again",
      });
    }
  } catch {
    res.render("start", {
      login: 1,
      error: "Error signing you in. Try again later",
    });
  }
});

app.post("/signup",async(req,res)=>{
  const username = req.body.username;
  const password = req.body.password;
  if(password == req.body['password-validation']){
    await getAllUsers()
    let userAlreadyIn = false
    users.forEach(user=>{
      if(user.name == username){
        userAlreadyIn = true
      }
    })
    if(!userAlreadyIn){
      const newUser = {
        name:username,
        password: password,
        pp:"https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg",
        status:"online"
      }
      try{
        const result = await axios.post(serverURL+"/adduser",{
          newUser:newUser
        })
        await getUsers(username);
        res.render("index",{
          users: users,
          user: newUser,
          messages: messages
        })
      }catch{
        res.render("start",{
          signup:1,
          error:"Error signing you up. Try again later"
        })
      }
    }else{
      res.render("start",{
        signup:1,
        error:"The username is already taken. try another"
      })
    }
  }else{
    res.render("start",{
      signup:1,
      error:"Passwords are not the same. Try again"
    })
  }
})

app.get("/getmessages",async(req,res)=>{
  messages = await getMessages(req.query.sender)
  res.json(messages)
})

app.post("/addmessage",async(req,res)=>{
  try{
    const newMsg = req.body;
    await axios.post(serverURL+"/addmessage",newMsg)
  }catch(err){
    console.log(err)
  }
})

app.post("/updateuser",async(req,res)=>{
  const oldName = req.body.oldName
  const newName = req.body.newName
  await axios.post(serverURL+`/updateUser?oldName=${oldName}&newName=${newName}`)
  res.status(201).json({message:"user updated successfully."})
})

app.post("/deleteUser",async(req,res)=>{
  try{
    await axios.post(`${serverURL}/deleteUser?user=${req.body.user}`)
    res.json({
      redirected: true,
      url: "/" 
    });
  }catch(err){
    res.json({message:err.message})
  }
})
app.post("/logOut",async(req,res)=>{
  try{
    await axios.post(`${serverURL}/logOut?user=${req.body.user}`)
    
    res.json({
      redirected: true,
      url: "/"
    });
  }catch(err){
    res.json({message:err.message})
  }
})
app.get("/changePassword",(req,res)=>{
  res.render("changePassword",{
    user:req.query.user
  });
})

app.post("/changePassword",async(req,res)=>{
  try{
    const response = await axios.post(serverURL+"/changePassword",req.body);
    if (response.data.error) { 
      res.render("changePassword", {
        error: response.data.error,
        user: req.body.username
      })
    }else{
      res.redirect("/")
    }
  }catch(err){
    res.status(501).json({message:err.message})
  }
})

app.get("/changepp",(req,res)=>{
  res.render("changepp",{
    user:req.query.name
  })
})


app.listen(port, (err) => {
  if (err) console.log(err);
  else console.log(`running on port ${port}`);
});


