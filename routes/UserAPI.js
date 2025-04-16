const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const router = express.Router();

// API USER:  /api/user
// signup: POST /signup (username, password, description)
// change-password: POST /change-password (username, oldPassword, newPassword)
// login: POST /login (username, password)

// Sign up
router.post("/sign-up", async (req, res) => {
    try {
        const { username, password, email } = req.body;
 
        if (!username || !password || !email) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin." });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Mật khẩu cần có ít nhất 6 ký tự." });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, password: hashedPassword, email, description: "" });
        await newUser.save();

        res.status(201).json({ message: "Đăng ký thành công!" });
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ message: "Error server!" });
    }
});

// Change password
router.post("/change-password", async (req, res) => {   
    try {
        const { username, oldPassword, newPassword } = req.body;

        if (!username || !oldPassword || !newPassword) {
            return res.status(400).json({ message: "All is required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password required at least 6 characters" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Username not found!" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Old password is incorrect!" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ message: "Change password successful!" });
    } catch (error) {
        console.error("Error during change password:", error);
        res.status(500).json({ message: "Error server!", error: error.message });
    }
});

// Login
router.post("/login", async (req, res) => {    
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin." });
        }
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng!" });
        }

        // Tạo JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_KEY,
            { expiresIn: "1d" }
        );

        res.status(200).json({ message: "Đăng nhập thành công!", token });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Lỗi máy chủ!", error: error.message });
    }
});

// Get User Info
router.get("/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findOne({ _id: userId});

        res.status(200).json(user);
    } catch (error) {
        console.log("Error getting user:", error);
        res.status(500).json({ message: "Server error!", error: error.message});
    }
})


module.exports = router;


