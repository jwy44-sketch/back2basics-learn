import { shuffle } from "./shuffle";
import type { ChoiceIndex, Question } from "./questions";

export interface PresentedQuestion {
  id: string;
  originalQuestionId: string;
  prompt: string;
  presentedChoices: [string, string, string, string];
  presentedCorrectIndex: ChoiceIndex;
  originalChoices: [string, string, string, string];
  originalCorrectIndex: ChoiceIndex;
  indexMap: [ChoiceIndex, ChoiceIndex, ChoiceIndex, ChoiceIndex];
  reverseMap: [ChoiceIndex, ChoiceIndex, ChoiceIndex, ChoiceIndex];
  explanation: string;
  session: string;
  topic: string;
  tags?: string[];
  farRefs?: string[];
  difficulty?: number;
  source?: string;
}

interface PresentOptions {
  shuffleChoices: boolean;
}

const INDEXES: [ChoiceIndex, ChoiceIndex, ChoiceIndex, ChoiceIndex] = [0, 1, 2, 3];

export function presentQuestion(question: Question, options: PresentOptions): PresentedQuestion {
  const indices = (options.shuffleChoices ? shuffle(INDEXES) : [...INDEXES]) as [
    ChoiceIndex,
    ChoiceIndex,
    ChoiceIndex,
    ChoiceIndex,
  ];
  const presentedChoices = indices.map((idx) => question.choices[idx]) as [
    string,
    string,
    string,
    string,
  ];
  const presentedCorrectIndex = indices.indexOf(question.correctIndex) as ChoiceIndex;
  const reverseMap = [0, 0, 0, 0] as [
    ChoiceIndex,
    ChoiceIndex,
    ChoiceIndex,
    ChoiceIndex,
  ];
  indices.forEach((originalIndex, presentedIndex) => {
    reverseMap[originalIndex] = presentedIndex as ChoiceIndex;
  });

  return {
    id: question.id,
    originalQuestionId: question.id,
    prompt: question.prompt,
    presentedChoices,
    presentedCorrectIndex,
    originalChoices: question.choices,
    originalCorrectIndex: question.correctIndex,
    indexMap: indices,
    reverseMap,
    explanation: question.explanation,
    session: question.session,
    topic: question.topic,
    tags: question.tags,
    farRefs: question.farRefs,
    difficulty: question.difficulty,
    source: question.source,
  };
}

export function checkAnswer(presentedQuestion: PresentedQuestion, selectedIndex: number): boolean {
  return selectedIndex === presentedQuestion.presentedCorrectIndex;
}
