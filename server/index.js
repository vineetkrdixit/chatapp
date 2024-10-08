const express = require("express");
const http = require("http"); // Import http module
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const PORT = 4000;

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Create an HTTP server
const server = http.createServer(app);

// Create a new instance of socket.io, passing the server
const io = new Server(server);

// Listen for socket connections
// io.on("connection", (socket) => {
//   console.log("A user connected with ID:", socket.id);

//   // Optional: handle disconnection
//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });

// io.on("connection", (socket) => {
//   console.log(`A user connected with ID: ${socket.id}`);

//   // Listen for message from client
//   socket.on("sendMessage", (message) => {
//     console.log(`Message received: ${message.text} from ${message.user._id}`);
    
//     // Add createdAt timestamp to message
//     const messageWithTimestamp = {
//       ...message,
//       createdAt: new Date(),
//     };

//     // Broadcast the message to all connected clients (including the sender)
//     io.emit("message", messageWithTimestamp);
//   });

io.on("connection", (socket) => {
  console.log(`A user connected with ID: ${socket.id}`);

  // Listen for messages from the client
  socket.on("sendMessage", (message) => {
    console.log(`Message received from ${message.user._id}: ${message.text}`);
    
    // Broadcast the message to all connected clients
    io.emit("message", {
      _id: new Date().getTime(), // Unique ID for the message
      text: message.text,
      createdAt: new Date(),
      user: {
        _id: message.user._id,
        name: message.user.name
      }
    });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Example route
app.get("/api", (req, res) => {
  res.json({ message: "API is working" });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});




