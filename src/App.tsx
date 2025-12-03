import { useState, useEffect } from 'react'
import {useProjectStore} from './store/projectStore'
import './App.css'
import Audio from './components/Audio'
import Users from './components/Users'

import Desen from './games/Desen/Desen'

import deseneaza from './assets/images/deseneaza.png'

const App = () => {
  const { connect, cleanup, screen, setScreen } = useProjectStore()

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
      {screen == 2 && <Game><Desen /></Game>}
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
      <Audio/>
    </div>
  )
}


const Connect = () => {
  const {users, roomCode, cleanup, connect} = useProjectStore()

  return (<>
    <div className='logo'></div>
    <div className={"box"}>
      
      <h1>Camera</h1>
      <div className='row ai-c mb-20 relative'>
        <h3 className="deep">{roomCode || '----'}</h3> 
        <div className='refresh' onClick={() => {cleanup(); connect();}}></div>
      </div>
      <p>Așteptǎm sa seconecteze toata lumea...</p>
    </div>
    <div className='joined-users'>
        <Users users={users} useNicknames={true}/>
    </div>
  </>)
}

const ChoseGame = () => {
  const { startGame } = useProjectStore();
  return (<>
    <div className={"box"}>
      <h1>Jocuri</h1>
      <div className="games">
        <div className="game" onClick={() => startGame()}>
          <img src={deseneaza}/>
          <span>Sa desenam</span>
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
