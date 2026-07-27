import { concepts, missions, type Concept, type Mission } from "@/lib/missions";
import type { EvaluationStatus } from "@/lib/evaluate";

const storageKey = "math-manipulative-progress-v1";

export type MissionProgress = {
  attempts: number;
  correct: boolean;
  completedAt?: string;
  xpEarned: number;
  concept: Concept;
};

export type ProgressState = {
  totalXp: number;
  streak: number;
  lastActiveDate?: string;
  missions: Record<string, MissionProgress>;
};

export type Badge = {
  id: string;
  title: string;
  earned: boolean;
};

export const emptyProgress: ProgressState = {
  totalXp: 0,
  streak: 0,
  missions: {},
};

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") {
    return emptyProgress;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? { ...emptyProgress, ...JSON.parse(raw) } : emptyProgress;
  } catch {
    return emptyProgress;
  }
}

export function saveProgress(progress: ProgressState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(progress));
}

export function recordMissionAttempt(
  progress: ProgressState,
  mission: Mission,
  status: EvaluationStatus,
): ProgressState {
  if (status === "retake") {
    return progress;
  }

  const today = localDateKey();
  const existing = progress.missions[mission.id] ?? {
    attempts: 0,
    correct: false,
    xpEarned: 0,
    concept: mission.concept,
  };
  const firstCorrect = status === "correct" && !existing.correct;
  const updatedMission: MissionProgress = {
    ...existing,
    attempts: existing.attempts + 1,
    correct: existing.correct || status === "correct",
    completedAt: existing.completedAt ?? (status === "correct" ? today : undefined),
    xpEarned: existing.xpEarned + (firstCorrect ? mission.xp : 0),
  };

  const nextProgress: ProgressState = {
    ...progress,
    missions: {
      ...progress.missions,
      [mission.id]: updatedMission,
    },
    totalXp: progress.totalXp + (firstCorrect ? mission.xp : 0),
    lastActiveDate: today,
    streak: updateStreak(progress.lastActiveDate, progress.streak, today),
  };

  saveProgress(nextProgress);
  return nextProgress;
}

export function getBadges(progress: ProgressState): Badge[] {
  const completed = Object.values(progress.missions).filter((item) => item.correct);
  const completedConcepts = new Set(completed.map((item) => item.concept));

  return [
    {
      id: "first-proof",
      title: "First Proof",
      earned: completed.length >= 1,
    },
    {
      id: "concept-explorer",
      title: "Concept Explorer",
      earned: completedConcepts.size >= 3,
    },
    {
      id: "hands-on-hero",
      title: "Hands-On Hero",
      earned: completed.length >= 5,
    },
    {
      id: "streak-spark",
      title: "Streak Spark",
      earned: progress.streak >= 3,
    },
    {
      id: "mat-mastery",
      title: "Mat Mastery",
      earned: completed.length === missions.length,
    },
  ];
}

export function getMastery(progress: ProgressState) {
  return concepts.map((concept) => {
    const conceptMissions = missions.filter((mission) => mission.concept === concept);
    const completed = conceptMissions.filter(
      (mission) => progress.missions[mission.id]?.correct,
    ).length;
    const attempts = conceptMissions.reduce(
      (total, mission) => total + (progress.missions[mission.id]?.attempts ?? 0),
      0,
    );

    return {
      concept,
      completed,
      total: conceptMissions.length,
      attempts,
    };
  });
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function updateStreak(lastActiveDate: string | undefined, streak: number, today: string) {
  if (!lastActiveDate) {
    return 1;
  }

  if (lastActiveDate === today) {
    return Math.max(1, streak);
  }

  const last = new Date(`${lastActiveDate}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);
  const diffDays = Math.round(
    (current.getTime() - last.getTime()) / (24 * 60 * 60 * 1000),
  );

  return diffDays === 1 ? streak + 1 : 1;
}
