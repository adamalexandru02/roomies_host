import {create} from 'zustand'
import { persist } from 'zustand/middleware'

import * as Nakama from "@heroiclabs/nakama-js"

import { gameStore as desenStore } from '../games/Desen/store/gameStore';
import { gameStore as dannegruStore } from '../games/Dannegru/store/gameStore';

export const useProjectStore = create((set, get) => ({
    client: null,
    socket: null,
    session: null,
    users: [],
    matchId: null,
    roomCode: null,
    isHost: false,
    screen: 0,
    gameStarted: false,
    game: null,

    isConnecting: false,
    isConnected: false,
    handlersRegistered: false,

    setUsers: (users) => {console.log(users); set({users})},
    setScreen: (screen) => set({screen}),
    updateUser: (userId, data) => {
        const newUsers = get().users.map(u => {
          console.log("ce pula mea?!", u);
          if(u.user_id === userId) {
            return {...u, ...data}
          } 
          return u
        })
        console.log(newUsers);
        get().setUsers(newUsers);
    },
    selectGame: (game) => {
      set({screen:2, gameStarted: true, game: game});
      const payload ={
          type: 'game_selected',
          content: {game},
      }
      get().sendMessageToClients(payload)
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
              console.log("user data recieved:", data.content);
                const content = data.content
                let res = null;
                if(content.avatar) {
                  res = await client.rpc(session, "get_data", {
                      collection: "images",
                      key: content.avatar,
                      user_id: content.user_id,
                  })
                }

                const user = get().users.filter(u => (u.user_id === content.user_id))[0];
                get().updateUser(content.user_id, {
                    nickname: content.nickname || user.nickname ,
                    avatar: res ? res.payload.data[0].value.image : user.avatar,
                })
                break
            }

            case "pick_game": {
                if(get().gameStarted) {
                  return;
                }
                set({screen: 1});
                const payload ={
                    type: 'pick_game',
                }
                get().sendMessageToClients(payload)
                break;
            }

            default: 
            switch(get().game) {
              case "desen": desenStore.getState().handleMessage(matchData); break;
              case "dannegru": dannegruStore.getState().handleMessage(matchData); break;
            }
            break;
        }
    },


    async sendMessageToClients(payload) {
        const socket = get().socket
        const matchId = get().matchId
        if (!socket || !matchId) return
        console.log("📩 Sent:", payload)
        await socket.sendMatchState(matchId, 1, new TextEncoder().encode(JSON.stringify(payload)))
    },

    async connect() {
        const state = get()
        if (state.isConnected || state.isConnecting) {
            console.log("Already connecting/connected — skipping connect()")
            return
        }

        set({isConnecting: true})

        try {
            const client = new Nakama.Client("jocuri-server-parola", "192.168.1.113", "7350", false)
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
        console.log("data", socket, isHost, matchId, client, session);
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
                const { session, users: prevUsers } = get()
                if (!session) return

                // clone array, never mutate original
                let newUsers = [...prevUsers]

                console.log(prevUsers)
                console.log("Presences: ", presenceEvent)

                // --- handle JOINS ---
                if (presenceEvent.joins?.length) {
                    presenceEvent.joins.forEach(joiner => {
                        if (joiner.user_id === session.user_id) return // skip yourself / host

                        const idx = newUsers.findIndex(u => u.user_id === joiner.user_id)

                        if (idx !== -1) {
                            // === UPDATE EXISTING ===
                            newUsers[idx] = {
                                ...newUsers[idx],    // păstrează ce era
                                ...joiner,           // suprascrie cu noile date
                                isDisconnected: false
                            }
                        } else {
                            // === FIRST JOIN ===
                            newUsers.push({
                                ...joiner,
                                isDisconnected: false
                            })
                        }
                    })
                }


                // --- handle LEAVES ---
                if (presenceEvent.leaves?.length) {
                    presenceEvent.leaves.forEach(leaver => {
                        const idx = newUsers.findIndex(u => u.user_id === leaver.user_id)
                        if (idx !== -1) {
                            newUsers[idx] = {
                                ...newUsers[idx],
                                isDisconnected: true,
                                lastDisconnectedAt: Date.now()
                            }
                        }
                    })
                }

                console.log("UPDATED users →", newUsers)
                get().setUsers(newUsers)
            }

            set({ handlersRegistered: true })
        }


    },

    cleanup() {
        const {socket, isHost, matchId, client, session} = get()
        set({isConnected: false, isConnecting: false, handlersRegistered: false})

        if (socket) {
            socket.disconnect()
            console.log("Socket disconnected.")
        }

        set({
            socket: null,
            client: null,
            session: null,
            screen: 0,
            users: [],
            matchId: null,
            roomCode: null,
            isHost: false
        })
    }
}))


export const projectStore = {
    getState: useProjectStore.getState,
    setState: useProjectStore.setState,
    subscribe: useProjectStore.subscribe,
};