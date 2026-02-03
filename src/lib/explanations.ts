import type { PresentedQuestion } from "./presentedQuestion";

export interface EnhancedExplanation {
  whyCorrect: string;
  keyTakeaway: string;
  commonMistake?: string;
  wasEnhanced: boolean;
}

const MIN_EXPLANATION_LENGTH = 80;
const REQUIRED_TERMS = ["because", "so that", "therefore", "this means"];
const ACQUISITION_GOV = "https://www.acquisition.gov/";

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function explanationNeedsEnhancement(explanation: string, correctAnswer: string): boolean {
  if (!explanation) return true;
  const normalized = normalize(explanation);
  const normalizedAnswer = normalize(correctAnswer);
  if (normalized === normalizedAnswer) return true;
  if (explanation.length < MIN_EXPLANATION_LENGTH) return true;
  return !explanation.includes("acquisition.gov");
}

function hasRequiredTerm(explanation: string): boolean {
  const lower = explanation.toLowerCase();
  return REQUIRED_TERMS.some((term) => lower.includes(term));
}

function splitSentences(explanation: string): string[] {
  return explanation
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildFallbackExplanation(question: PresentedQuestion, correctAnswer: string): EnhancedExplanation {
  const topic = question.topic || "this topic";
  const session = question.session ? ` (${question.session})` : "";
  const tags = question.tags?.length ? ` It connects to ${question.tags.join(", ")}.` : "";
  const farRefs = question.farRefs?.length ? ` Reference: ${question.farRefs.join(", ")}.` : "";
  const referenceLink = question.farRefs?.length
    ? `See ${ACQUISITION_GOV}?search=${encodeURIComponent(question.farRefs.join(", "))} for the cited FAR reference.`
    : `See ${ACQUISITION_GOV} for FAR guidance.`;
  return {
    whyCorrect: `Why this is correct: Because the question focuses on ${topic}${session}, the correct choice is the one that directly aligns with that focus. ${referenceLink}`,
    keyTakeaway: `Key takeaway: Anchor your choice to the core ${topic} principle and select the option that best matches it.${tags}${farRefs}`,
    commonMistake: `Common mistake: Picking an option that sounds plausible but doesn't address the ${topic} focus in the prompt.`,
    wasEnhanced: true,
  };
}

export function buildEnhancedExplanation(
  question: PresentedQuestion,
  explanation: string
): EnhancedExplanation {
  const correctAnswer = question.presentedChoices[question.presentedCorrectIndex];
  const needsEnhancement = explanationNeedsEnhancement(explanation, correctAnswer) || !hasRequiredTerm(explanation);
  if (needsEnhancement) {
    return buildFallbackExplanation(question, correctAnswer);
  }

  const normalized = normalize(explanation);
  if (normalized.includes("key takeaway:")) {
    const [whyCorrect, ...rest] = explanation.split(/key takeaway:/i);
    return {
      whyCorrect: whyCorrect.trim(),
      keyTakeaway: `Key takeaway:${rest.join("key takeaway:")}`.trim(),
      wasEnhanced: false,
    };
  }

  const sentences = splitSentences(explanation);
  const [first, second] = sentences;
  const topic = question.topic || "this topic";
  return {
    whyCorrect: first || explanation,
    keyTakeaway: second
      ? `Key takeaway: ${second}`
      : `Key takeaway: Focus on the core ${topic} principle described in the prompt.`,
    wasEnhanced: false,
  };
}

export function buildContrastStatements(question: PresentedQuestion): string[] {
  const topic = question.topic || "this topic";
  const session = question.session ? ` in ${question.session}` : "";
  return question.presentedChoices
    .map((_, idx) => {
      if (idx === question.presentedCorrectIndex) return null;
      const letter = String.fromCharCode(65 + idx);
      return `Choice ${letter} doesn't align with the prompt's focus on ${topic}${session}.`;
    })
    .filter(Boolean) as string[];
}
