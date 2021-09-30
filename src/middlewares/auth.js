const User = require('../db/models/user')
const jwt = require('jsonwebtoken')

const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization.replace('Bearer ', '')
        const decodeId = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({_id:decodeId._id, 'tokens.token':token})
        if(!user) {
            throw new Error()
        }
        req.token = token
        req.user = user
        next()
    } catch (err) {
        res.status(401).send({error:"Failed to authenticate!"})
    }
}

module.exports = auth