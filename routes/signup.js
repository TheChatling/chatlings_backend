const express = require("express");
const mongoose = require("mongoose");
const User = require("../schemas/User");
const bcrypt = require("bcrypt");
const router = express.Router();
const uri = process.env.MONGODB_URI;
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateTokens");

router.post("/signup", async (req, res) => {
  try {
    await mongoose.connect(uri);
    const existingUser = await User.findOne({
      $or: [{ name: req.body.name }, { email: req.body.email }],
    });
    if (existingUser && existingUser.email === req.body.email) {
      return res
        .status(200)
        .json({ conflict: true, message: "This Email Is ALready In Use" });
    }
    if (existingUser && existingUser.name === req.body.name) {
      return res
        .status(200)
        .json({ conflict: true, message: "This username Is ALready In Use" });
    }

    const hashedpassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: hashedpassword,
      friends: [],
    });
    const accessToken = generateAccessToken({ id: user._id });
    const refreshToken = await generateRefreshToken({ id: user._id });

    res.setHeader("set-cookie", [refreshToken, accessToken]);
    return res.status(200).json({
      conflict: false,
      message: "The Account Was Created Successfully",
    });
  } catch {
    return res.status(500).json({
      conflict: true,
      message: "There Was A Problem Please Try Again Later",
    });
  }
});

module.exports = router;
