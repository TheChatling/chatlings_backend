const express = require("express");
const router = express.Router();
const authoriseToken = require("../middlewares/authoriseToken");
router.get("/user", authoriseToken, (req, res) => {
  if (!req.user) return res.status(404).json({});
  res.json(req.user);
});

module.exports = router;
