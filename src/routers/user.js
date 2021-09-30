const express = require("express");
const Router = new express.Router();
const auth = require('../middlewares/auth')
const User = require("../db/models/user");
const multer = require('multer')
const sharp = require('sharp')
const {sendCancelationEmail, sendWelcomeMail} = require('../../accounts/account')

const avatar = multer({
  limits: {
    fileSize: 2000000
  },
  fileFilter(req, file, cb) {
    if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
       cb(new Error('Please use jpeg or png'), undefined)
    }
    cb(undefined, true)
  }
})

Router.post('/users/me/avatar',auth , avatar.single('avatar'), async (req, res) => {
  const buffer = await  sharp(req.file.buffer).resize({height:250, width: 250}).png().toBuffer()
  req.user.avatar = buffer
  await req.user.save()
  res.send()
}, (error, req, res, next) => {
  res.status(400).send(`Error:, ${error.message}`)
})


Router.delete('/users/me/avatar', auth, async (req, res) => {
   req.user.avatar = undefined
 await req.user.save()
  res.send()
})

Router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if(!user || !user.avatar) {
      throw new Error('No user found')
    }
    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
  } catch (err) {
    res.status(400).send({error: err.message})
  }
})

Router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user,token})
    } catch (err) {
        res.status(400).send(err)
    }
})

Router.post('/users/logout', auth, async (req, res) => {
    try {
        const user = req.user
        const authToken = req.token
        user.tokens = user.tokens.filter((token) => token.token !== authToken )
        await user.save()
        res.status(200).send()

    } catch (err) {
        res.status(401).send(err)
    }
})

Router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        const user = req.user
        user.tokens = []
        await user.save()
        res.status(200).send()

    } catch (err) {
     res.status(501).send()   
    }
})

Router.post("/users", async (req, res) => {
  try {
    const user1 = await new User(req.body);
    const token = await user1.generateAuthToken()
    await user1.save();
    sendWelcomeMail(user1.email, user1.name)
    res.status(201).send({
        user1,
        token
    });
  } catch (err) {
    res.status(400).send(err);
  }
});

Router.get("/users/me", auth, async (req, res) => {
  res.send(req.user)
});



Router.patch("/users/me", auth,  async (req, res) => {
  const passedUpdates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValid = passedUpdates.every((item) => allowedUpdates.includes(item));

  if (!isValid) {
    return res.status(401).send({ error: "invalid updates!" });
  }

  try {
    const document = req.user
    passedUpdates.forEach((item) => (document[item] = req.body[item]));
    await document.save();
    res.send(document);
  } catch (err) {
    res.status(400).send(err);
  }
});

Router.delete("/users/me", auth, async (req, res) => {
  try {
    // const user1 = await User.findByIdAndDelete(req.params.id);
    // if (!user1) {
    //   return res.status(404).send({ error: "Invalid User Id" });
    // }
    await req.user.remove()
    sendCancelationEmail(req.user.email, req.user.name)
    res.send(req.user);
  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = Router;
