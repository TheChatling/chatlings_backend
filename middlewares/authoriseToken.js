const mongoose = require("mongoose");
const { generateAccessToken } = require("../utils/generateTokens");
const {
  verifyRefreshToken,
  verifyAccessToken,
} = require("../utils/verifyTokens");
const { serialize } = require("cookie");

async function authoriseToken(req, res, next) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    if (req.cookies["accessToken"]) {
      //accessToken was found
      const accessToken = req.cookies["accessToken"].split(" ")[1];
      if (await verifyAccessToken(accessToken)) {
        const user = verifyAccessToken(accessToken);
        req.user = {
          name: user.name,
          email: user.email,
          friends: user.friends,
          _id: user._id,
        };

        next();
      }
    }
    // did not found accessToken or it was invalid
    if (!req.cookies["refreshToken"]) return res.sendStatus(404);
    const refreshToken = req.cookies["refreshToken"].split(" ")[1];

    const user = await verifyRefreshToken(refreshToken);
    //the user does not have a refreshtoken
    if (!user) return res.sendStatus(401);

    //the refreshtoken was invalid
    if (!user.refreshToken || user.refreshToken !== refreshToken) {
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
      return res.sendStatus(401);
    }
    //the refreshtoken was valid
    const accessToken = generateAccessToken({ id: user.id });
    res.setHeader("set-cookie", [accessToken]);
    req.user = {
      name: user.name,
      email: user.email,
      friends: user.friends,
      friend_requests: user.friend_requests,
      _id: user._id,
    };
    next();
  } catch {
    res.sendStatus(500);
  }
}
module.exports = authoriseToken;
