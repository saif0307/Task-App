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
    // The very basics of the needed options for populate
	const populateOptions = { path: 'tasks', options: { sort: { createdAt: 1 } } }

	// Only add match criteria if supplied
	if (req.query.completed) {
		populateOptions.match = {}
		populateOptions.match.completed = (req.query.completed === 'true')
	}

	// Only add the sort data if it is supplied
	if (req.query.sortBy) {
		const parts = req.query.sortBy.split('_')
		populateOptions.options.sort = {}
		populateOptions.options.sort[parts[0]] = (parts[1] === 'desc') ? -1 : 1
	}

	// Only add the limit if a value is supplied
	if (req.query.limit) { populateOptions.options.limit = parseInt(req.query.limit, 10) }

	// Only add the skip if a value is provided
	if (req.query.skip) { populateOptions.options.skip = parseInt(req.query.skip, 10) }
  try {
     await req.user.populate([populateOptions])
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

