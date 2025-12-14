import { useEffect, useRef } from 'react'
import { useGameStore } from './store/gameStore'
import './Dannegru.css'
import Users from "../../components/Users"
import Card from "../../components/Card"
import GameStart from "../../components/GameStart"
import ProgressBar from "../../components/ProgressBar"
import type { ProgressBarHandle } from "../../components/ProgressBar"
import { useProjectStore } from '../../store/projectStore'

// Sound
import soundManager from '../../components/Sound/SoundManager';
import dingSound from './assets/sounds/ding.mp3';
import musicSound from './assets/sounds/music.mp3';

const Dannegru = () => {
    const { screen, startGame } = useGameStore();

    useEffect(() => {
      // startGame();
      // soundManager.playMusic(); // optional auto-play
    }, []);

    // sound effects
    soundManager.loadSound("ding", dingSound);
    // background music
    soundManager.loadMusic(musicSound);

    return (
        <>
          <div className='dannegru'>
            {screen === -1 && <GameStart 
              title="Sǎ Dannegruǎm" 
              buttonClassName="button-Dannegru"
              onStart={startGame}
            />}
            {screen === 0 && <Word/>}
            {screen === 1 && <TotalScore/>}
          </div>
        </>
    )
}

const Word = () => {
  const {words, definition, revealed, currentWord, wordCount, score, pickWord} = useGameStore();
  const { users } = useProjectStore();
  const progressBar = useRef<ProgressBarHandle>(null);
  console.log({words, currentWord, wordCount, score});


  useEffect(() => {
    progressBar.current?.reset()
  }, [currentWord])
  return (
    <Card>
      <h1>Jocul cuvintelor</h1>

      <div>
        <p>Definiție:</p>
        <p>{definition}</p>
      </div>

      <div>
        {[...currentWord].map((ch, i) => (
          <span key={i}>
            {revealed.includes(i) ? ch : " "}
          </span>
        ))}
      </div>
      <ProgressBar ref={progressBar} timeInSeconds={100} callback={() => pickWord()} playTickSound={true}/>

      <Users users={users} animation="" useNicknames={true} extra={score}/>
    </Card>
  );
}

// const Word  = () => {
//   const { word } = useGameStore();
//   // Mock dictionary: cuvant -> definitie
 

//   const allWords = Object.keys(DICT);

//   const [used, setUsed] = useState([]);
//   const [currentWord, setCurrentWord] = useState("");
//   const [definition, setDefinition] = useState("");
//   const [guess, setGuess] = useState("");
//   const [revealed, setRevealed] = useState([]);
//   const [timer, setTimer] = useState(30);
//   const [score, setScore] = useState(0);
//   const [wordCount, setWordCount] = useState(0);

//   const pickWord = useCallback(() => {
//     const level = Math.floor(wordCount / 5) + 1;
//     const targetLength = 3 + level;

//     const filtered = allWords.filter((w) => w.length === targetLength);
//     const words = filtered.length ? filtered : allWords;

//     let usedFiltered = used.filter((w) => words.includes(w));
//     if (usedFiltered.length === words.length) usedFiltered = [];

//     const remaining = words.filter((w) => !usedFiltered.includes(w));
//     const next = remaining[Math.floor(Math.random() * remaining.length)];

//     setCurrentWord(next);
//     setDefinition(DICT[next]);
//     setUsed((u) => [...u, next]);
//     setRevealed([]);
//     setGuess("");
//     setTimer(30);
//     setWordCount((c) => c + 1);
//   }, [used, allWords, wordCount]);

//   useEffect(() => { pickWord(); }, []);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setTimer((t) => {
//         if (t <= 1) {
//           pickWord();
//           return 30;
//         }
//         return t - 1;
//       });
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [pickWord]);

//   const revealRandomLetter = () => {
//     const indexes = [...currentWord].map((_, i) => i);
//     const remaining = indexes.filter((i) => !revealed.includes(i));
//     if (!remaining.length) return;

//     const pick = remaining[Math.floor(Math.random() * remaining.length)];
//     setRevealed((r) => [...r, pick]);
//     setScore((s) => s - 1000);
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (guess.toLowerCase() === currentWord.toLowerCase()) {
//       setScore((s) => s + currentWord.length * 500);
//       pickWord();
//     }
//   };

//   return (
//     <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
//       <h1 style={{ fontSize: 28, fontWeight: "bold" }}>Jocul cuvintelor</h1>

//       <p style={{ fontSize: 20, fontWeight: "bold", textAlign: "center" }}>Scor: {score}</p>
//       <p style={{ textAlign: "center", opacity: 0.7 }}>
//         Dificultate: lungime {3 + Math.floor(wordCount / 5) + 1}
//       </p>

//       <div style={{ padding: 15, border: "1px solid #ccc", borderRadius: 10 }}>
//         <p style={{ fontWeight: "bold" }}>Definiție:</p>
//         <p>{definition}</p>
//       </div>

//       <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 15 }}>
//         {[...currentWord].map((ch, i) => (
//           <span key={i} style={{ borderBottom: "2px solid black", width: 20, textAlign: "center" }}>
//             {revealed.includes(i) ? ch : " "}
//           </span>
//         ))}
//       </div>

//       <p style={{ textAlign: "center", marginTop: 10 }}>Timp rămas: {timer}s</p>

//       <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 10 }}>
//         <input
//           style={{ padding: 8, border: "1px solid #aaa", borderRadius: 5 }}
//           placeholder="Ghicește cuvântul"
//           value={guess}
//           onChange={(e) => setGuess(e.target.value)}
//         />
//         <button style={{ padding: "8px 15px", border: "none", background: "#1e90ff", color: "white", borderRadius: 5 }}>
//           Trimite
//         </button>
//       </form>

//       <button
//         onClick={revealRandomLetter}
//         style={{ marginTop: 15, width: "100%", padding: 10, background: "green", color: "white", border: "none", borderRadius: 5 }}
//       >
//         Arată o literă (-1000p)
//       </button>
//     </div>
//   );
// }

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


export default Dannegru
