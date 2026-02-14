import type { VerbEntry } from "@/lib/types";

export const verbs: VerbEntry[] = [
  // ============================================================
  // Day 2 — Core irregular verbs
  // ============================================================
  {
    id: "vb-ser",
    infinitive: "ser",
    english: "to be (permanent)",
    day: 2,
    isRegular: false,
    conjugations: { yo: "soy", tú: "eres", él: "es" },
  },
  {
    id: "vb-estar",
    infinitive: "estar",
    english: "to be (temporary)",
    day: 2,
    isRegular: false,
    conjugations: { yo: "estoy", tú: "estás", él: "está" },
  },
  {
    id: "vb-tener",
    infinitive: "tener",
    english: "to have",
    day: 2,
    isRegular: false,
    conjugations: { yo: "tengo", tú: "tienes", él: "tiene" },
  },
  {
    id: "vb-hacer",
    infinitive: "hacer",
    english: "to do / to make",
    day: 2,
    isRegular: false,
    conjugations: { yo: "hago", tú: "haces", él: "hace" },
  },
  {
    id: "vb-ir",
    infinitive: "ir",
    english: "to go",
    day: 2,
    isRegular: false,
    conjugations: { yo: "voy", tú: "vas", él: "va" },
  },
  {
    id: "vb-poder",
    infinitive: "poder",
    english: "to be able / can",
    day: 2,
    isRegular: false,
    conjugations: { yo: "puedo", tú: "puedes", él: "puede" },
  },

  // ============================================================
  // Day 4 — More core verbs (mix of irregular + regular)
  // ============================================================
  {
    id: "vb-querer",
    infinitive: "querer",
    english: "to want / to love",
    day: 4,
    isRegular: false,
    conjugations: { yo: "quiero", tú: "quieres", él: "quiere" },
  },
  {
    id: "vb-decir",
    infinitive: "decir",
    english: "to say / to tell",
    day: 4,
    isRegular: false,
    conjugations: { yo: "digo", tú: "dices", él: "dice" },
  },
  {
    id: "vb-saber",
    infinitive: "saber",
    english: "to know (facts)",
    day: 4,
    isRegular: false,
    conjugations: { yo: "sé", tú: "sabes", él: "sabe" },
  },
  {
    id: "vb-dar",
    infinitive: "dar",
    english: "to give",
    day: 4,
    isRegular: false,
    conjugations: { yo: "doy", tú: "das", él: "da" },
  },
  {
    id: "vb-ver",
    infinitive: "ver",
    english: "to see",
    day: 4,
    isRegular: false,
    conjugations: { yo: "veo", tú: "ves", él: "ve" },
  },
  {
    id: "vb-haber",
    infinitive: "haber",
    english: "to have (auxiliary)",
    day: 4,
    isRegular: false,
    conjugations: { yo: "he", tú: "has", él: "ha" },
  },
  {
    id: "vb-comer",
    infinitive: "comer",
    english: "to eat",
    day: 4,
    isRegular: true,
    conjugations: { yo: "como", tú: "comes", él: "come" },
  },
  {
    id: "vb-hablar",
    infinitive: "hablar",
    english: "to speak / to talk",
    day: 4,
    isRegular: true,
    conjugations: { yo: "hablo", tú: "hablas", él: "habla" },
  },

  // ============================================================
  // Day 6+ — Additional useful verbs
  // ============================================================
  {
    id: "vb-necesitar",
    infinitive: "necesitar",
    english: "to need",
    day: 6,
    isRegular: true,
    conjugations: { yo: "necesito", tú: "necesitas", él: "necesita" },
  },
  {
    id: "vb-gustar",
    infinitive: "gustar",
    english: "to like / to please",
    day: 6,
    isRegular: true,
    conjugations: { yo: "gusto", tú: "gustas", él: "gusta" },
  },
  {
    id: "vb-llegar",
    infinitive: "llegar",
    english: "to arrive",
    day: 6,
    isRegular: true,
    conjugations: { yo: "llego", tú: "llegas", él: "llega" },
  },
  {
    id: "vb-llamar",
    infinitive: "llamar",
    english: "to call",
    day: 6,
    isRegular: true,
    conjugations: { yo: "llamo", tú: "llamas", él: "llama" },
  },
  {
    id: "vb-pagar",
    infinitive: "pagar",
    english: "to pay",
    day: 6,
    isRegular: true,
    conjugations: { yo: "pago", tú: "pagas", él: "paga" },
  },
  {
    id: "vb-buscar",
    infinitive: "buscar",
    english: "to look for / to search",
    day: 6,
    isRegular: true,
    conjugations: { yo: "busco", tú: "buscas", él: "busca" },
  },
];
