import { useProjectStore } from "../store/projectStore";
import reload from "../assets/images/refresh.svg";

const RoomCode = () => {
  const { roomCode, cleanup, connect } = useProjectStore();

  return (<>
    <div className='code mr-20 ml-20 deep'>
      <div className='icon-button mr-20' onClick={() => {cleanup(); connect();}}>
        <img src={reload} />
      </div>
      <span>{roomCode || '----'}</span> 
    </div>
  </>
  );
}
export default RoomCode


