const jwt = require("jsonwebtoken");
const { serialize } = require("cookie");
const User = require("../schemas/User");

function generateAccessToken(user) {
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30s",
  });
  const cookie = serialize("accessToken", "bearer " + accessToken, {
    httpOnly: true,
    maxAge: 60 * 15,
    sameSite: "strict",
    path: "/",
    secure: false,
  });
  return cookie;
}
async function generateRefreshToken(user) {
  try {
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
    const userDB = await User.findById(user.id);
    userDB.refreshToken = refreshToken;
    await userDB.save();
    const cookie = serialize("refreshToken", "bearer " + refreshToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "strict",
      path: "/",
      secure: false,
    });
    return cookie;
  } catch {}
}

module.exports = { generateAccessToken, generateRefreshToken };
