import {create} from 'zustand'
import { persist } from 'zustand/middleware'

import * as Nakama from "@heroiclabs/nakama-js"

export const useGameStore = create((set, get) => ({
    client: null,
    socket: null,
    session: null,
    users: [],
    matchId: null,
    roomCode: null,
    isHost: false,
    screen: 1,
    drawings: [],
    drawingTitles: [],
    drawingTurn: 0,
    score: {},
    totalScore: {},


    // 🔥 titluri disponibile & folosite
    titles: [
        "pisică în pantofi",
        "extraterestru în metrou",
        "bătrân pe skateboard",
        "câine care pictează",
        "broască la birou",
        "robot la nuntă",
        "om de zăpadă la plajă",
        "vacă DJ",
        "fantomă la dentist",
        "pui de dinozaur gamer"
    ],
    usedTitles: [],
    currentTitles: {},
    isConnecting: false,
    isConnected: false,
    handlersRegistered: false,

    setUsers: (users) => set({users}),
    updateUser: (userId, data) => {
        const users = get().users.map(u => u.user_id === userId ? {...u, ...data} : u)
        set({users})
    },

    // 🔄 random title helper
    getRandomTitle() {
        const {titles, usedTitles} = get()
        const available = titles.filter(t => !usedTitles.includes(t))
        if (available.length === 0) {
            console.warn("⚠️ Nu mai sunt titluri disponibile, se reia lista!")
            set({usedTitles: []})
            return titles[Math.floor(Math.random() * titles.length)]
        }
        const chosen = available[Math.floor(Math.random() * available.length)]
        set({usedTitles: [...usedTitles, chosen]})
        return chosen
    },

    updateDrawings(drawing) {
        const drawings = [...get().drawings, drawing];
        set({drawings});
    },

    async timeOver() {
        await get().sendMessageToClients({
            type: 'time_over',
        });
        setTimeout(() => get().createTitles(0), 5000);
    },

    async createTitles(turn) {
        console.log("ha?", {
            type: 'create_titles',
            turn
        })
        const currentDrawing = get().drawings[turn];

        await get().sendMessageToClients({
            type: 'create_titles',
            owner: currentDrawing.user_id
        });
        console.log("aici", get().drawings[turn]);
        set({
            screen: 3,
            drawing: currentDrawing,
            drawingTurn: turn,
            drawingTitles: [{title: currentDrawing.title, votes: []}]
        })
    },

    async goToVote() {
        await get().sendMessageToClients({
            type: 'start_vote',
            drawingTitles: get().drawingTitles
        });
        set({screen: 4})
    },

    async goToScore() {
        await get().sendMessageToClients({
            type: 'displaying_score',
            drawingTitles: get().drawingTitles
        });
        set({screen: 5})
    },

    async nextDrawing() {
        const turn = get().drawingTurn + 1
        if (turn < get().users.length) {
            console.log(turn);
            await get().createTitles(turn)
        } else {
            console.log("s-o terminat");
            set({screen: 6})
            // arata scorul total!
        }
    },

    async handleMessage(matchData) {
        const client = get().client
        const session = get().session
        if (!client || !session) return

        let data
        try {
            const raw = matchData.data || matchData.data_utf8
            data = JSON.parse(new TextDecoder().decode(raw))
        } catch {
            data = {}
        }

        console.log("📩 Received:", data)

        switch (data.type) {
            case "user_data": {
                const content = data.content
                const res = await client.rpc(session, "get_data", {
                    collection: "images",
                    key: content.avatar,
                    user_id: content.user_id,
                })
                get().updateUser(content.user_id, {
                    nickname: content.nickname,
                    avatar: res.payload.data[0].value.image,
                })
                break
            }

            case "user_drawing": {
                const {client, session} = get()
                const content = data.content

                const res = await client.rpc(session, "get_data", {
                    collection: "images",
                    key: content.drawing,
                    user_id: content.user_id,
                });


                get().updateDrawings({
                    user_id: content.user_id,
                    title: content.title,
                    image: res.payload.data[0].value.image,
                })
                console.log("ha?", get().drawings.length, get().users.length)
                if (get().drawings.length === get().users.length) {
                    get().createTitles(0)
                }
                break
            }

            case "start_game": {
                const {users, getRandomTitle} = get()
                if (!users.length) {
                    console.warn("⚠️ No users yet!")
                    return
                }

                // 🔥 alegem câte un titlu unic pentru fiecare jucător
                const titlesForUsers = {}
                users.forEach(user => {
                    const title = getRandomTitle()
                    titlesForUsers[user.user_id] = title
                })

                // salvăm în store
                set({currentTitles: titlesForUsers})

                console.log("🎨 Titluri generate:", titlesForUsers)

                // trimitem mesajul către toți jucătorii
                const payload = {
                    type: "game_started",
                    content: {
                        titles: titlesForUsers,
                        started_by: session.user_id,
                    }
                }
                console.log(payload)
                set({screen: 2})
                await get().sendMessageToClients(payload)
                break
            }

            case "set_title": {
                const content = data.content

                console.log(get().drawingTitles);
                set({drawingTitles: [...get().drawingTitles, {title: content.title, owner: content.user, votes: []}]});
                if (get().drawingTitles.length === get().users.length) {
                    get().goToVote();
                }
                break;
            }

            case "vote_title": {
                const content = data.content;
                const user = get().users.filter(u => u.user_id = content.user_id)[0];
                const score = get().score;
                let countVotes = 0;
                const titles = get().drawingTitles.map((t) => {
                    if (t.title === content.title) {
                        console.log('owner?', t.owner);
                        console.log('currentTitle', get().drawingTitles[0]);
                        console.log(content.title);
                        console.log(t.votes);
                        if (get().drawingTitles[0] === content.title) {
                            console.log("a ghicit titlul initial");
                            score[content.user_id] = score[content.user_id] + 1000;
                        }
                        score[t.owner] = score[t.owner] + 1000;
                        t.votes = [...t.votes, user]
                    }
                    countVotes += t.votes.length;
                    return t;
                });

                set({drawingTitles: titles, score});

                if (countVotes === get().users.length - 1) {
                    get().goToScore();
                }
            }
        }
    },


    async sendMessageToClients(payload) {
        const socket = get().socket
        const matchId = get().matchId
        if (!socket || !matchId) return
        console.log("📩 Sent:", payload)
        await socket.sendMatchState(matchId, 1, new TextEncoder().encode(JSON.stringify(payload)))
    },

    async initialize() {

    },

    async connect() {
        const state = get()
        if (state.isConnected || state.isConnecting) {
            console.log("Already connecting/connected — skipping connect()")
            return
        }

        set({isConnecting: true})

        try {
            const client = new Nakama.Client("jocuri-server-parola", "192.168.1.109", "7350", false)
            set({client})

            let deviceId = localStorage.getItem("device_id")
            if (!deviceId) {
                deviceId = "device-" + Math.random().toString(36).substring(2, 10)
                localStorage.setItem("device_id", deviceId)
            }

            const session = await client.authenticateDevice(deviceId, true)
            set({session})
            console.log("Authenticated:", session.user_id)

            const socket = client.createSocket(false, false)
            await socket.connect(session, true)
            set({socket})
            console.log("Socket connected")
            get().joinOrCreateRoom()
            set({isConnected: true})
            console.log("✅ Connected successfully")
        } catch (err) {
            console.error("connect() error:", err)
        } finally {
            set({isConnecting: false})
        }
    },

    async joinOrCreateRoom()  {
        const {socket, isHost, matchId, client, session} = get()
        // Create match only once
        const rpcResponse = await client.rpc(session, "create_custom_match", {})
        const roomData = rpcResponse.payload
        console.log("Created room:", roomData)
        set({roomCode: roomData.room_code, matchId: roomData.match_id, isHost: true})

        const joinedMatch = await socket.joinMatch(roomData.match_id)
        console.log("Joined match:", joinedMatch.match_id)

        // Register handlers once
        if (!get().handlersRegistered) {
            socket.onmatchdata = (data) => get().handleMessage(data)
            socket.onmatchpresence = (presenceEvent) => {
                const {session} = get()
                if (!session) return
                const prevUsers = get().users
                let newUsers = [...prevUsers]

                if (presenceEvent.joins?.length) {
                    presenceEvent.joins.forEach(user => {
                        if (user.user_id !== session.user_id && !newUsers.find(u => u.session_id === user.session_id)) {
                            newUsers.push(user)
                        }
                    })
                }
                if (presenceEvent.leaves?.length) {
                    newUsers = newUsers.filter(u => !presenceEvent.leaves.some(l => l.session_id === u.session_id))
                }

                set({users: newUsers})
            }
            set({handlersRegistered: true})
        }

    },

    cleanup() {
        const {socket, isHost, matchId, client, session} = get()
        set({isConnected: false, isConnecting: false, handlersRegistered: false})

        if (socket) {
            if (isHost && matchId && client && session) {
                client.rpc(session, "terminate_match", {match_id: matchId})
                    .catch(err => console.error("Terminate RPC error:", err))
            }
            socket.disconnect()
            console.log("Socket disconnected.")
        }

        set({
            socket: null,
            client: null,
            session: null,
            users: [],
            score: {},
            matchId: null,
            roomCode: null,
            isHost: false
        })
    }
}))
