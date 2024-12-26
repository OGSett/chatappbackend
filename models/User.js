import { Schema, model } from "mongoose";
import bcrypt from 'bcryptjs'

const UserSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    userId: {type: String, required: true },
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
})

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    try {
        const salt = await bcrypt.genSalt(10)
        this.password = await bcrypt.hash(this.password, salt)
        next()
    } catch (err){
        next(err)
    }
})

export default model("User", UserSchema)