import {useState, useEffect} from 'react'
import {useGameStore} from './store/gameStore'
import './App.css'
import avatar from './assets/images/avatar.png'
import Audio from './components/Audio'

const App = () => {
    const {connect, cleanup, screen} = useGameStore()

    useEffect(() => {
        connect()
        return () => cleanup()
    }, [connect, cleanup])

    return (
        <>
            <Audio/>
            <Users/>
            {screen === 1 && <Connect/>}
            {screen === 2 && <Titles/>}
            {screen === 3 && <GiveTitles/>}
            {screen === 4 && <Vote/>}
            {screen === 5 && <Score/>}
        </>
    )
}

const Users = () => {
    const {users} = useGameStore();
    return (
        <div className='head-users'>
            <div className="users">
                {users.map((user) => (
                    <div key={user.username} className="user">
                        <img src={user.avatar || avatar} alt="avatar"/>
                        <span>{user.nickname || '...'}</span>
                    </div>
                ))}
            </div>
        </div>

    )
}

const Connect = () => {
    const {users, roomCode} = useGameStore()

    return (<>
        <div className="card">
            <h1>Sǎ desenǎm</h1>
            <h3>{roomCode || '----'}</h3>
            <p>Așteptǎm autoportretele...</p>
        </div>
        <div className="users">
            {users.map((user) => (
                <div key={user.username} className="user">
                    <img src={user.avatar || avatar} alt="avatar"/>
                    <span>{user.nickname || '...'}</span>
                </div>
            ))}
        </div>
    </>)
}

const Titles = () => {
    const {timeOver} = useGameStore();

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
            </div>
            <img src={drawing.image}/>

            <ProgressBar timeInSeconds={10} callback={() => goToVote()}/>
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
    const {drawing, drawingTitles, nextDrawing} = useGameStore();
    const [currentTitle, setCurrentTitle] = useState(0);

    useEffect(() => {
        let timer;

        if (drawingTitles.length === 0) return;

        if (currentTitle === drawingTitles.length - 1) {
            console.log("nextdrawing?!", currentTitle);
            timer = setTimeout(() => {
                nextDrawing();
            }, 5000);
        } else {
            console.log("nextTitle?!", currentTitle);
            timer = setTimeout(() => {
                setCurrentTitle(prev => prev + 1);
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
                    <div className='users'>
                        {title.votes.map((user) => {
                            return (
                                <div className='user' key={user.user_id}>
                                    <img src={user.avatar}/>
                                    {user.nickname}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}


export default App
