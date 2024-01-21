const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});

let responses = {}; // To store user responses
let allGuesses = [];
let roomCode = "";

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ name, roomCode }) => {
    const { gameStarted } = getRoomInfo(roomCode);
    this.roomCode = roomCode;

    if (!gameStarted) {
      socket.join(roomCode);
      console.log(`User ${name} (${socket.id}) joined room ${roomCode}`);

      // Store the user's name on the socket
      socket.name = name;

      const roomUsers = getRoomUsers(roomCode);
      io.to(roomCode).emit("roomUsers", roomUsers);

      socket.on("message", ({ name, message }) => {
        io.to(roomCode).emit("message", { name, message });
      });

      socket.on("submitResponse", async ({ name, response }) => {
        // Store the user's response
        responses[name] = response;

        // Check if all responses are submitted
        const allResponsesSubmitted = checkAllResponsesSubmitted(roomCode);
        if (allResponsesSubmitted) {
          const imageUrls = await generateImages(responses);
          console.log(imageUrls)

          // Now you can store the game state using the 'responses' object
          const gameState = {
            responses: { ...responses },
            imageUrls: { ...imageUrls}
            // Add any additional game state information if needed
          };

          io.to(roomCode).emit("allResponsesSubmitted", gameState);

          console.log("Game state:", gameState);

        }
      });

      socket.on("disconnect", () => {
        const roomUsers = getRoomUsers(roomCode);
        io.to(roomCode).emit("roomUsers", roomUsers);
      });
    } else {
      socket.emit("alert", "The game has already started. You cannot join the room.");
    }
  });

  socket.on("startGame", (roomCode) => {
    const { room } = getRoomInfo(roomCode);

    if (room) {
      room.gameStarted = true;
      io.to(roomCode).emit("startGame");
    }
  });
  socket.on("submitGuess", ({ name, guess }) => {
    // Broadcast the guess to all players in the room
    io.to(roomCode).emit("playerGuess", { name, guess })
    allGuesses.push({name, guess});
    console.log(allGuesses)
  });
});

function getRoomUsers(roomCode) {
  const room = io.sockets.adapter.rooms.get(roomCode);
  if (room) {
    return Array.from(room).map((socketId) => ({
      id: socketId,
      name: io.sockets.sockets.get(socketId).name,
    }));
  }
  return [];
}

function getRoomInfo(roomCode) {
  const room = io.sockets.adapter.rooms.get(roomCode);
  return {
    room: room,
    gameStarted: room ? room.gameStarted : false,
  };
}

function checkAllResponsesSubmitted(roomCode) {
  const roomUsers = getRoomUsers(roomCode);
  for (const user of roomUsers) {
    if (!responses.hasOwnProperty(user.name)) {
      return false;
    }
  }
  return true;
}

async function generateImages(responses) {
  const imageUrls = [];

  const dalle2ApiEndpoint = "http://127.0.0.1:5000/generate-image?prompt=";

  for (const [name, prompt] of Object.entries(responses)) {
    try {
      const response = await axios.get(dalle2ApiEndpoint + prompt)
      console.log(response.data[0])
      imageUrl = response.data[0]
      imageUrls.push({name, imageUrl});
    } catch (error) {
      console.error(`Error generating image for ${name}:`, error.message);
      imageUrls.push({ name, imageUrl: "" });
    }
  }

  return imageUrls;
}



const PORT = process.env.PORT || 4000;

http.listen(PORT, () => {
  console.log("Server is up and running on port numner " + PORT);
});
