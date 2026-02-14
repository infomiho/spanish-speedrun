import type { DayPlan } from "@/lib/types";

export const days: DayPlan[] = [
  { day: 1, title: "Foundation", subtitle: "Top 50 words + survival frames", focusAreas: ["frequency", "survival"], exerciseTypes: ["vocab", "cognates", "frames", "quiz"], newWordCount: 50 },
  { day: 2, title: "Verb Engines", subtitle: "Core verbs + cognate explosion", focusAreas: ["verbs", "cognates"], exerciseTypes: ["vocab", "cognates", "frames", "verbs", "quiz"], newWordCount: 60 },
  { day: 3, title: "Food & Directions", subtitle: "Numbers, food, restaurant, directions", focusAreas: ["food", "numbers", "directions"], exerciseTypes: ["vocab", "cognates", "frames", "verbs", "quiz"], newWordCount: 65 },
  { day: 4, title: "Past & Future", subtitle: "More verbs + ir a + basic past", focusAreas: ["verbs", "tense"], exerciseTypes: ["vocab", "cognates", "frames", "verbs", "quiz"], newWordCount: 50 },
  { day: 5, title: "Sentence Builder", subtitle: "Heavy drilling — combine everything", focusAreas: ["construction", "drill"], exerciseTypes: ["vocab", "cognates", "frames", "verbs", "quiz"], newWordCount: 30 },
  { day: 6, title: "Express Yourself", subtitle: "Opinions, emotions, comparisons", focusAreas: ["opinions", "emotions"], exerciseTypes: ["vocab", "cognates", "frames", "verbs", "quiz"], newWordCount: 50 },
  { day: 7, title: "Social Spanish", subtitle: "Polite requests, social frames", focusAreas: ["social", "polite"], exerciseTypes: ["vocab", "cognates", "frames", "verbs", "quiz"], newWordCount: 50 },
  { day: 8, title: "Consolidation", subtitle: "Connecting words, gap filling", focusAreas: ["connectors", "consolidation"], exerciseTypes: ["vocab", "cognates", "frames", "verbs", "quiz"], newWordCount: 40 },
  { day: 9, title: "Fluency Push", subtitle: "Recovery strategies, complex frames", focusAreas: ["fluency", "recovery"], exerciseTypes: ["vocab", "cognates", "frames", "verbs", "quiz"], newWordCount: 30 },
  { day: 10, title: "Integration", subtitle: "Review everything, final assessment", focusAreas: ["review", "assessment"], exerciseTypes: ["vocab", "cognates", "frames", "verbs", "quiz"], newWordCount: 25 },
];
