import React, { useContext, useState } from "react";
import gameContext from "../../gameContext";

interface IJoinRoomProps {

}

export function JoinRoom(props: IJoinRoomProps) {
  
  const [roomName, setRoomName] = useState("");

  const { setInRoom, isInRoom } = useContext(gameContext)

  const handleInputChange = (e: React.ChangeEvent<any>) => {
    const val = e.target.value;
    setRoomName(val);
  }

  const handleJoin = () => {

  }
  
  return (
    <div>
      <input onChange={(e) => handleInputChange(e)} /> 
      <button onClick={() => console.log("join")}>
        yo        
      </button>
    </div>
  )
  

}