import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import TextField from "@material-ui/core/TextField";
import "./App.css";

const socket = io.connect("http://localhost:4000/");
// ... (existing imports)

// ... (existing imports)

const GameComponent = ({ onSubmit, onAllResponsesSubmitted, gameState, name, onNextImage }) => {
  const [inputValue, setInputValue] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGuessing, setIsGuessing] = useState(false);

  const onInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const onSubmitClick = (e) => {
    e.preventDefault();
    onSubmit(inputValue);
    setInputValue("");
    setIsSubmitted(true);
  };

  const onGuessSubmit = (e) => {
    e.preventDefault();
    onNextImage(name, inputValue); // Send the guess to the server
    setInputValue("");
    setIsGuessing(false);
  };

  useEffect(() => {
    if (isSubmitted) {
      onAllResponsesSubmitted();
    }
  }, [isSubmitted, onAllResponsesSubmitted]);

  useEffect(() => {
    if (isGuessing) {
      // Logic to handle the guessing phase
      // For simplicity, we assume each client gets 10 seconds to guess, adjust as needed
      const guessTimer = setTimeout(() => {
        onGuessSubmit({ preventDefault: () => {} }); // Automatically submit a guess when the timer expires
      }, 10000); // 10 seconds in milliseconds

      return () => clearTimeout(guessTimer); // Clear the timer on component unmount
    }
  }, [isGuessing, onGuessSubmit]);

  return (
    <div>
      {!gameState.imageUrls ? (
        <div>
          <h1>{isSubmitted ? "Waiting for Others..." : "New Game Component"}</h1>
          {isSubmitted ? (
            <p>Your response has been submitted. Waiting for others...</p>
          ) : (
            <form onSubmit={onSubmitClick}>
              <TextField
                name="gameInput"
                onChange={onInputChange}
                value={inputValue}
                label="Enter Something"
              />
              <button type="submit">Submit</button>
            </form>
          )}
        </div>
      ) : (
        <div>
          {isGuessing ? (
            <div>
              <p>Guess the previous prompt:</p>
              <form onSubmit={onGuessSubmit}>
                <TextField
                  name="guessInput"
                  onChange={(e) => setInputValue(e.target.value)}
                  value={inputValue}
                  label="Your Guess"
                />
                <button type="submit">Submit Guess</button>
              </form>
            </div>
          ) : (
            <div>
              <p>View the next person's image and input your guess</p>
              <button onClick={() => setIsGuessing(true)}>Continue</button>
            </div>
          )}
          <img
            width="200px"
            height="200px"
            src={Object.values(gameState.imageUrls)
              .find((img) => img.name === name)?.imageUrl}
            alt={`${name}'s generated image`}
          />
        </div>
      )}
    </div>
  );
};


const App = () => {
  const [state, setState] = useState({
    message: "",
    name: "",
    roomCode: "",
    gameStarted: false,
    canJoinRoom: true,
  });
  const [chat, setChat] = useState([]);
  const [roomUsers, setRoomUsers] = useState([]);
  const [showGameComponent, setShowGameComponent] = useState(false);
  const [allResponsesSubmitted, setAllResponsesSubmitted] = useState(false);
  const [gameState, setGameState] = useState([]);

  const [roundIndex, setRoundIndex] = useState(0);
  const [allGuesses, setAllGuesses] = useState([]);

  useEffect(() => {
    // Listen for guesses from other players
    socket.on("playerGuess", ({ name, guess }) => {
      setAllGuesses((prevGuesses) => [...prevGuesses, { name, guess }]);
    });
  }, []);

  const onNextImage = (name, guess) => {
    // Send the guess to the server
    socket.emit("submitGuess", { name, guess });

    // Move to the next person's image
    setRoundIndex((prevIndex) => prevIndex + 1);

    // Check if all players have guessed for this round
    if (roundIndex === gameState.responses.length - 1) {
      // Logic to end the game or start a new round
      console.log("All players have guessed for this round");
      setAllGuesses([]); // Clear the guesses for the next round
    }
  };

  useEffect(() => {
    socket.on("message", ({ name, message }) => {
      setChat([...chat, { name, message }]);
    });

    socket.on("roomUsers", (users) => {
      setRoomUsers(users);
    });

    socket.on("alert", (message) => {
      alert(message);
      setState({ ...state, canJoinRoom: true });

      // Add a delay before allowing the user to join again
      setTimeout(() => {
        setState({ ...state, canJoinRoom: true });
      }, 3000);
    });

    socket.on("startGame", () => {
      setState({ ...state, gameStarted: true });
      setShowGameComponent(true);
    });

    socket.on("allResponsesSubmitted", (gameState) => {
      setAllResponsesSubmitted(true);
      setGameState(gameState);
    });
  }, [chat, state]);

  const onTextChange = (e) => {
    setState({ ...state, [e.target.name]: e.target.value });
  };

  const onMessageSubmit = (e) => {
    e.preventDefault();
    const { name, message } = state;
    socket.emit("message", { name, message });
    setState({ ...state, message: "" });
  };

  const onJoinRoom = (e) => {
    e.preventDefault();
    const { name, roomCode, gameStarted, canJoinRoom } = state;

    if (!gameStarted && canJoinRoom) {
      socket.emit("joinRoom", { name, roomCode });
      setState({ ...state, canJoinRoom: false });
    }
  };

  const onStartGame = () => {
    const { roomCode } = state;
    socket.emit("startGame", roomCode);
    setState({ ...state, gameStarted: true });
  };

  const onGameComponentSubmit = (inputValue) => {
    // Handle the submission of the game component input
    socket.emit("submitResponse", { name: state.name, response: inputValue });
  };

  const onAllResponsesSubmitted = () => {
    // This function is called when all users have submitted their responses
    console.log("All responses submitted!");
    setAllResponsesSubmitted(true);
  };

  const renderChat = () => {
    return chat.map(({ name, message }, index) => (
      <div key={index}>
        <h3>
          {name}: <span>{message}</span>
        </h3>
      </div>
    ));
  };

  const renderRoomUsers = () => {
    return roomUsers.map(({ id, name }, index) => (
      <div key={index}>
        <p>{name} (ID: {id})</p>
      </div>
    ));
  };

  return (
    <div className="card">
      {!showGameComponent ? (
        <div>
          <form onSubmit={onJoinRoom}>
            <h1>Join Room</h1>
            <div className="name-field">
              <TextField
                name="name"
                onChange={(e) => onTextChange(e)}
                value={state.name}
                label="Your Name"
              />
            </div>
            <div className="name-field">
              <TextField
                name="roomCode"
                onChange={(e) => onTextChange(e)}
                value={state.roomCode}
                label="Room Code"
              />
            </div>
            <button disabled={state.gameStarted || !state.canJoinRoom}>Join Room</button>
          </form>
          <button onClick={onStartGame} disabled={state.gameStarted}>
            Start Game
          </button>
        </div>
      ) : (
        <GameComponent
          onSubmit={onGameComponentSubmit}
          onAllResponsesSubmitted={onAllResponsesSubmitted}
          gameState={gameState}
          name={state.name}
          onNextImage={onNextImage}
        />
      )}
      <form onSubmit={onMessageSubmit}>
        {/* ... existing code */}
      </form>
      <div className="render-chat">
        <h1>Chat Log</h1>
        {renderChat()}
      </div>
      <div className="room-users">
        <h1>Room Users</h1>
        {renderRoomUsers()}
      </div>
    </div>
  );
};

export default App;

