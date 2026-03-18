/**
 * Simple heuristic move annotations based on eval changes.
 * Given an array of evaluations (centipawns after each move),
 * returns annotation symbols for each move.
 *
 * This is a lightweight version — no deep engine analysis,
 * just compares successive evals to flag blunders/brilliancies.
 */

const THRESHOLDS = {
  brilliant: 200,   // gained 200+ cp unexpectedly
  good: 80,         // gained 80+ cp
  inaccuracy: -50,  // lost 50-100 cp
  mistake: -100,    // lost 100-200 cp
  blunder: -200,    // lost 200+ cp
};

const SYMBOLS = {
  brilliant: '!!',
  good: '!',
  inaccuracy: '?!',
  mistake: '?',
  blunder: '??',
};

/**
 * Annotate a move based on evaluation change.
 * @param {number} evalBefore - centipawns before move (from mover's perspective)
 * @param {number} evalAfter - centipawns after move (from mover's perspective, negated since side switched)
 * @returns {string|null} annotation symbol or null
 */
export function annotateMove(evalBefore, evalAfter) {
  if (evalBefore == null || evalAfter == null) return null;

  // After the move, eval is from opponent's perspective, so negate
  const delta = -evalAfter - evalBefore;

  if (delta >= THRESHOLDS.brilliant) return SYMBOLS.brilliant;
  if (delta >= THRESHOLDS.good) return SYMBOLS.good;
  if (delta <= THRESHOLDS.blunder) return SYMBOLS.blunder;
  if (delta <= THRESHOLDS.mistake) return SYMBOLS.mistake;
  if (delta <= THRESHOLDS.inaccuracy) return SYMBOLS.inaccuracy;
  return null;
}

/**
 * Annotate an array of moves given their evaluations.
 * @param {Array<number|null>} evals - eval after each position (index 0 = starting position)
 * @returns {Array<string|null>} annotation for each move
 */
export function annotateGame(evals) {
  const annotations = [];
  for (let i = 1; i < evals.length; i++) {
    annotations.push(annotateMove(evals[i - 1], evals[i]));
  }
  return annotations;
}

/**
 * Get CSS color for an annotation symbol.
 */
export function getAnnotationColor(symbol) {
  switch (symbol) {
    case '!!': return '#56b4e9'; // brilliant blue
    case '!': return '#7cb342';  // good green
    case '?!': return '#fbbf24'; // inaccuracy yellow
    case '?': return '#f59e0b';  // mistake orange
    case '??': return '#ef4444'; // blunder red
    default: return null;
  }
}
