const express = require("express");
const router = express.Router();
const { serialize } = require("cookie");
const authoriseToken = require("../middlewares/authoriseToken");
const User = require("../schemas/User");
router.get("/logout", authoriseToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, {
      refreshToken: "",
    });
    if (!user) return res.sendStatus(400);

    res.setHeader("set-cookie", [
      serialize("refreshToken", "delete", {
        httpOnly: true,
        maxAge: 0,
        sameSite: "strict",
        path: "/",
        secure: true,
      }),
      serialize("accessToken", "delete", {
        httpOnly: true,
        maxAge: 0,
        sameSite: "strict",
        path: "/",
        secure: true,
      }),
    ]);
    return res.sendStatus(200);
  } catch {
    return res.sendStatus(500);
  }
});

module.exports = router;
