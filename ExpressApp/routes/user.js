import express from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'

const userRouter = express.Router();

// Route to register new user
userRouter.post('/register', async (req, res) => {
    console.log(`*** REGISTER NEW USER - START ***`);
    const {name, username, password, role, department} = req.body;

    console.log(`New user, name: ${name}, username: ${username}, role: ${role}, department: ${department}`);

    // generate hash password
    const hashPassword = await argon2.hash(password);

    // generate unique userId
    const randomNum = Math.floor(Math.random() * 1000);
    const userId = Date.now().toString().slice(7) + randomNum;

    try {
        const newUser = new User({name, username, userId, hashPassword, role, department});
        const result = await newUser.save();       // saving new user info in DB

        console.log(`Save successful: ${result._id}`);

        res.status(201).json({
            message: 'User Created',
            user: {
                name: result.name,
                username: result.username,
                userId: result.userId,
                role: result.role,
                department: result.department,
            }
        });
        console.log(`*** REGISTER NEW USER - END ***`);
    } catch(err) {
        res.status(500).json({message: "Internal server error"});
        console.log(err);
        console.log(`*** REGISTER NEW USER - START ***`);
    }
});

// Route to login user
userRouter.post('/login', async (req, res) => {
    console.log(`*** LOGIN USER - START ***`);
    try {
        const {username, password} = req.body;
        const user = await User.findOne({username});
        if(!user) {
            console.log('no user found');
            console.log(`*** LOGIN USER - END ***`);
            return res.status(400). json({message: "invalid username or password"});
        }
        const isPasswordValid = argon2.verify(user.hashPassword, password);
        if(!isPasswordValid) {
            console.log("invalid password");
            console.log(`*** LOGIN USER - END ***`);
            return res.status(400). json({message: "invalid username or password"});
        }
        console.log(`user found: ${user.username}`);
        const jwtToken = jwt.sign(
            {
                userId: user.userId,
                username: user.username,
                department: user.department,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        res.status(200).json({
            message: 'login successful',
            authToken: jwtToken,
            username: user.username,
            name: user.name,
            role: user.role,
            department: user.department,
            id: user.userId
        });
        console.log(`*** LOGIN USER - END ***`);
    } catch(err) {
        res.status(500).json({message:'Internal server error'});
        console.log(err);
        console.log(`*** LOGIN USER - END ***`);
    }
})

export default userRouter;