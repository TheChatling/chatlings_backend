const express = require("express");
const router = express.Router();
const User = require("../schemas/User");

//import middlewares
const authoriseToken = require("../middlewares/authoriseToken");

router.post("/deny_friend_request", authoriseToken, async (req, res) => {
  try {
    const id = req.body.id;

    if (!id) return res.sendStatus(400);
    const user = await User.findByIdAndUpdate(req.user._id, {
      $pull: { friend_requests: id },
    });

    // friend request was successfully denied

    user.save();
    return res.sendStatus(200);
  } catch {
    return res.sendStatus(500);
  }
});

module.exports = router;
