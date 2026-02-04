import assert from "assert";
import { presentQuestion, checkAnswer } from "../src/lib/presentedQuestion";
import type { Question } from "../src/lib/questions";

function randomChoice(): string {
  return Math.random().toString(36).slice(2, 8);
}

function makeQuestion(index: number): Question {
  const choices = [randomChoice(), randomChoice(), randomChoice(), randomChoice()] as [
    string,
    string,
    string,
    string,
  ];
  const correctIndex = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
  return {
    id: `q_${index}`,
    prompt: `Question ${index}`,
    choices,
    correctIndex,
    explanation: "Because this is a generated test question, the correct choice is the seeded one. Key takeaway: sanity-check mapping.",
    session: "Session 1",
    topic: "Skills and Roles",
    tags: ["Test"],
    farRefs: [],
    difficulty: 1,
  };
}

for (let i = 0; i < 100; i += 1) {
  const question = makeQuestion(i);
  const originalCorrect = question.choices[question.correctIndex];
  const presented = presentQuestion(question, { shuffleChoices: true });
  const presentedCorrect = presented.presentedChoices[presented.presentedCorrectIndex];

  assert.strictEqual(
    originalCorrect,
    presentedCorrect,
    `Correct answer mismatch for ${question.id}`
  );
  assert.ok(checkAnswer(presented, presented.presentedCorrectIndex));
  const wrongIndex = (presented.presentedCorrectIndex + 1) % 4;
  assert.ok(!checkAnswer(presented, wrongIndex));
}

console.log("OK: presentQuestion/checkAnswer mapping verified for 100 random questions.");
