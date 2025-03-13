const dotenv = require("dotenv");
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: envFile });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const Message = require("./schemas/Message");
const User = require("./schemas/User");

const app = express();
const port = 8080;

const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: [process.env.ALLOWED_ORIGIN, "http://localhost:4000"],
  },
});

//app uses

app.use(express.json());
app.use(
  cors({
    origin: [process.env.ALLOWED_ORIGIN, "http://localhost:4000"],
    credentials: true,
  })
);
app.use(cookieParser());

// importing routes
const signupRoute = require("./routes/signup");
const loginRoute = require("./routes/login");
const userRoute = require("./routes/user");
const logoutRoute = require("./routes/logout");
const messagesRoute = require("./routes/messages");
const friend_request_denyRoute = require("./routes/deny_friend_request");

//route app uses

app.use(signupRoute);
app.use(loginRoute);
app.use(userRoute);
app.use(logoutRoute);
app.use(messagesRoute);
app.use(friend_request_denyRoute);

app.get("/", (req, res) => {
  res.json({ message: "this backend works" });
});

io.on("connection", (socket) => {
  // joining a room
  socket.on("join_room", ({ room }) => {
    socket.join(room);
  });
  // sending friend request

  socket.on("remove_friend", async ({ userId, friendId }, cb) => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);

      const user = await User.findById(userId);
      if (!user.friends.includes(friendId)) {
        cb({ success: false, message: "The user is not in your friends list" });
        return;
      }
      user.friends = user.friends.filter(
        (item) => item.toString() !== friendId
      );
      await user.save();
      await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
      socket.to(friendId).emit("remove_friend_update", userId);
      cb({
        success: true,
        message: "Successfully removed from your friends list",
      });
    } catch {
      cb({
        success: false,
        message: "There was an error please try again later",
      });
    }
  });
  socket.on(
    "send_friend_request",
    async ({ friendName, userId, userName }, cb) => {
      try {
        await mongoose.connect(process.env.MONGODB_URI);

        const friend = await User.findOne({ name: friendName });
        if (friend.friend_requests.includes(userId)) {
          cb({
            success: false,
            message: "The user already have your friend request",
          });
          return;
        }
        friend.friend_requests = [...friend.friend_requests, userId];
        await friend.save();
        const room = friend._id.toString();

        socket.to(room).emit("receive_friend_request", userId, userName);
        cb({
          success: true,
          message: "Successfully sent a friend request to: " + friend.name,
        });
      } catch {
        cb({
          success: false,
          message: "There was an error please try again later",
        });
      }
    }
  );

  socket.on("accept_friend_request", async ({ userId, friendId }, cb) => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      const user = await User.findById(userId);
      if (user.friends.find((item) => item.toString() === friendId)) {
        cb({
          success: false,
          message: "The user is already in your friends List",
        });
        return;
      }
      const friend = await User.findByIdAndUpdate(friendId, {
        $push: { friends: userId },
      });
      if (!friend) {
        cb({
          success: false,
          message: "Couldn't find the user",
        });
        return;
      }
      user.friend_requests = user.friend_requests.filter(
        (item) => item.toString() !== friendId
      );
      user.friends.push(friend._id);
      await user.save();
      socket
        .to(friendId)
        .emit("add_friend", { name: user.name, _id: user._id });
      cb({
        success: true,
        message: "Seccussfully added the friend to your list",
      });
    } catch {
      cb({
        success: false,
        message: "The was an error please try again later",
      });
    }
  });
  // sending messages
  socket.on(
    "send_message",
    async ({ room, sender, recipient, status, date, message }) => {
      try {
        await mongoose.connect(process.env.MONGODB_URI);
        await Message.create({
          room,
          sender,
          recipient,
          status,
          date,
          message,
        });
        socket.to(room).emit("receive_message", room, sender, date, message);

        const messageCount = await Message.countDocuments({ room });
        if (messageCount > 200) {
          const messagesToRemove = Math.floor(messageCount / 2);
          const oldestMessages = await Message.find({ room })
            .sort({ date: 1 })
            .limit(messagesToRemove);
          const idsToRemove = oldestMessages.map((item) => item.id);
          await Message.deleteMany({ _id: { $in: idsToRemove } });
        }
      } catch {}
    }
  );

  // updating message status
  socket.on("send_update", async ({ room, userId }) => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      await Message.updateMany(
        { room, sender: { $ne: userId } },
        { $set: { status: "seen" } }
      );
      socket.to(room).emit("receive_update", room, userId);
    } catch {}
    // update messages in the database
  });
});

server.listen(port);
