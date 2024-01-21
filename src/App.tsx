import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { io } from "socket.io-client";
import socketService from './services/socketService';
import { JoinRoom } from './components/joinRoom';
import GameContext, { IGameContextProps } from './gameContext';

function App() {

  const [isInRoom, setInRoom] = useState(false)

  const connectSocket = async () => {
    const socket = await socketService.connect("http://localhost:9000").catch((err) => {
      console.log("Error: ", err)
    })
  }

  useEffect(() => {
    connectSocket();
  }, [])

  const gameContextValue: IGameContextProps = {
    isInRoom,
    setInRoom
  }

  return (
    <GameContext.Provider value={gameContextValue}>
      <div className="App">
        <h1>Welcome client</h1>
        <JoinRoom />
      </div>
    </GameContext.Provider>
  );
}

export default App;
