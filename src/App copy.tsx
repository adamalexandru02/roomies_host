import { useEffect, useRef, useState } from 'react';
import './App.css';
import avatar from './assets/images/avatar.png';
import Audio from './components/Audio';
import * as Nakama from "@heroiclabs/nakama-js";

// helper that calls the Lua RPC; pass full DataURL from canvas (data:image/png;base64,...)
function downloadImage(user_id, colletion, key, client, session) {
  if (!client) throw new Error("Client  missing");
  if (!session) throw new Error("Session missing");

  const data = {
    collection: colletion,
    key: key,
    user_id: user_id,
  }

  return client.rpc(session, "get_data", data);
}

function getRandomTitle(used: string[]) {
  const titles = ["asd","asdf","asdfg","asdfgh","asdfghj","asdfghjk","asdfghjkl"];
  const filteredTitles = titles.filter((title) => used.indexOf(title) === -1);
  const randomTitle = filteredTitles[Math.floor(Math.random() * filteredTitles.length)];

  return randomTitle;
}

const App = () => {
  const [users, setUsers] = useState([]);
  const [client, setClient] = useState<Nakama.Client | null>(null);
  const [socket, setSocket] = useState<Nakama.Socket | null>(null);
  const [session, setSession] = useState<Nakama.Session | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [readyUsers, setReadyUsers] = useState({});
  const [screen, setScreen] = useState(1);
  const [usedTitles, setUsedTitles] = useState([]);

  // Guard to prevent double-run of connect (React StrictMode / double mount)
  const hasConnected = useRef(false);
  const matchIdRef = useRef<string | null>(null);

  // Keep references for cleanup
  const socketRef = useRef<Nakama.Socket | null>(null);
  const sessionRef = useRef<Nakama.Session | null>(null);
  const clientRef = useRef<Nakama.Session | null>(null);

  useEffect(() => {
    if (hasConnected.current) return; // VERY IMPORTANT: prevents duplicate runs
    hasConnected.current = true;

    async function connect() {
      try {
        // 1. Create client
        const client = new Nakama.Client("jocuri-server-parola", "192.168.1.100", "7350", false);
        setClient(client);
        clientRef.current = client;

        // 2. Authenticate device
        let deviceId = localStorage.getItem("device_id");
        if (!deviceId) {
          deviceId = "device-" + Math.random().toString(36).substring(2, 10)
          localStorage.setItem("device_id", deviceId)

        }
        const session = await client.authenticateDevice(deviceId, true);
        setSession(session);
        sessionRef.current = session;
        console.log("Authenticated:", session.user_id);

        // 3. Create socket & connect
        const socket = client.createSocket(false, false);

        // save to refs/state before connecting event handlers to avoid races
        socketRef.current = socket;
        setSocket(socket);

        await socket.connect(session, true);
        console.log("Socket connected");

        // 4. Call create_custom_match RPC on server to create a new match (with unique room_code)
        // Guard: if roomCode already exists (in state) skip creating again
        // This avoids creating an extra match if something unexpectedly reruns
        if (!roomCode) {
          const rpcResponse = await client.rpc(session, "create_custom_match", {});
          const roomData = rpcResponse.payload; // .payload is already parsed object in newer SDKs
          console.log("Created room:", roomData.room_code, roomData.match_id);

          // store roomCode and match id
          setRoomCode(roomData.room_code);

          // 5. Join the match returned by the RPC
          // Only attempt to join if we haven't already set matchId
          if (!matchId) {
            const joinedMatch = await socket.joinMatch(roomData.match_id);
            setMatchId(joinedMatch.match_id);
            matchIdRef.current = joinedMatch.match_id;

            console.log("Joined match:", joinedMatch.match_id);

            // we assume creator = host
            setIsHost(true);
          }
        }

        // 6. Register match event handlers ONCE
        // Using function refs to avoid re-registering on re-renders
        socket.onmatchdata = (matchData) => {
          try {
            // Some SDKs provide matchData.data as ArrayBuffer or Uint8Array
            const raw = matchData.data || matchData.data_utf8 || matchData.data_raw;
            let dataObj;
            if (raw === undefined || raw === null) {
              dataObj = {};
            } else {
              // support both parsed payload or raw bytes
              if (typeof raw === "object" && !(raw instanceof ArrayBuffer) && raw.payload !== undefined) {
                // rare shape, fall back
                dataObj = raw.payload;
              } else {
                // raw bytes: decode
                try {
                  const decoded = new TextDecoder().decode(raw);
                  dataObj = decoded ? JSON.parse(decoded) : {};
                } catch (e) {
                  // if JSON.parse fails, maybe payload already parsed by SDK
                  try { dataObj = raw; } catch (_) { dataObj = {}; }
                }
              }
            }
            const opCode = matchData.op_code;
            handleMessage(opCode, dataObj);
          } catch (err) {
            console.error("Error parsing matchData:", err, matchData);
          }
        };

      socket.onmatchpresence = (presenceEvent) => {
        console.log("Presence changed:", presenceEvent.joins, presenceEvent.leaves);

        // Add new users (joins)
        if (presenceEvent.joins?.length) {
          setUsers(prev => {
            const newUsers = [...prev];
            presenceEvent.joins.forEach(user => {
              if (user.user_id === session.user_id)
                return
              // Avoid duplicates
              if (!newUsers.find(u => u.session_id === user.session_id)) {
                newUsers.push(user);
              }
            });
            return newUsers;
          });
        }

        // Remove users who left
        if (presenceEvent.leaves?.length) {
          setUsers(prev => prev.filter(u => !presenceEvent.leaves.some(l => l.session_id === u.session_id)));
        }
      };

      } catch (err) {
        console.error("Nakama connect error:", err);
      }
    }

    connect();

    // Cleanup on unmount
    return () => {
      const s = socketRef.current;
      if (s) {
        try {
          if (isHost && matchId && client && session) {
            // 🧨 Tell Nakama to kill this match
            client.rpc(session, "terminate_match", { match_id: matchId })
              .catch((err) => console.error("Terminate RPC error:", err));
          }

          s.disconnect();
          console.log("Socket disconnected.");
        } catch (e) {
          console.error("Disconnect error:", e);
        }
      }
    };
    // we only want this effect to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Message handling kept same as yours
  const handleMessage = (opCode: number, data: any) => {
    const client = clientRef.current;
    const session = sessionRef.current;

    console.log("Received message:", data);
    switch(data.type) {
      case "user_data":
        console.log(data.content);
        let updatedUsers;
        downloadImage(data.content.user_id, "images", data.content.avatar, client, session)
        .then((res) => {
          console.log(res);
            setUsers(prev => {
              const updatedUsers = prev.map((u) => {
              if (u.user_id === data.content.user_id) {
                u.nikname = data.content.nikname;
                u.avatar = res.payload.data[0].value.image;
              }
              return u;
            });
            return updatedUsers
          });
        })
        .catch((err) => {
          console.log(err);
        });
      break;

      case "start_game":
        let everbodyIn = true;
        setUsers((prev) => {
          prev.map((user) => {
            if(!user.avatar || !user.nikname) everbodyIn = false;
            
            setUsedTitles((prev) => {
              const randomTitle = getRandomTitle(prev);
              return {...prev, ...{[user.user_id]: randomTitle}};
            })
            
            return user;
          });

          if (everbodyIn) {
            const payload = { 
                  type: "game_started",
                  content: {
                    user_id: session.user_id,
                    titles: titles,
                } 
              };
              console.log(payload);
            sendMessageToClients(payload)
          } else {
            setError('We are waiting for one more')
          }
          return prev;
        })
        break;
    }
  };

  const sendMessageToClients = async (payload: any) => {
    if (!socketRef.current || !matchIdRef.current) {
      console.warn("Socket or matchId not ready");
      return;
    }

    try {
      await socketRef.current.sendMatchState(matchIdRef.current, 1, JSON.stringify(payload));
      console.log("Sent message to host");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <>
      <Audio />
      {screen === 1 && <First users={users} roomCode={roomCode} />}
      {screen === 2 && <Second />}
    </>
  );
};

const First = ({ users, roomCode }: any) => {
  return (
    <>
      <div className="card">
        <h1>Let's draw</h1>
        <h3>{roomCode || "----"}</h3>
        <p>Waiting for your friends...</p>
      </div>
      <div className="users">
        {users.map((user: any) => {
          if (user.avatar) {
            return (
              <div key={user.username} className="user">
                <img src={user.avatar} />
                <span>{user.nikname}</span>
              </div>
            )
          } else {
            return (
              <div key={user.username} className="user">
                <img src={avatar} />
                ...
              </div>
            )
          }
        })}
      </div>
    </>
  );
};

const Second = () => {
  const [timer, setTimer] = useState(60000);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev > 1000) return prev - 1000;
        clearInterval(interval);
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="card">
      <h1>Sa desenam</h1>
      <p>Fiecare dintre voi a primit un titlu pentru desenul sau...</p>
      <p>Cine nu e gata il iau cu lopata!</p>
      <div className="timer">{timer / 1000}</div>
      <div className="progress-bar">
        <div className="progress" style={{ width: `${timer / 600}%` }}></div>
      </div>
    </div>
  );
};

export default App;
