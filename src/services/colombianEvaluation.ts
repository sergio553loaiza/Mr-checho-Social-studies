import { COLOMBIAN_NATIONAL_SYMBOLS, ColombianNationalSymbol } from '../data/colombianSymbolsData';
import { ColombianRubricBreakdown } from '../types';

export interface EvaluationResult {
  finalScore: number; // 1.0 - 10.0
  percentage: number; // 10 - 100%
  status: 'PASSED' | 'NEEDS PRACTICE';
  passed: boolean;
  completedSymbolsCount: number;
  totalSymbolsCount: number;
  completedBranchesCount: number;
  totalBranchesCount: number;
  rubricBreakdown: ColombianRubricBreakdown;
  feedback: string;
}

/**
 * Deterministic rubric evaluator for Colombian National Symbols Mind Maps.
 * Evaluates all 10 Colombian National Symbols and their respective branches:
 * 1. Accuracy & Understanding of the symbols (max 3.0 pts)
 * 2. Completeness across the 10 symbols & branches (max 2.0 pts)
 * 3. Explanation & Reasoning depth (max 2.0 pts)
 * 4. Social Studies Vocabulary & Terminology (max 1.0 pt)
 * 5. Connection to Colombian Identity (max 1.0 pt)
 * 6. Reflection & Historical Insight (max 1.0 pt)
 *
 * Grading scale: 1.0 to 10.0 (Passing standard: >= 7.0 -> PASSED; < 7.0 -> NEEDS PRACTICE)
 */
