import { useState, useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import './Desen.css'
import Users from "../../components/Users"
import { useProjectStore } from '../../store/projectStore'

const Desen = () => {
    const { screen, startGame } = useGameStore();

    useEffect(() => {
      startGame()
    }, []);

    return (
        <>
          <div className='body'>
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
        <div className="card">
            <h1>Sǎ desenǎm</h1>
            <p>Fiecare dintre voi a primit un titlu pentru desenul sǎu...</p>
            <p>Cine nu e gata îl iau cu lopata!</p>
            <ProgressBar timeInSeconds={60} callback={() => timeOver()}/>
        </div>
    )
}


const ProgressBar = ({timeInSeconds, callback}) => {
    const [timer, setTimer] = useState(timeInSeconds * 1000)
    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((t) => {
                if (t >= 1000) {
                    return (t - 1000);
                } else {
                    console.log("gata:", t);
                    clearInterval(interval)
                    callback()
                    return 0;
                }
            })
        }, 1000);

        return () => clearInterval(interval)
    }, [])

    return (
        <>
            <div className="timer">{timer / 1000}</div>
            <div className="progress-bar">
                <div className="progress" style={{width: `${timer / (timeInSeconds * 10)}%`}}></div>
            </div>
        </>
    )
}

const GiveTitles = () => {
    const {drawing, goToVote} = useGameStore();


    return (
        <>
            <div className="card">
                <h1>Ce e asta?</h1>
                <p>Alege un titlu potrivit</p>
                <img src={drawing.image}/>
            </div>

            <ProgressBar timeInSeconds={100} callback={() => goToVote()}/>
        </>
    );
}

const Vote = () => {
    const {drawing, drawingTitles} = useGameStore();

    return (
        <>
            <div className="card">
                <h1> Voteaza titlul </h1>
                <p>Ce? Toata lumea s-a gandit la acleasi lucru?</p>
                <img src={drawing.image}/>
                <ul>
                    {drawingTitles.map((title) => (<p key={title.title}>{title.title}</p>))}
                </ul>
            </div>
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
            timer = setTimeout(() => {
                nextDrawing();
            }, 5000);
        } else {
            console.log("nextTitle?!", currentTitle);
            timer = setTimeout(() => {
                setCurrentTitle(prev => prev -1);
            }, 5000);
        }

        return () => clearTimeout(timer);   // prevent stacked timeouts
    }, [currentTitle, drawingTitles]);

    const title = drawingTitles[currentTitle];
    return (
        <>
            <div className="card">
                <h1> Rezultatele </h1>
                <p> Care o ghicit?</p>
                <img className="preview" src={drawing.image}/>
                <div>
                    <span key={title.title}>"{title.title}"</span>
                    <Users users={title.votes} useNicknames={true} extra={score} />
                </div>
            </div>
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
          }, 3000);

      return () => clearTimeout(timerx);   // prevent stacked timeouts
  }, []);
  
  console.log(users, totalScore);
  return(
    <>
      <div className="card">
          <h1> Podium </h1>
          <p> Care sta bine pe ghicit?</p>
          <div>
              <Users users={users} useNicknames={true} extra={totalScore}/>
          </div>
      </div>
    </>
  )
}


export default Desen
