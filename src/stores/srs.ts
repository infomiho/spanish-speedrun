import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SrsCard, SrsCardType, SrsQuality } from "@/lib/types";
import { createNewCard, reviewCard, getDueCards, getNewCards } from "@/lib/srs";

interface SrsState {
  cards: Record<string, SrsCard>;

  addCard: (id: string, type: SrsCardType, front: string, back: string, sourceId: string) => void;
  addCardIfNotExists: (id: string, type: SrsCardType, front: string, back: string, sourceId: string) => void;
  addCardsIfNotExist: (cards: { id: string; type: SrsCardType; front: string; back: string; sourceId: string }[]) => void;
  review: (cardId: string, quality: SrsQuality) => void;
  getCard: (id: string) => SrsCard | undefined;
  getDueCards: () => SrsCard[];
  getNewCards: () => SrsCard[];
  getDueCount: () => number;
  getCardsByType: (type: SrsCardType) => SrsCard[];
  getTotalReviews: () => number;
  getTotalCards: () => number;
  getLearnedCount: () => number;
  resetSrs: () => void;
}

export const useSrsStore = create<SrsState>()(
  persist(
    (set, get) => ({
      cards: {},

      addCard: (id, type, front, back, sourceId) => {
        set((state) => ({
          cards: {
            ...state.cards,
            [id]: createNewCard(id, type, front, back, sourceId),
          },
        }));
      },

      addCardIfNotExists: (id, type, front, back, sourceId) => {
        if (!get().cards[id]) {
          get().addCard(id, type, front, back, sourceId);
        }
      },

      addCardsIfNotExist: (newCards) => {
        const current = get().cards;
        const toAdd: Record<string, SrsCard> = {};
        let hasNew = false;
        for (const c of newCards) {
          if (!current[c.id]) {
            toAdd[c.id] = createNewCard(c.id, c.type, c.front, c.back, c.sourceId);
            hasNew = true;
          }
        }
        if (hasNew) {
          set({ cards: { ...current, ...toAdd } });
        }
      },

      review: (cardId, quality) => {
        set((state) => {
          const card = state.cards[cardId];
          if (!card) return state;
          return {
            cards: {
              ...state.cards,
              [cardId]: reviewCard(card, quality),
            },
          };
        });
      },

      getCard: (id) => get().cards[id],

      getDueCards: () => getDueCards(Object.values(get().cards)),

      getNewCards: () => getNewCards(Object.values(get().cards)),

      getDueCount: () => getDueCards(Object.values(get().cards)).length,

      getCardsByType: (type) =>
        Object.values(get().cards).filter((c) => c.type === type),

      getTotalReviews: () =>
        Object.values(get().cards).reduce((sum, c) => sum + c.repetitions, 0),

      getTotalCards: () => Object.keys(get().cards).length,

      getLearnedCount: () =>
        Object.values(get().cards).filter((c) => c.repetitions >= 4).length,

      resetSrs: () => {
        set({ cards: {} });
      },
    }),
    {
      name: "spanish-speedrun-srs",
    },
  ),
);