export function evaluateStudentResponsesLocally(
  studentName: string,
  responses: Record<string, string>,
  _symbolKey?: string
): EvaluationResult {
  const symbols: ColombianNationalSymbol[] = COLOMBIAN_NATIONAL_SYMBOLS;
  const totalSymbols = symbols.length; // 10

  let totalBranchesCount = 0;
  let completedBranchesCount = 0;
  let inProgressBranchesCount = 0;
  let completedSymbolsCount = 0;
  let totalWords = 0;
  let keywordHits = 0;
  let totalKeywordsPossible = 0;
  let explanatoryDepthCount = 0;

  const symbolSummaries: {
    symbol: ColombianNationalSymbol;
    completedBranches: number;
    totalBranches: number;
    isSymbolCompleted: boolean;
  }[] = [];

  for (const sym of symbols) {
    let symCompletedBranches = 0;
    const symTotalBranches = sym.branches.length; // 5
    totalBranchesCount += symTotalBranches;

    for (const branch of sym.branches) {
      const text = (responses[branch.id] || responses[branch.key] || '').trim();
      const words = text.split(/\s+/).filter(Boolean);
      const count = words.length;

      totalWords += count;
      totalKeywordsPossible += branch.expectedKeywords.length;

      // Check keyword matching (case-insensitive)
      const lowerText = text.toLowerCase();
      const matchedKws = branch.expectedKeywords.filter((kw) =>
        lowerText.includes(kw.toLowerCase())
      );
      keywordHits += matchedKws.length;

      const isDone = count >= branch.minWords;
      if (isDone) {
        completedBranchesCount++;
        symCompletedBranches++;
        if (count >= branch.minWords + 6) {
          explanatoryDepthCount++;
        }
      } else if (count > 0) {
        inProgressBranchesCount++;
      }
    }

    const isSymbolCompleted = symCompletedBranches >= symTotalBranches;
    if (isSymbolCompleted) {
      completedSymbolsCount++;
    }

    symbolSummaries.push({
      symbol: sym,
      completedBranches: symCompletedBranches,
      totalBranches: symTotalBranches,
      isSymbolCompleted,
    });
  }

  // 1. Completeness across symbols & branches (max 2.0 pts)
  // Weighted: 60% by symbol completeness, 40% by branch completeness
  const symbolRatio = completedSymbolsCount / totalSymbols;
  const branchRatio = (completedBranchesCount + inProgressBranchesCount * 0.3) / Math.max(1, totalBranchesCount);
  const combinedCompleteness = symbolRatio * 0.6 + branchRatio * 0.4;
  const completenessScore = Number((Math.min(1.0, combinedCompleteness) * 2.0).toFixed(1));

  // 2. Accuracy & Understanding (max 3.0 pts)
  const targetKeywordsExpected = Math.max(15, totalBranchesCount * 0.8);
  const keywordRatio = Math.min(1.0, (keywordHits * 1.5) / targetKeywordsExpected);
  const accuracyScore = Number((Math.max(0.4, Math.min(1.0, keywordRatio)) * 3.0).toFixed(1));

  // 3. Explanation & Reasoning (max 2.0 pts)
  const avgWordsPerCompletedBranch = completedBranchesCount > 0
    ? totalWords / completedBranchesCount
    : 0;
  const reasoningRatio = Math.min(1.0, avgWordsPerCompletedBranch / 18);
  const reasoningScore = Number((Math.max(0.3, reasoningRatio) * 2.0).toFixed(1));

  // 4. Social Studies Vocabulary (max 1.0 pt)
  const vocabRatio = Math.min(1.0, (keywordHits * 1.8) / Math.max(12, targetKeywordsExpected * 0.7));
  const vocabularyScore = Number((Math.max(0.2, vocabRatio) * 1.0).toFixed(1));

  // 5. Connection to Identity (max 1.0 pt)
  // Check presence of identity terms
  const allText = Object.values(responses).join(' ').toLowerCase();
  const identityTerms = [
    'colombia', 'colombiano', 'colombiana', 'identidad', 'orgullo', 'pride', 'patria',
    'simbolo', 'nacion', 'cultura', 'respeto', 'libertad', 'paz', 'unidad', 'biodiversidad'
  ];
  const identityHits = identityTerms.filter((term) => allText.includes(term)).length;
  const identityRatio = Math.min(1.0, identityHits / 6);
  const connectionToIdentityScore = Number((Math.max(0.2, identityRatio) * 1.0).toFixed(1));

  // 6. Reflection & Depth (max 1.0 pt)
  const depthRatio = Math.min(1.0, explanatoryDepthCount / Math.max(8, totalBranchesCount * 0.3));
  const reflectionScore = Number((Math.max(0.2, depthRatio) * 1.0).toFixed(1));

  // Total Grade: Scale 1.0 to 10.0
  let rawScore =
    completenessScore +
    accuracyScore +
    reasoningScore +
    vocabularyScore +
    connectionToIdentityScore +
    reflectionScore;

  let finalScore = Number(rawScore.toFixed(1));
  if (finalScore < 1.0) finalScore = 1.0;
  if (finalScore > 10.0) finalScore = 10.0;

  const passed = finalScore >= 7.0;
  const status: 'PASSED' | 'NEEDS PRACTICE' = passed ? 'PASSED' : 'NEEDS PRACTICE';
  const percentage = Math.round((finalScore / 10) * 100);

  // Personalized Strengths and Constructive Recommendations
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (completedSymbolsCount === 10) {
    strengths.push('You completed all 10 Colombian National Symbols across the Patriotic, Cultural, and Natural categories!');
  } else if (completedSymbolsCount >= 7) {
    strengths.push(`Impressive progress: You fully completed ${completedSymbolsCount} out of 10 national symbol mind maps.`);
  } else if (completedBranchesCount >= 15) {
    strengths.push(`Good development: You completed ${completedBranchesCount} interactive knowledge branches with descriptive writing.`);
  } else {
    strengths.push('You have begun exploring the interactive mind maps of Colombia’s rich national symbols.');
  }

  if (keywordHits >= 25) {
    strengths.push('Outstanding civic and historical vocabulary: You consistently integrated precise concepts, historical dates, and legal decrees.');
  } else if (keywordHits >= 12) {
    strengths.push('Good use of Social Studies terminology relating to Colombian heritage, history, and geography.');
  }

  if (avgWordsPerCompletedBranch >= 18) {
    strengths.push('Your explanations demonstrate thoughtful reasoning, detail, and complete sentence structure.');
  }

  if (completedSymbolsCount < 10) {
    const uncompletedSymbols = symbolSummaries
      .filter((s) => !s.isSymbolCompleted)
      .map((s) => s.symbol.title);
    if (uncompletedSymbols.length <= 3) {
      improvements.push(`Complete the remaining branches for: ${uncompletedSymbols.join(', ')}.`);
    } else {
      improvements.push(`Continue filling out the branches for all 10 symbols to achieve 10/10 mastery (${completedSymbolsCount}/10 completed).`);
    }
  }

  if (avgWordsPerCompletedBranch < 15) {
    improvements.push('Expand your answers with more descriptive detail, explaining why each symbol matters to Colombian citizens.');
  }

  if (keywordHits < 15) {
    improvements.push('Use the "Need a Clue?" assistant button to discover historical names, laws, and key scientific terms for each branch.');
  }

  // Construct comprehensive feedback paragraph
  let feedback = '';
  if (passed) {
    feedback = `¡Felicitaciones, ${studentName}! You demonstrated an excellent understanding of Colombia’s 10 National Symbols, earning a grade of ${finalScore}/10 (${percentage}%). Your mind maps vividly connect our patriotic history (Flag, Coat of Arms, Anthem), cultural traditions (Sombrero Vueltiao, Juan Valdez, Coffee, Tejo), and natural wonders (Orchid, Wax Palm, Condor) into a proud vision of Colombian identity.`;
  } else {
    feedback = `Good effort, ${studentName}! You currently scored ${finalScore}/10 (${percentage}%). The passing grade is 7.0/10. Review the symbols that still need written branches, expand your answers with the guiding clues, and submit again when you have explored all 10 symbols!`;
  }

  return {
    finalScore,
    percentage,
    status,
    passed,
    completedSymbolsCount,
    totalSymbolsCount: totalSymbols,
    completedBranchesCount,
    totalBranchesCount,
    rubricBreakdown: {
      accuracyAndUnderstanding: accuracyScore,
      completeness: completenessScore,
      explanationAndReasoning: reasoningScore,
      vocabulary: vocabularyScore,
      connectionToIdentity: connectionToIdentityScore,
      reflection: reflectionScore,
      strengths,
      improvements,
    },
    feedback,
  };
}
