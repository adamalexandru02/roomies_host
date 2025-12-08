import { useSound } from "./Sound/useSound";
import soundOn from '../assets/images/mute.svg'
import soundOff from '../assets/images/volume.svg'
import exit from '../assets/images/exit.svg'

const Audio = () => {
  const { muted, toggleMute } = useSound();

  return (<>
      <div className="icon-button margin-left-auto" onClick={toggleMute}>
        {muted ? <img src={soundOn} /> : <img src={soundOff} />}
      </div>
      <div className="icon-button ml-20 " onClick={() => window.location.reload()}>
        <img src={exit}/>
      </div>
    </>
  );
}
export default Audio