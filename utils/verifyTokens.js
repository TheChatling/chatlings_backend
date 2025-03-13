const User = require("../schemas/User");
const jwt = require("jsonwebtoken");

async function verifyRefreshToken(refreshToken) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, payload) => {
        try {
          if (err) return resolve(undefined);
          const user = await User.findById(payload.id)
            .populate("friends", "name")
            .populate("friend_requests", "name");
          if (!user) return resolve(undefined);

          return resolve(user);
        } catch {
          return resolve(undefined);
        }
      }
    );
  });
}
async function verifyAccessToken(accessToken) {
  new Promise((resolve, reject) => {
    jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET,
      async (err, payload) => {
        try {
          if (err) return resolve(undefined);
          const user = await User.findById(payload.id).populate(
            "friends",
            "name"
          );
          if (!user) {
            return resolve(undefined);
          }
          return resolve(user);
        } catch {
          return resolve(undefined);
        }
      }
    );
  });
}

module.exports = { verifyRefreshToken, verifyAccessToken };
