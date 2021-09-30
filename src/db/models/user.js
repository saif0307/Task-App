const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        default: 0,
        validate(age) {
            if(age < 0) {
                throw new Error('Age can not be in negaive numbers')
            }
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim:true,
        validate(email) {
            if(!validator.isEmail(email)) {
                throw new Error('Email type is incorrect')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 6,
        validate(pass) {
            if(pass.includes('password')) {
                throw new Error('Password cannot contain the word password')
            }
        }
    },
    tokens: [
        {
            token:{
                type: String,
                required: true
            }
        }
    ],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: "Task",
    localField:'_id',
    foreignField: 'owner'
})

//Filtering the private data
userSchema.methods.toJSON =  function() {
    const user = this
    const userObj = user.toObject()
    delete userObj.password
    delete userObj.tokens
    delete userObj.avatar
    return userObj
}

// Generating Auth token

userSchema.methods.generateAuthToken = async function()  {
    const user = this
    const jwtToken = await jwt.sign({_id:user._id.toString()}, process.env.JWT_SECRET )
    user.tokens = user.tokens.concat({token:jwtToken})
    await user.save()
    return jwtToken
}

//logging in
userSchema.statics.findByCredentials = async (email, pass) => {
    const user = await User.findOne({email})
    if(!user) {
       throw new Error('Unable to login')
    }
    const isValid = await bcrypt.compare(pass, user.password)

    if(!isValid) {
        throw new Error('Unable to login')
    }
    return user

}


// Logic for hashicng password
userSchema.pre('save', async function(next) {
    const user = this
    if(user.isModified(('password'))) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

// for deleteing tasks when removing user

userSchema.pre('remove', async function(next) {
    await Task.deleteMany({owner: this._id })
    next()
})



const User =  mongoose.model('User', userSchema)

module.exports = User