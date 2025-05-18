const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router();
const redis = require("redis");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/UserModel");
const redisClient = require('../redisClient');

(async () => {
  await redisClient.set('testKey', 'Hello Redis!', { EX: 10 }); // 10 giây: Test môi trường Redis
  const value = await redisClient.get('testKey');
  console.log(value); // Hello Redis!
})();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME, // ví dụ: yourgmail@gmail.com
    pass: process.env.EMAIL_PASSWORD  // mật khẩu ứng dụng (app password)
  }
});

// 1. Request password reset
router.post("/request-reset-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found." });

  // Check rate limit (1 request per 60s)
  const lastRequestKey = `reset:limit:${email}`;
  const lastRequest = await redisClient.get(lastRequestKey);
  if (lastRequest) {
    return res.status(429).json({ message: "Please wait before requesting again." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenKey = `reset:token:${token}`;
  await redisClient.set(tokenKey, email, { EX: 600 }); // valid for 10 minutes
  await redisClient.set(lastRequestKey, Date.now(), { EX: 60 });

  // Send email
  const resetLink = `${process.env.REACT_APP_BASE_FE}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: "Online Learning - Đặt lại mật khẩu",
    text: `Nhấn vào đây để đặt lại mật khẩu của bạn: ${resetLink}`,
    html: `<p>Nhấn vào <a href="${resetLink}">đây</a> để đặt lại mật khẩu của bạn.</p>`,
  });

  res.json({ message: "Reset link sent successfully." });
});

// 2. Reset password with token
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Session expired, please try again." });
  }

  if (!newPassword) {
    return res.status(400).json({ message: "New password are required." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const email = await redisClient.get(`reset:token:${token}`);
  if (!email) {
    return res.status(400).json({ message: "Invalid or expired token." });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  await redisClient.del(`reset:token:${token}`);

  res.json({ message: "Password reset successful." });
});

module.exports = router;