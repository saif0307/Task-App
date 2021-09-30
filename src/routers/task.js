const express = require('express')
const Router = new express.Router()
const auth = require('../middlewares/auth')
const Task = require('../db/models/task')


Router.post('/tasks', auth, async (req, res) => {
    try {
        const task1 = await new Task({
            ...req.body,
            owner: req.user._id
        })
        await task1.save()
         res.status(201).send(task1)
    } catch (err) {
        res.status(400).send(err)
    }
})





Router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}
    if(req.query.completed) {
        match.completed = req.query.completed === 'true'
    }
    if(req.query.sortBy) {
        const [value, order] = req.query.sortBy.split(':') 
        sort[value] = order === 'desc' ? -1 : 1
    }
  try {
     await req.user.populate({path:"tasks",
      match,
    options: {
        limit: parseInt(req.query.limit),
        skip:parseInt(req.query.skip),
        sort
    }})
    res.send(req.user.tasks)
  } catch (err) {
      console.log(err)
    res.status(400).send(err)
  }
})

Router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({_id:req.params.id, owner: req.user._id})
        // const data = await  Task.findById(req.params.id)
        if(!task) {
         return  res.status(404).send()
        }
        res.send(task)
    } catch (err) {
        res.status(400).send(err)
    }
})




Router.patch('/tasks/:id', auth,async (req, res) => {
    const passedUpdates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValid = passedUpdates.every((item) => allowedUpdates.includes(item) )
    if(!isValid) {
        return res.status(404).send({error: 'invalid updates'})
    }

    try {
        const document = await Task.findOne({_id: req.params.id, owner: req.user._id})
        
        // const updatedTask = await task.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true})
        if(!document) {
            return res.status(400).send()
        }
        passedUpdates.forEach((item) => document[item] = req.body[item])
        await document.save() 
        res.send(document)
    } catch (err) {
        res.status(400).send(err)
    }
})



Router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task1 = await Task.findOneAndDelete({_id: req.params.id, owner:req.user._id})
        if(!task1) {
            return res.status(404).send({error:"invalid Id"})
        }
        res.status(200).send(task1)
    } catch (err) {
        res.status(400)
    }
})

module.exports = Router

