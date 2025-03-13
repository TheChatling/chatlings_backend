const express = require("express");
const router = express.Router();
const authoriseToken = require("../middlewares/authoriseToken");
const mongoose = require("mongoose");
const Message = require("../schemas/Message");
router.post("/messages", async (req, res) => {
  try {
    if (!req.body.id) return res.status(404).json({});

    await mongoose.connect(process.env.MONGODB_URI);
    const userMessages = await Message.find({
      $or: [{ sender: req.body.id }, { recipient: req.body.id }],
    });
    res.json({ messages: userMessages });
  } catch (error) {
    res.status(400).json({ messages: [] });
  }
});

module.exports = router;
