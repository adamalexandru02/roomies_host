import { useEffect, useRef, useState } from 'react'

import backgroundMusic from '../assets/music/funny-cartoon-421644.mp3'
import soundOn from '../assets/images/mute.svg'
import soundOff from '../assets/images/volume.svg'

const Audio = () => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.log(err);
        console.log("Autoplay blocked, wait for user gesture.");
      }
    }
  }
    
  return (<>
    <div className="sound"onClick={toggleMusic}>
      <audio ref={audioRef} src={backgroundMusic} />
      {isPlaying ? <img src={soundOn} /> : <img src={soundOff} />}
    </div>
    <div style={{width: 40, height: 40, marginLeft: 20, background: 'red'}} onClick={() => window.location.reload()}></div>

  </>

  )
}

export default Audio;