const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * score = 100 - sum(penalties), clamped to 0..100
 */
const calculateScore = (issues) => {
  const penalty = issues.reduce((sum, issue) => sum + (issue.penalty || 0), 0);

  return clamp(100 - penalty, 0, 100);
};

const getGrade = (score) => {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
};

module.exports = { calculateScore, getGrade };
