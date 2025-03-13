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

router.post("/login", async (req, res) => {
  try {
    await mongoose.connect(uri);
    const user = await User.findOne({ name: req.body.name });
    if (!user) {
      return res.status(403).send("Cannot find user");
    }
    if (await bcrypt.compare(req.body.password, user.password)) {
      const accessToken = await generateRefreshToken({ id: user._id });
      const refreshToken = generateAccessToken({ id: user._id });
      res.setHeader("set-cookie", [accessToken, refreshToken]);

      return res.sendStatus(200);
    } else {
      return res.status(403).send("Unmatching login credentioals");
    }
  } catch {
    return res.status(500).send();
  }
});

module.exports = router;
