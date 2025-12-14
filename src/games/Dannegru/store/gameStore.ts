import {create} from 'zustand'
import { projectStore } from '../../../store/projectStore'

export const useGameStore = create((set, get) => ({
    screen: -1,
    
    // 🔥 cuvantri disponibile & folosite
    words: {
      casa: "locuiesti in ea",
      masa: "Dansezi pe ea",
      rasa: "E de alta etnie",
      husa: "O pui pe telefon",
      coasa: "Tai iarba",
      grasa: "Mai dolofana",
      plasa: "Te prinzi in ea",
      transa: "esti prins intr-un vis",
    },
    definition: '',
    revealed: [],
    usedWords: [],
    currentWord: null,
    wordCount: 0,
    score: {},


    // 🔄 random title helper
    getRandomWord() {
        const {word, usedWords} = get()
        const available = word.filter(t => !usedWords.includes(t))
        if (available.length === 0) {
            console.warn("⚠️ Nu mai sunt cuvinte disponibile, se reia lista!")
            set({usedWords: []})
            return word[Math.floor(Math.random() * word.length)]
        }
        const chosen = available[Math.floor(Math.random() * available.length)]
        set({usedWords: [...usedWords, chosen]})
        return chosen
    },

    initScore() {
      const { users } = projectStore.getState();
      const newScore = {};
      console.log(users);
      users.map((u) => {
        newScore[u.user_id] = 0;
      })
      console.log("iiinit", newScore);
      return newScore
    },

    startGame() {
      console.log("ce mmm?!");
      set({word: '', score: get().initScore()})
      get().pickWord() 
    },

    async pickWord () {
      const { session, sendMessageToClients } = projectStore.getState()
      const allWords = Object.keys(get().words)
      const level = Math.floor(get().wordCount / 5) + 1;
      const targetLength = 3 + level;

      const filtered = allWords.filter((w) => w.length === targetLength);
      const words = filtered.length ? filtered : allWords;

      let usedFiltered = get().usedWords.filter((w) => words.includes(w));
      if (usedFiltered.length === words.length) usedFiltered = [];

      const remaining = words.filter((w) => !usedFiltered.includes(w));
      const next = remaining[Math.floor(Math.random() * remaining.length)];

      set({
        currentWord: next,
        definition: get().words[next],
        usedWords: [...get().usedWords, next],
        reveald: [],
      });

      // trimitem mesajul către toți jucătorii
      const payload = {
          type: "game_started",
          content: {
              word: next,
              started_by: session.user_id,
          }
      }
      console.log(payload)
      set({screen: 0})
      await sendMessageToClients(payload)
    },

    revealRandomLetter(user_id) {
      const indexes = [...currentWord].map((_, i) => i);
      const remaining = indexes.filter((i) => !revealed.includes(i));
      if (!remaining.length) return;
      if(get().score[user_id] < 1000) return;

      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      const newScore = {...get().score};
      Object.keys(newScore).map((key) => {
        if(key === user_id) {
          newScore[key] = newScore[key] - 1000;
        }
      })
      set({revealed: [...get().revealed, pick], score: newScore})
    },

    guessWord(user_id) {
      const newScore = {...get().score};

      Object.keys(newScore).map((key) => {
        if(key === user_id) {
          newScore[key] = newScore[key] + get().currentWord.length * 500;
        }
      })
      console.log("ha?", newScore);
      set({score: newScore});
      get().pickWord();
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
              get().startGame()
              break
            }

            case "guess_word": {
                const content = data.content;
                console.log(data.content.word);
                get().guessWord(content.user_id)
            }
        }
    },

    async sendMessageToClients(payload) {
      const {sendMessageToClients} = useProjectStore();
      await  sendMessageToClients(payload)
    },
}))

export const gameStore = useGameStore;