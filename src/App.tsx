import { useState, useEffect } from 'react'
import { useProjectStore } from './store/projectStore'
import './App.css'

//  Componente
import Audio from './components/Audio'
import Users from './components/Users'
import RoomCode from './components/RoomCode'

// Jocuri
import Desen from './games/Desen/Desen'
import Dannegru from './games/Dannegru/Dannegru'

import deseneaza from './assets/images/deseneaza.png'

const App = () => {
  const { connect, cleanup, screen, game, setScreen } = useProjectStore()

  useEffect(() => {
    connect()
    return () => cleanup()
  }, [connect, cleanup])

  return (
    <>
      <Header/>
      <Intro />
      {screen == 0 && <Connect />}
      {screen == 1 && <ChoseGame />}
      {screen == 2 && <Game>
        {game === "desen" && <Desen />}
        {game === "dannegru" && <Dannegru />}
      </Game>}
    </>
  )
}

const Intro = () => {
  const [fade, setFade] = useState(false);

  // 1. Read Zustand store once at the top (correct usage)
  const {roomCode, isConected, setScreen} = useProjectStore();

  useEffect(() => {
    if (!roomCode) return;
    
    // 2. Delay fade by 5 seconds
    const timeout = setTimeout(() => {
      setFade(true);
    }, 2000);

    // 3. Cleanup if component unmounts or roomCode changes
    return () => {clearTimeout(timeout);}
  }, [roomCode]);  // runs only when roomCode changes

  return (
    <div className={`intro ${fade ? "fade" : ""}`}>
      <div className={"R"}></div>
      <div className={"O"}></div>
      <div className={"O2"}></div>
      <div className={"M"}></div>
      <div className={"I"}></div>
      <div className={"E"}></div>
      <div className={"S"}></div>
    </div>
  )
}

const Header = () => {
  const { users } = useProjectStore();

  return (
    <div className='header'>
      <Users users={users}  />
      <RoomCode />
      <Audio/>
    </div>
  )
}


const Connect = () => {
  const { users } = useProjectStore()

  return (<>
    <div className='logo'></div>
    <div className={"box"}>
      
      <h1>Camera</h1>
      <RoomCode />
      <p className='mt-20'>Așteptǎm sa seconecteze toata lumea...</p>
    </div>
    <div className='joined-users'>
        <Users users={users} useNicknames={true}/>
    </div>
  </>)
}

const ChoseGame = () => {
  const { selectGame } = useProjectStore();
  return (<>
    <div className={"box"}>
      <h1>Jocuri</h1>
      <div className="games">
        <div className="game" onClick={() => selectGame("desen")}>
          <img src={deseneaza}/>
          <span>Sa desenam</span>
        </div>
        <div className="game" onClick={() => selectGame("dannegru")}>
          <img src={deseneaza}/>
          <span>Dan Negru</span>
        </div>
      </div>
    </div>
  </>)
}

const Game = ({ children }) => {
  return (
    <div className="game_preview">
      {children}
    </div>
  );
};

export default App
