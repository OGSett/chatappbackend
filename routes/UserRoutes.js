import {Router} from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { nanoid } from 'nanoid'
import User from '../models/User.js'

const UserRoutes = Router()

UserRoutes.post('/register', async (req, res) => {
    const {username, email, password} = req.body
    try {
        const existingUser = await User.findOne({email})
        if (existingUser) return res.status(400).json({message: 'Email already in use'})

        const user = new User({username, email, password, userId: nanoid() })
        await user.save()

        res.status(201).json({message: 'User registred successfuly'})
    } catch (err)  {
        res.status(500).json({error: err.message})
    }
})

UserRoutes.post('/login', async (req, res) => {
    const {email, password} = req.body
    try {
        const user = await User.findOne({email})
        if (!user) return res.status(400).json({message: 'Invalid email or password'})

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) return res.status(400).json({message: 'Invalid email or password'})

        // res.json({message: 'User loged in successfuly'})
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'})
        res.json({token, user: {id: user._id, username: user.username, email:user.email}})
    } catch (err) {
        res.status(500).json({error: err.message})
    }
})

UserRoutes.get('/validate', async (req, res) => {
    const token = req.headers['x-auth-token']
    if(!token) return res.status(401).json({message: 'No token provided'})

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET)
        if (!verified) return res.status(401).json({message: 'Token verification failed'})

        res.json({message: 'Token is valid', userId: verified.id})
    } catch (err) {
        res.status(500).json({error: err.message})
    }
})

UserRoutes.get('/username/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ username: user.username });
    } catch (err) {
        console.error('Error fetching username:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

UserRoutes.get('/user-info', async (req, res) => {
    const token = req.headers['x-auth-token'];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(verified.id).select('-password'); 
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ user });
    } catch (err) {
        console.error('Error validating token:', err);
        res.status(500).json({ error: err.message });
    }
});



export default UserRoutes;
