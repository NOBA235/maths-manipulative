const storageKey = "math-manipulative-learner-v1";

export type LearnerProfile = {
  name: string;
  onboardingComplete: boolean;
};

export const emptyLearnerProfile: LearnerProfile = {
  name: "",
  onboardingComplete: false,
};

export function normalizeLearnerName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 24);
}

export function loadLearnerProfile(): LearnerProfile {
  if (typeof window === "undefined") {
    return emptyLearnerProfile;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return emptyLearnerProfile;
    }

    const saved = JSON.parse(raw) as Partial<LearnerProfile>;
    const name = typeof saved.name === "string" ? normalizeLearnerName(saved.name) : "";

    return {
      name,
      onboardingComplete: Boolean(saved.onboardingComplete && name),
    };
  } catch {
    return emptyLearnerProfile;
  }
}

export function saveLearnerProfile(profile: LearnerProfile) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      name: normalizeLearnerName(profile.name),
      onboardingComplete: profile.onboardingComplete,
    }),
  );
}
