import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { io } from "socket.io-client";

function App() {

  const connect = () => {
    const socket = io("http://localhost:9000");
    
  }

  useEffect(() => {
    connect();
  }, [])

  return (
    <div className="App">
      <h1>Welcome client</h1>
    </div>
  );
}

export default App;
