const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  friends: {
    type: [mongoose.SchemaTypes.ObjectId] || [],
    required: true,
    ref: "User",
  },
  friend_requests: {
    type: [mongoose.SchemaTypes.ObjectId] || [],
    required: true,
    ref: "User",
  },
  refreshToken: String,
});

module.exports = mongoose.model("User", userSchema);
