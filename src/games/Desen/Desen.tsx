import { useState, useEffect, useMemo } from 'react'
import { useGameStore } from './store/gameStore'
import './Desen.css'
import Users from "../../components/Users"
import Card from "../../components/Card"
import GameStart from "../../components/GameStart"
import ProgressBar from "../../components/ProgressBar"
import { useProjectStore } from '../../store/projectStore'

// Sound
import soundManager from '../../components/Sound/SoundManager';
import ticSound from './assets/sounds/tic.mp3';
import tacSound from './assets/sounds/tac.mp3';
import clapsSound from './assets/sounds/claps.mp3';
import musicSound from  './assets/sounds/music.mp3';
import wrongSound from './assets/sounds/wrong.mp3';

const Desen = () => {
    const { screen, startGame } = useGameStore();

    useEffect(() => {
      // startGame();
      // soundManager.playMusic(); // optional auto-play
    }, []);

    // sound effects
    soundManager.loadSound("claps", clapsSound);
    soundManager.loadSound("wrong", wrongSound);
    soundManager.loadSound("tic", ticSound);
    soundManager.loadSound("tac", tacSound);
    // background music
    soundManager.loadMusic(musicSound);

    return (
        <>
          <div className='desen'>
            {screen === -1 && <GameStart 
              title="Sǎ Desenǎm" 
              buttonClassName="button-Desen"
              onStart={startGame}
            />}
            {screen === 0 && <Titles/>}
            {screen === 1 && <GiveTitles/>}
            {screen === 2 && <Vote/>}
            {screen === 3 && <Score/>}
            {screen === 4 && <TotalScore/>}
          </div>
        </>
    )
}

const Titles = () => {
    const { timeOver } = useGameStore();

    return (
        <Card>
            <h1>Sǎ Desenǎm</h1>
            <p>Fiecare dintre voi a primit un titlu pentru Desenul sǎu...</p>
            <p>Cine nu e gata îl iau cu lopata!</p>
            <ProgressBar timeInSeconds={100} callback={() => timeOver()} playTickSound={true}/>
        </Card>
    )
}

const GiveTitles = () => {
    const {drawing, goToVote} = useGameStore();


    return (
        <>
            <Card>
                <h1>Ce e asta?</h1>
                <p>Alege un titlu potrivit</p>
                <img src={drawing.image}/>
            </Card>

            <ProgressBar timeInSeconds={60} callback={() => goToVote()} playTickSound={true}/>
        </>
    );
}

const Vote = () => {
    const {drawing, drawingTitles, goToScore} = useGameStore();

    const shuffledTitles = useMemo(() => {
      return [...drawingTitles].sort(() => Math.random() - 0.5);
    }, [drawingTitles]);

    return (
        <>
            <Card>
                <h1> Voteaza titlul </h1>
                <p>Ce? Toata lumea s-a gandit la acleasi lucru?</p>
                <img src={drawing.image}/>
                <div className='titles'>
                    {shuffledTitles.map((title) => (<p key={title.title}>{title.title}</p>))}
                </div>
                <ProgressBar timeInSeconds={60} callback={() => goToScore()} playTickSound={true}/>
            </Card>
        </>
    );
}

const Score = () => {
    const { drawing, drawingTitles, score, nextDrawing } = useGameStore();
    const [currentTitle, setCurrentTitle] = useState(drawingTitles.length - 1);

    useEffect(() => {
        let timer;

        if (drawingTitles.length === 0) return;

        if (currentTitle === 0) {
            console.log("nextdrawing?!", currentTitle);
            soundManager.playSound("claps")
            timer = setTimeout(() => {
                nextDrawing();
            }, 5000);
        } else {
            console.log("nextTitle?!", currentTitle);
            soundManager.playSound("wrong")
            timer = setTimeout(() => {
                setCurrentTitle(prev => prev -1);
            }, 5000);
        }

        return () => clearTimeout(timer);   // prevent stacked timeouts
    }, [currentTitle, drawingTitles]);

    const title = drawingTitles[currentTitle];
    return (
        <>
            <Card className="" style={{minWidth: '50vw'}}>
                <h1> Rezultatele </h1>
                <p> Care o ghicit?</p>
                <img className="preview" src={drawing.image}/>
                <div className='titles'>
                  <p key={title.title}>"{title.title}"</p>
                </div>

                <div style={{height: 140}}>
                    <Users users={title.votes} animation={"buble"} showWithDelay={300} useNicknames={true} extra={score} />
                </div>
            </Card>
        </>
    );
}

const TotalScore = () => {
  const { users } = useProjectStore();
  const { totalScore, sendRestart } = useGameStore();


    useEffect(() => {
      let timerx = setTimeout(() => {
            console.log("ce?!");
              sendRestart()
          }, users.length * 1500 );

      return () => clearTimeout(timerx);   // prevent stacked timeouts
  }, []);
  
  console.log(users, totalScore);
  return(
    <>
      <Card>
          <h1> Podium </h1>
          <p> Care sta bine pe ghicit?</p>
          <div>
              <Users users={users} animation={"buble"} showWithDelay={1000} useNicknames={true} extra={totalScore}/>
          </div>
      </Card>
    </>
  )
}


export default Desen
