interface Attempt {
  topic: string;
  concept: string;
  importance: string;
  difficulty: string;
  type: string;
  case_based: boolean;
  correct: boolean;
  marks: number;
  neg_marks: number;
  expected_time_sec: number;
  time_spent_sec: number;
  marked_review: boolean;
  revisits: number;
}

interface StudentData {
  student_id: string;
  attempts: Attempt[];
}

const importanceWeights: Record<string, number> = {
  A: 1.0,
  B: 0.7,
  C: 0.5,
};

const difficultyWeights: Record<string, number> = {
  E: 0.6,
  M: 1.0,
  H: 1.4,
};

const typeWeights: Record<string, number> = {
  Practical: 1.1,
  Theory: 1.0,
};

function computeForAttempts(attempts: Attempt[]) {
  let totalWeighted = 0;
  let maxPossible = 0;

  attempts.forEach((attempt) => {
    const base = attempt.correct ? attempt.marks : -attempt.neg_marks;

    const importanceW = importanceWeights[attempt.importance] || 1;
    const difficultyW = difficultyWeights[attempt.difficulty] || 1;
    const typeW = typeWeights[attempt.type] || 1;

    let weighted = base * importanceW * difficultyW * typeW;

    const maxBase = attempt.marks * importanceW * difficultyW * typeW;
    maxPossible += maxBase;

    const timeRatio =
      attempt.time_spent_sec / attempt.expected_time_sec;

    if (timeRatio > 2) {
      weighted *= 0.8;
    } else if (timeRatio > 1.5) {
      weighted *= 0.9;
    }

    if (attempt.marked_review && !attempt.correct) {
      weighted *= 0.9;
    }

    if (attempt.revisits > 0 && attempt.correct) {
      weighted += 0.2 * attempt.marks;
    }

    totalWeighted += weighted;
  });

  const rawPct = (totalWeighted / maxPossible) * 100;
  return Math.max(0, Math.min(100, Number(rawPct.toFixed(2))));
}

export function computeSQIWithBreakdown(data: StudentData) {
  const overall = computeForAttempts(data.attempts);

  const topicMap: Record<string, Attempt[]> = {};
  const conceptMap: Record<string, Attempt[]> = {};

  data.attempts.forEach((attempt) => {
    if (!topicMap[attempt.topic]) {
      topicMap[attempt.topic] = [];
    }
    topicMap[attempt.topic].push(attempt);

    const conceptKey = `${attempt.topic}|||${attempt.concept}`;
    if (!conceptMap[conceptKey]) {
      conceptMap[conceptKey] = [];
    }
    conceptMap[conceptKey].push(attempt);
  });

  const topicScores = Object.entries(topicMap).map(
    ([topic, attempts]) => ({
      topic,
      sqi: computeForAttempts(attempts),
    })
  );

  const conceptScores = Object.entries(conceptMap).map(
    ([key, attempts]) => {
      const [topic, concept] = key.split("|||");
      return {
        topic,
        concept,
        sqi: computeForAttempts(attempts),
        attempts,
      };
    }
  );

  // 🔥 Ranked Concepts Logic
  const rankedConcepts = conceptScores.map((c) => {
    const attempts = c.attempts;

    const wrongAtLeastOnce = attempts.some((a) => !a.correct) ? 1 : 0;

    const importanceMap: Record<string, number> = {
      A: 1,
      B: 0.7,
      C: 0.5,
    };

    const avgImportance =
      attempts.reduce(
        (sum, a) => sum + (importanceMap[a.importance] || 0),
        0
      ) / attempts.length;

    const avgTimeRatio =
      attempts.reduce(
        (sum, a) => sum + a.time_spent_sec / a.expected_time_sec,
        0
      ) / attempts.length;

    let timeScore = 0.7;
    if (avgTimeRatio <= 1) timeScore = 1;
    else if (avgTimeRatio > 1.5) timeScore = 0.4;

    const diagnosticQuality = 1 - c.sqi / 100;

    const weight =
      0.4 * wrongAtLeastOnce +
      0.25 * avgImportance +
      0.2 * timeScore +
      0.15 * diagnosticQuality;

    const reasons: string[] = [];

    if (wrongAtLeastOnce) reasons.push("Wrong earlier");
    if (avgImportance >= 0.9) reasons.push("High importance (A)");
    if (c.sqi < 70) reasons.push("Low diagnostic score");
    if (timeScore === 0.4) reasons.push("Slow solving pattern");

    return {
      topic: c.topic,
      concept: c.concept,
      weight: Number(weight.toFixed(2)),
      reasons,
    };
  });

  rankedConcepts.sort((a, b) => b.weight - a.weight);

  return {
    overall,
    topicScores,
    conceptScores: conceptScores.map((c) => ({
      topic: c.topic,
      concept: c.concept,
      sqi: c.sqi,
    })),
    rankedConcepts,
  };
}
