import {create} from 'zustand'
import { persist } from 'zustand/middleware'

import * as Nakama from "@heroiclabs/nakama-js"
import { projectStore } from '../../../store/projectStore'

export const useGameStore = create((set, get) => ({
    screen: 0,
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

    async startGame () {
      const { getRandomTitle } = get()
      const { users, session, sendMessageToClients } = projectStore.getState()
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
      set({screen: 0})
      await sendMessageToClients(payload)
    },


    updateDrawings(drawing) {
        const drawings = [...get().drawings, drawing];
        set({drawings});
    },

    async timeOver() {
        const { sendMessageToClients } = projectStore.getState()
        const { createTitles } = get()

        await sendMessageToClients({
            type: 'time_over',
        });
        setTimeout(() => createTitles(0), 5000);
    },

    async createTitles(turn) {
        const { sendMessageToClients } = projectStore.getState()
        console.log("ha?", {
            type: 'create_titles',
            turn
        })
        const currentDrawing = get().drawings[turn];

        await sendMessageToClients({
            type: 'create_titles',
            owner: currentDrawing.user_id
        });
        console.log("aici", get().drawings[turn]);
        set({
            screen: 1,
            drawing: currentDrawing,
            drawingTurn: turn,
            drawingTitles: [{title: currentDrawing.title, owner: currentDrawing.user_id, votes: []}]
        })
    },

    async goToVote() {
        const { sendMessageToClients } = projectStore.getState()
        await sendMessageToClients({
            type: 'start_vote',
            drawingTitles: get().drawingTitles
        });
        set({screen: 2})
    },

    async goToScore() {
      const { sendMessageToClients } = projectStore.getState()
        await sendMessageToClients({
            type: 'displaying_score',
            drawingTitles: get().drawingTitles
        });
        set({screen: 3})
    },

    async nextDrawing() {
        const { users } = projectStore.getState();
        const turn = get().drawingTurn + 1;
        const total = get().totalScore;
        const newTotal = {};
        const score = get().score;
        console.log("users", users);
        users.map((user) => {
          console.log("user", user.user_id, total[user.user_id], score[user.user_id]);
          newTotal[user.user_id] = (total[user.user_id] || 0) + (score[user.user_id] || 0);
          return user;
        })
          
        console.log("s-a acumulat scorul", newTotal);
        set({score: [], totalScore: newTotal});
        if (turn < users.length) {
            console.log(turn);
            await get().createTitles(turn)
        } else {
            console.log("s-o terminat");
            console.log("totalScore", get().totalScore)
            set({screen: 4});
            // arata scorul total!
        }
    },

    async sendRestart() {
      const { sendMessageToClients } = projectStore.getState()

      await sendMessageToClients({
          type: 'check_restart'
      });
    },

    async handleMessage(matchData) {
        const { client, session, sendMessageToClients } = projectStore.getState()
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
            case 'restart_game': {
              console.log("??DASD");
              set({   
                screen: 0,
                drawings: [],
                drawingTitles: [],
                drawingTurn: 0,
                score: {},
                totalScore: {},
              })
              get().startGame()
              break
            }

            case "user_drawing": {
                const {client, session, users} = projectStore.getState()
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

                console.log("ha?", get().drawings.length, users.length)
                if (get().drawings.length === users.length) {
                    get().createTitles(0)
                }
                break
            }
            
            case "set_title": {
                const { users } = projectStore.getState()
                const content = data.content

                console.log(get().drawingTitles);
                set({drawingTitles: [...get().drawingTitles, {title: content.title, owner: content.user_id, votes: []}]});
                if (get().drawingTitles.length === users.length) {
                    get().goToVote();
                }
                break;
            }

            case "vote_title": {
                const { users } = projectStore.getState()
                const content = data.content;
                const user = users.filter(u => u.user_id === content.user_id)[0];
                const score = get().score;
                let countVotes = 0;
                const titles = get().drawingTitles.map((t) => {
                    if (t.title === content.title) {
                        console.log('owner?', t.owner);
                        console.log('currentTitle', get().drawingTitles[0]);
                        console.log(content.title);
                        console.log(t.votes);
                        if (get().drawingTitles[0].title === content.title) {
                            console.log("a ghicit titlul initial");
                            score[content.user_id] = (score[content.user_id] || 0) + 1000;
                        }

                        score[t.owner] = (score[t.owner] || 0) + 1000;
                        
                        t.votes = [...t.votes, user]
                    }
                    countVotes += t.votes.length;
                    return t;
                });

                set({drawingTitles: titles, score});

                if (countVotes === users.length - 1) {
                    get().goToScore();
                }
            }
        }
    },

    async sendMessageToClients(payload) {
      const {sendMessageToClients} = useProjectStore();
      await  sendMessageToClients(payload)
    },
}))

export const gameStore = useGameStore;