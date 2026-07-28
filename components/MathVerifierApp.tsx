"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Asterisk,
  ArrowLeft,
  BarChart3,
  Camera,
  CalendarDays,
  Check,
  ChevronRight,
  Divide,
  Flame,
  HeartHandshake,
  Lightbulb,
  ListChecks,
  Minus,
  PieChart,
  Plus,
  RotateCcw,
  Ruler,
  ScanLine,
  Share2,
  Shapes,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Trophy,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EvaluationResult } from "@/lib/evaluate";
import {
  emptyLearnerProfile,
  loadLearnerProfile,
  normalizeLearnerName,
  saveLearnerProfile,
  type LearnerProfile,
} from "@/lib/learner";
import {
  missions,
  type Concept,
  type EvidenceStage,
  type Mission,
} from "@/lib/missions";
import {
  emptyProgress,
  getBadges,
  getMastery,
  getParentSnapshot,
  loadProgress,
  recordMissionAttempt,
  saveProgress,
  type ProgressState,
} from "@/lib/progress";

type Screen = "missions" | "progress" | "parents";

type VerificationResponse = {
  vision?: unknown;
  evaluation?: EvaluationResult;
  error?: string;
};

type EvidenceFiles = Record<EvidenceStage, File | null>;
type EvidencePreviews = Record<EvidenceStage, string | null>;

const emptyEvidenceFiles = (): EvidenceFiles => ({
  setup: null,
  result: null,
});

const emptyEvidencePreviews = (): EvidencePreviews => ({
  setup: null,
  result: null,
});

function revokePreviews(previews: EvidencePreviews) {
  for (const preview of Object.values(previews)) {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  }
}

const conceptStyles: Record<Concept, string> = {
  Addition: "border-lake/25 bg-[#eaf3ff] text-lake",
  Subtraction: "border-coral/25 bg-[#fff0f3] text-coral",
  Multiplication: "border-leaf/25 bg-[#eaf8f1] text-leaf",
  Division: "border-plum/25 bg-[#f3effc] text-plum",
  Fractions: "border-saffron/40 bg-[#fff7d8] text-[#845f00]",
  Geometry: "border-ink/20 bg-ink/10 text-ink",
  Measurement: "border-aqua/25 bg-[#e8fbfa] text-aqua",
};

const conceptCardStyles: Record<Concept, string> = {
  Addition: "border-lake/25 bg-white hover:border-lake/60",
  Subtraction: "border-coral/25 bg-white hover:border-coral/60",
  Multiplication: "border-leaf/25 bg-white hover:border-leaf/60",
  Division: "border-plum/25 bg-white hover:border-plum/60",
  Fractions: "border-saffron/45 bg-white hover:border-saffron",
  Geometry: "border-ink/15 bg-white hover:border-ink/45",
  Measurement: "border-aqua/25 bg-white hover:border-aqua/60",
};

const conceptAccentStyles: Record<Concept, string> = {
  Addition: "bg-lake text-white",
  Subtraction: "bg-coral text-white",
  Multiplication: "bg-leaf text-white",
  Division: "bg-plum text-white",
  Fractions: "bg-saffron text-ink",
  Geometry: "bg-ink text-white",
  Measurement: "bg-aqua text-white",
};

const conceptIcons: Record<Concept, LucideIcon> = {
  Addition: Plus,
  Subtraction: Minus,
  Multiplication: Asterisk,
  Division: Divide,
  Fractions: PieChart,
  Geometry: Shapes,
  Measurement: Ruler,
};

const evidenceStageAccent: Record<EvidenceStage, string> = {
  setup: "bg-lake text-white",
  result: "bg-plum text-white",
};

const evidenceStageSurface: Record<EvidenceStage, string> = {
  setup: "border-lake/25 bg-[#f1f7ff]",
  result: "border-plum/25 bg-[#f7f3ff]",
};

const evidenceStageLabels: Record<EvidenceStage, string> = {
  setup: "First photo",
  result: "Second photo",
};

export default function MathVerifierApp() {
  const [screen, setScreen] = useState<Screen>("missions");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [prediction, setPrediction] = useState("");
  const [evidenceFiles, setEvidenceFiles] =
    useState<EvidenceFiles>(emptyEvidenceFiles);
  const [evidencePreviews, setEvidencePreviews] =
    useState<EvidencePreviews>(emptyEvidencePreviews);
  const evidencePreviewsRef = useRef<EvidencePreviews>(emptyEvidencePreviews());
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentXp, setRecentXp] = useState(0);
  const [learnerProfile, setLearnerProfile] =
    useState<LearnerProfile>(emptyLearnerProfile);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setLearnerProfile(loadLearnerProfile());
    setProfileReady(true);
  }, []);

  useEffect(() => {
    evidencePreviewsRef.current = evidencePreviews;
  }, [evidencePreviews]);

  useEffect(
    () => () => {
      revokePreviews(evidencePreviewsRef.current);
    },
    [],
  );

  const completedCount = useMemo(
    () => Object.values(progress.missions).filter((item) => item.correct).length,
    [progress.missions],
  );

  function openMission(mission: Mission) {
    setSelectedMission(mission);
    setScreen("missions");
    resetAttempt();
  }

  function backToList() {
    setSelectedMission(null);
    resetAttempt();
  }

  function resetAttempt() {
    setPrediction("");
    revokePreviews(evidencePreviewsRef.current);
    const nextPreviews = emptyEvidencePreviews();
    setEvidenceFiles(emptyEvidenceFiles());
    setEvidencePreviews(nextPreviews);
    evidencePreviewsRef.current = nextPreviews;
    setResult(null);
    setError(null);
    setRecentXp(0);
  }

  function handlePhotoChange(stage: EvidenceStage, file: File | undefined) {
    const existingPreview = evidencePreviewsRef.current[stage];

    if (existingPreview) {
      URL.revokeObjectURL(existingPreview);
    }

    setResult(null);
    setError(null);
    setRecentXp(0);
    setEvidenceFiles((current) => ({
      ...current,
      [stage]: file ?? null,
    }));
    setEvidencePreviews((current) => {
      const next = {
        ...current,
        [stage]: file ? URL.createObjectURL(file) : null,
      };
      evidencePreviewsRef.current = next;
      return next;
    });
  }

  async function verifyEvidence() {
    const setupImage = evidenceFiles.setup;
    const resultImage = evidenceFiles.result;

    if (!selectedMission || !setupImage || !resultImage) {
      return;
    }

    setChecking(true);
    setError(null);
    setResult(null);
    setRecentXp(0);

    const body = new FormData();
    body.append("missionId", selectedMission.id);
    body.append("prediction", prediction);
    body.append("setupImage", setupImage);
    body.append("resultImage", resultImage);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as VerificationResponse;

      if (!response.ok || !payload.evaluation) {
        throw new Error(payload.error ?? "Photo verification failed.");
      }

      const evaluation = payload.evaluation;
      const alreadyCorrect = progress.missions[selectedMission.id]?.correct;
      const earnedXp =
        evaluation.status === "correct" && !alreadyCorrect
          ? selectedMission.xp
          : 0;

      setResult(evaluation);
      setRecentXp(earnedXp);

      setProgress((current) =>
        recordMissionAttempt(current, selectedMission, evaluation.status),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Photo verification failed. Try again.",
      );
    } finally {
      setChecking(false);
    }
  }

  function retryAttempt() {
    const stagesToClear =
      result?.checkpoints
        .filter((checkpoint) => checkpoint.status !== "correct")
        .map((checkpoint) => checkpoint.stage) ?? [];

    clearEvidenceStages(stagesToClear);
    setResult(null);
    setError(null);
    setRecentXp(0);
  }

  function clearEvidenceStages(stages: EvidenceStage[]) {
    if (stages.length === 0) {
      return;
    }

    setEvidenceFiles((current) => {
      const next = { ...current };

      for (const stage of stages) {
        next[stage] = null;
      }

      return next;
    });
    setEvidencePreviews((current) => {
      const next = { ...current };

      for (const stage of stages) {
        if (next[stage]) {
          URL.revokeObjectURL(next[stage]);
        }
        next[stage] = null;
      }

      evidencePreviewsRef.current = next;
      return next;
    });
  }

  function resetProgress() {
    const next = emptyProgress;
    setProgress(next);
    saveProgress(next);
  }

  function finishOnboarding(name: string) {
    const normalizedName = normalizeLearnerName(name);
    if (!normalizedName) {
      return;
    }

    const nextProfile = {
      name: normalizedName,
      onboardingComplete: true,
    };
    saveLearnerProfile(nextProfile);
    setLearnerProfile(nextProfile);
  }

  if (!profileReady) {
    return <OnboardingLoading />;
  }

  if (!learnerProfile.onboardingComplete) {
    return <ComicOnboarding onComplete={finishOnboarding} />;
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-3 sm:px-6 sm:pb-8 sm:pt-5 lg:px-8">
      <AppHeader
        screen={screen}
        setScreen={(nextScreen) => {
          setScreen(nextScreen);
          if (nextScreen === "missions") {
            setSelectedMission(null);
          }
        }}
        completedCount={completedCount}
        totalXp={progress.totalXp}
        learnerName={learnerProfile.name}
      />

      <AnimatePresence mode="wait">
        {screen === "parents" ? (
          <motion.div
            key="parents"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            <ParentCenter progress={progress} onOpenMission={openMission} />
          </motion.div>
        ) : screen === "progress" ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            <ProgressScreen progress={progress} onReset={resetProgress} />
          </motion.div>
        ) : selectedMission ? (
          <motion.div
            key={selectedMission.id}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.18 }}
          >
            <MissionDetail
              mission={selectedMission}
              progress={progress}
              prediction={prediction}
              setPrediction={setPrediction}
              evidenceFiles={evidenceFiles}
              evidencePreviews={evidencePreviews}
              checking={checking}
              result={result}
              error={error}
              recentXp={recentXp}
              onBack={backToList}
              onPhotoChange={handlePhotoChange}
              onVerify={verifyEvidence}
              onRetry={retryAttempt}
              onNext={() => {
                const index = missions.findIndex(
                  (mission) => mission.id === selectedMission.id,
                );
                const nextMission = missions[(index + 1) % missions.length];
                openMission(nextMission);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="missions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            <MissionList
              progress={progress}
              learnerName={learnerProfile.name}
              onOpenMission={openMission}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function OnboardingLoading() {
  return (
    <main className="comic-stage flex min-h-screen items-center justify-center px-5">
      <div className="text-center">
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto w-32"
        >
          <Image
            src="/math-buddy.png"
            alt="Math Buddy"
            width={560}
            height={700}
            priority
            className="h-auto w-full object-contain"
          />
        </motion.div>
        <p className="mt-3 text-sm font-black text-ink/60">Getting your math club ready...</p>
      </div>
    </main>
  );
}

function ComicOnboarding({
  onComplete,
}: {
  onComplete: (name: string) => void;
}) {
  const [page, setPage] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  function continueToPlan() {
    const friendlyName = normalizeLearnerName(name);

    if (!friendlyName) {
      setNameError("Tell me your name so I can cheer for you!");
      return;
    }

    setName(friendlyName);
    setNameError("");
    setPage(2);
  }

  return (
    <main className="comic-stage min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-black text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-ink bg-saffron shadow-[3px_3px_0_#20233a]">
            <Sparkles size={19} />
          </span>
          Math Buddy&apos;s Club
        </div>
        <span className="rounded-md border-2 border-ink bg-white px-3 py-1.5 text-xs font-black text-ink shadow-[3px_3px_0_#20233a]">
          Page {page} of 2
        </span>
      </div>

      <AnimatePresence mode="wait">
        {page === 1 ? (
          <motion.div
            key="meet-math-buddy"
            initial={{ opacity: 0, x: 24, rotate: 1 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -24, rotate: -1 }}
            transition={{ type: "spring", stiffness: 220, damping: 23 }}
            className="mx-auto mt-5 grid w-full max-w-6xl gap-5 lg:grid-cols-[1.08fr_0.92fr]"
          >
            <section className="comic-panel relative min-h-[360px] overflow-hidden bg-lake p-5 text-white sm:min-h-[500px] sm:p-7">
              <motion.div
                animate={{ rotate: [0, 12, 0], y: [0, -6, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-7 top-7 text-saffron"
              >
                <Star className="fill-saffron" size={35} />
              </motion.div>
              <motion.div
                animate={{ rotate: [0, -10, 0], x: [0, -4, 0] }}
                transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[42%] top-20 text-white/45"
              >
                <Plus size={34} strokeWidth={3} />
              </motion.div>

              <div className="comic-speech relative z-10 max-w-[72%] bg-white p-4 text-ink sm:max-w-sm sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-lake">
                  A brand-new adventure
                </p>
                <h1 className="mt-1 text-3xl font-black leading-9 sm:text-4xl sm:leading-[1.1]">
                  Hi! I&apos;m Math Buddy.
                </h1>
                <p className="mt-3 text-sm font-bold leading-6 text-ink/70 sm:text-base">
                  I love turning everyday things into mighty math discoveries.
                </p>
              </div>

              <motion.div
                animate={{ y: [4, -5, 4], rotate: [0, -1.5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-12 -right-3 w-[255px] sm:-bottom-20 sm:right-3 sm:w-[390px]"
              >
                <Image
                  src="/math-buddy.png"
                  alt="Math Buddy waves hello"
                  width={560}
                  height={700}
                  priority
                  className="h-auto w-full object-contain"
                />
              </motion.div>

              <p className="absolute bottom-5 left-5 text-xs font-black uppercase tracking-[0.14em] text-white/70 sm:left-7 sm:bottom-7">
                Issue 01 | Meet your study buddy
              </p>
            </section>

            <section className="comic-panel flex min-h-[360px] flex-col bg-[#fff4b8] p-5 sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8b6200]">
                Your turn
              </p>
              <h2 className="mt-2 text-3xl font-black leading-9 text-ink sm:text-4xl sm:leading-[1.1]">
                What should I call you?
              </h2>
              <p className="mt-3 max-w-md text-base font-bold leading-7 text-ink/65">
                Type your name and I will save it just on this device. No grown-up
                forms. No account needed.
              </p>

              <form
                className="mt-8"
                onSubmit={(event) => {
                  event.preventDefault();
                  continueToPlan();
                }}
              >
                <label className="block text-sm font-black text-ink" htmlFor="learner-name">
                  My name is...
                </label>
                <input
                  id="learner-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (nameError) {
                      setNameError("");
                    }
                  }}
                  autoComplete="given-name"
                  maxLength={24}
                  placeholder="Type your awesome name"
                  className="mt-2 h-14 w-full rounded-md border-2 border-ink bg-white px-4 text-lg font-black text-ink outline-none transition placeholder:text-ink/35 focus:border-lake focus:ring-4 focus:ring-lake/20"
                />
                <p aria-live="polite" className="mt-2 min-h-5 text-sm font-bold text-coral">
                  {nameError}
                </p>
                <button
                  type="submit"
                  className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-ink bg-coral px-4 text-base font-black text-white shadow-[4px_4px_0_#20233a] transition hover:-translate-y-0.5 hover:bg-[#df3f61] active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:focus-ring"
                >
                  Let&apos;s Go!
                  <ChevronRight size={20} strokeWidth={3} />
                </button>
              </form>

              <div className="mt-auto border-t-2 border-ink/15 pt-5">
                <p className="flex items-center gap-2 text-sm font-black text-ink/60">
                  <ShieldCheck className="text-leaf" size={19} />
                  Your name stays in this browser.
                </p>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="math-buddy-plan"
            initial={{ opacity: 0, x: 24, rotate: 1 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -24, rotate: -1 }}
            transition={{ type: "spring", stiffness: 220, damping: 23 }}
            className="mx-auto mt-5 grid w-full max-w-6xl gap-5 lg:grid-cols-[1fr_0.92fr]"
          >
            <section className="comic-panel bg-[#eaf8f1] p-5 sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-leaf">
                Mission briefing
              </p>
              <h1 className="mt-2 text-3xl font-black leading-9 text-ink sm:text-4xl sm:leading-[1.1]">
                Ready, {name}?
              </h1>
              <p className="mt-3 max-w-xl text-base font-bold leading-7 text-ink/65">
                We will use real things, make a little math magic, and show what
                happened step by step.
              </p>

              <div className="mt-6 divide-y-2 divide-ink/10 border-y-2 border-ink/10">
                <ComicPlanStep
                  number="1"
                  icon={ListChecks}
                  title="Build it"
                  text="Use buttons, blocks, coins, paper, or other things you can touch."
                  color="bg-lake text-white"
                />
                <ComicPlanStep
                  number="2"
                  icon={Camera}
                  title="Show it"
                  text="Take one photo before you change your math and one after."
                  color="bg-plum text-white"
                />
                <ComicPlanStep
                  number="3"
                  icon={ScanLine}
                  title="Check it"
                  text="I will help check your steps, then celebrate your clever thinking."
                  color="bg-coral text-white"
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onComplete(name)}
                  className="flex min-h-12 items-center gap-2 rounded-md border-2 border-ink bg-ink px-5 text-base font-black text-white shadow-[4px_4px_0_#249b68] transition hover:-translate-y-0.5 hover:bg-black active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:focus-ring"
                >
                  Start Exploring
                  <ChevronRight size={20} strokeWidth={3} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-black text-ink/60 transition hover:bg-white/70 hover:text-ink focus-visible:focus-ring"
                >
                  <ArrowLeft size={18} />
                  Change my name
                </button>
              </div>
            </section>

            <section className="comic-panel relative min-h-[390px] overflow-hidden bg-coral p-5 text-white sm:min-h-[510px] sm:p-7">
              <motion.div
                animate={{ rotate: [0, 10, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 3.8, repeat: Infinity }}
                className="absolute right-7 top-8 text-saffron"
              >
                <Sparkles size={38} />
              </motion.div>
              <motion.div
                animate={{ rotate: [0, -11, 0], y: [0, -4, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-7 top-[42%] text-white/50"
              >
                <Asterisk size={35} strokeWidth={3} />
              </motion.div>

              <div className="comic-speech relative z-10 max-w-[75%] bg-white p-4 text-ink sm:max-w-sm sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-coral">
                  Math Buddy says
                </p>
                <p className="mt-2 text-xl font-black leading-7 sm:text-2xl sm:leading-8">
                  &quot;You do the building. I will be right here to cheer you on!&quot;
                </p>
              </div>

              <motion.div
                animate={{ y: [4, -5, 4], rotate: [0, 1.5, 0] }}
                transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-14 -right-4 w-[265px] sm:-bottom-20 sm:right-2 sm:w-[420px]"
              >
                <Image
                  src="/math-buddy.png"
                  alt="Math Buddy is ready to explore"
                  width={560}
                  height={700}
                  priority
                  className="h-auto w-full object-contain"
                />
              </motion.div>

              <p className="absolute bottom-5 left-5 text-xs font-black uppercase tracking-[0.14em] text-white/75 sm:left-7 sm:bottom-7">
                Issue 02 | The math club plan
              </p>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ComicPlanStep({
  number,
  icon: Icon,
  title,
  text,
  color,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  text: string;
  color: string;
}) {
  return (
    <div className="flex gap-4 py-4 sm:py-5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-ink text-sm font-black shadow-[2px_2px_0_#20233a] ${color}`}>
        {number}
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-base font-black text-ink">
          <Icon size={18} />
          {title}
        </h2>
        <p className="mt-1 text-sm font-bold leading-6 text-ink/65">{text}</p>
      </div>
    </div>
  );
}

function AppHeader({
  screen,
  setScreen,
  completedCount,
  totalXp,
  learnerName,
}: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  completedCount: number;
  totalXp: number;
  learnerName: string;
}) {
  return (
    <header className="mb-6">
      <div className="flex min-h-20 items-center justify-between gap-3 rounded-lg border border-ink/10 bg-white px-3 py-2 shadow-lift sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <motion.div
            animate={{ y: [0, -3, 0], rotate: [0, 1.5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#fff1a8]"
          >
            <Image
              src="/math-buddy.png"
              alt=""
              width={56}
              height={70}
              priority
              className="h-[68px] w-auto object-contain pt-1"
            />
          </motion.div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-lake">
              Math Explorer
            </p>
            <h1 className="truncate text-xl font-black text-ink sm:text-2xl">
              Hi, {learnerName}!
            </h1>
            <p className="hidden text-xs font-bold text-ink/45 sm:block">
              Math Manipulative Verifier
            </p>
          </div>
        </div>
        <motion.div
          key={totalXp}
          initial={{ scale: 0.82, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          className="flex min-h-12 shrink-0 items-center gap-2 rounded-lg border border-saffron/60 bg-[#fff7d8] px-3 text-ink shadow-button"
        >
          <Zap className="fill-saffron text-[#a87000]" size={19} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink/50">
              XP
            </p>
            <p className="text-lg font-black leading-none">{totalXp}</p>
          </div>
        </motion.div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 gap-1 rounded-lg border border-ink/10 bg-white/95 p-1 shadow-lift backdrop-blur sm:static sm:mt-3 sm:bg-white/80 sm:shadow-sm">
        <HeaderNavButton
          active={screen === "missions"}
          icon={ListChecks}
          label="Missions"
          onClick={() => setScreen("missions")}
        />
        <HeaderNavButton
          active={screen === "progress"}
          icon={BarChart3}
          label="Progress"
          suffix={`${completedCount}/${missions.length}`}
          onClick={() => setScreen("progress")}
        />
        <HeaderNavButton
          active={screen === "parents"}
          icon={HeartHandshake}
          label="Parents"
          onClick={() => setScreen("parents")}
        />
      </nav>
    </header>
  );
}

function HeaderNavButton({
  active,
  icon: Icon,
  label,
  suffix,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  suffix?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-12 items-center justify-center gap-1 overflow-hidden rounded-md px-2 text-xs font-black transition sm:gap-2 sm:px-3 sm:text-sm ${
        active ? "text-white" : "text-ink/60 hover:bg-paper"
      }`}
    >
      {active ? (
        <motion.span
          layoutId="active-navigation"
          className="absolute inset-0 bg-ink"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      ) : null}
      <span className="relative flex items-center gap-1 sm:gap-2">
        <Icon size={19} />
        {label}
        {suffix ? (
          <span
            className={`rounded-md px-1.5 py-0.5 text-xs ${
              active ? "bg-white/20 text-white" : "bg-ink/10 text-ink/60"
            }`}
          >
            {suffix}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function MissionList({
  progress,
  learnerName,
  onOpenMission,
}: {
  progress: ProgressState;
  learnerName: string;
  onOpenMission: (mission: Mission) => void;
}) {
  const completed = Object.values(progress.missions).filter(
    (item) => item.correct,
  ).length;
  const nextMission =
    missions.find((mission) => !progress.missions[mission.id]?.correct) ??
    missions[0];

  return (
    <section className="space-y-7">
      <ExplorerBanner
        completed={completed}
        progress={progress}
        learnerName={learnerName}
        nextMission={nextMission}
        onStart={() => onOpenMission(nextMission)}
      />

      <div>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-coral">
              Mission Trail
            </p>
            <h2 className="mt-1 text-2xl font-black text-ink">
              Pick Your Next Challenge
            </h2>
          </div>
          <span className="shrink-0 rounded-md border border-ink/10 bg-white px-2.5 py-1.5 text-xs font-black text-ink/60 shadow-sm">
            {completed}/{missions.length} complete
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {missions.map((mission, index) => {
            const done = progress.missions[mission.id]?.correct;
            const Icon = conceptIcons[mission.concept];

            return (
              <motion.button
                key={mission.id}
                type="button"
                initial={{ opacity: 0, y: 20, rotate: index % 2 ? 1 : -1 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{
                  delay: index * 0.055,
                  type: "spring",
                  stiffness: 250,
                  damping: 22,
                }}
                whileHover={{ y: -6, rotate: index % 2 ? 0.8 : -0.8 }}
                whileTap={{ y: 1, scale: 0.98 }}
                onClick={() => onOpenMission(mission)}
                className={`group relative flex min-h-[244px] flex-col overflow-hidden rounded-lg border px-4 pb-4 pt-5 text-left shadow-button transition-shadow hover:shadow-lift focus-visible:focus-ring ${conceptCardStyles[mission.concept]}`}
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1.5 ${conceptAccentStyles[mission.concept]}`}
                />
                <div className="flex items-start justify-between gap-3">
                  <motion.div
                    whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
                    transition={{ duration: 0.4 }}
                    className={`flex h-12 w-12 items-center justify-center rounded-lg shadow-sm ${conceptAccentStyles[mission.concept]}`}
                  >
                    <Icon size={25} strokeWidth={2.6} />
                  </motion.div>
                  {done ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 + index * 0.04 }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-leaf text-white shadow-sm"
                      title="Mission mastered"
                    >
                      <Check size={20} strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <span className="rounded-md border border-ink/10 bg-white/70 px-2 py-1 text-xs font-black text-ink/50">
                      {mission.grade}
                    </span>
                  )}
                </div>

                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.14em] text-ink/40">
                  Mission {index + 1} | {mission.concept}
                </p>
                <h3 className="mt-1 text-lg font-black leading-6 text-ink">
                  {mission.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-ink/60">
                  {mission.challenge}
                </p>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink/10 pt-3">
                  <span className="flex items-center gap-3 text-xs font-black text-ink/55">
                    <span className="flex items-center gap-1.5">
                      <Timer size={15} />
                      {mission.durationMinutes} min
                    </span>
                    <span className="flex items-center gap-1.5 text-[#855f00]">
                      <Star className="fill-saffron text-[#a87000]" size={15} />
                      {mission.xp}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-black text-ink/60">
                    {done ? "Replay" : "Start"}
                    <ChevronRight
                      className="transition-transform group-hover:translate-x-1"
                      size={17}
                    />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ExplorerBanner({
  completed,
  progress,
  learnerName,
  nextMission,
  onStart,
}: {
  completed: number;
  progress: ProgressState;
  learnerName: string;
  nextMission: Mission;
  onStart: () => void;
}) {
  const remaining = missions.length - completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative min-h-[230px] overflow-hidden rounded-lg border border-saffron/70 bg-[#fff0a8] px-5 py-5 shadow-lift sm:min-h-[190px] sm:px-7"
    >
      <motion.div
        animate={{ rotate: [0, 14, 0], y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[47%] top-5 text-[#c78b00]/30"
      >
        <Star size={25} />
      </motion.div>
      <motion.div
        animate={{ rotate: [0, -10, 0], x: [0, 4, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 left-[52%] text-coral/25"
      >
        <Plus size={30} strokeWidth={3} />
      </motion.div>

      <div className="relative z-10 max-w-[58%] sm:max-w-[64%]">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8b6200]">
          {completed === missions.length ? "Trail Complete" : `Up Next, ${learnerName}`}
        </p>
        <h2 className="mt-1 text-xl font-black leading-7 text-ink sm:text-3xl sm:leading-9">
          {completed === missions.length
            ? "Amazing Work, Explorer!"
            : nextMission.title}
        </h2>
        <p className="mt-1 text-sm font-bold leading-5 text-ink/60">
          {remaining === 0
            ? "Every mission is mastered. Replay any challenge."
            : nextMission.challenge}
        </p>

        <div className="mt-4 max-w-xs">
          <div className="flex items-center justify-between gap-2 text-xs font-black text-ink/55">
            <span>
              {completed}/{missions.length} missions complete
            </span>
            <span className="flex items-center gap-1 text-[#8b6200]">
              <Timer size={14} />
              {nextMission.durationMinutes} min
            </span>
          </div>
          <div
            aria-label={`${completed} of ${missions.length} missions complete`}
            className="mt-2 grid grid-cols-8 gap-1.5"
          >
            {missions.map((mission, index) => {
              const done = progress.missions[mission.id]?.correct;
              const next = mission.id === nextMission.id && !done;

              return (
                <motion.span
                  key={mission.id}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.045, duration: 0.25 }}
                  title={done ? `${mission.title} mastered` : mission.title}
                  className={`h-2.5 rounded-sm border ${
                    done
                      ? "border-leaf bg-leaf"
                      : next
                        ? "border-ink bg-ink"
                        : "border-ink/15 bg-white/75"
                  }`}
                />
              );
            })}
          </div>
          <button
            type="button"
            onClick={onStart}
            className="mt-3 flex min-h-11 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-white shadow-button transition hover:-translate-y-0.5 hover:bg-black active:translate-y-1 active:shadow-none focus-visible:focus-ring"
          >
            <Zap size={17} />
            {remaining === 0 ? "Replay Trail" : "Start Next"}
          </button>
        </div>
      </div>

      <motion.div
        animate={{ y: [4, -4, 4], rotate: [0, -1.5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-7 -right-1 w-[120px] sm:-bottom-8 sm:right-5 sm:w-[175px]"
      >
        <Image
          src="/math-buddy.png"
          alt=""
          width={560}
          height={700}
          className="h-auto w-full object-contain"
        />
      </motion.div>
    </motion.div>
  );
}

function MissionDetail({
  mission,
  progress,
  prediction,
  setPrediction,
  evidenceFiles,
  evidencePreviews,
  checking,
  result,
  error,
  recentXp,
  onBack,
  onPhotoChange,
  onVerify,
  onRetry,
  onNext,
}: {
  mission: Mission;
  progress: ProgressState;
  prediction: string;
  setPrediction: (value: string) => void;
  evidenceFiles: EvidenceFiles;
  evidencePreviews: EvidencePreviews;
  checking: boolean;
  result: EvaluationResult | null;
  error: string | null;
  recentXp: number;
  onBack: () => void;
  onPhotoChange: (stage: EvidenceStage, file: File | undefined) => void;
  onVerify: () => void;
  onRetry: () => void;
  onNext: () => void;
}) {
  const completed = progress.missions[mission.id]?.correct;
  const canVerify = Boolean(evidenceFiles.setup && evidenceFiles.result);
  const photosReady =
    Number(Boolean(evidenceFiles.setup)) + Number(Boolean(evidenceFiles.result));

  return (
    <section className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.15fr)]">
      <div className="relative overflow-hidden rounded-lg border border-ink/10 bg-white p-4 shadow-lift sm:p-5 lg:sticky lg:top-5 lg:self-start">
        <div
          className={`absolute inset-x-0 top-0 h-2 ${conceptAccentStyles[mission.concept]}`}
        />
        <button
          type="button"
          onClick={onBack}
          className="mb-4 mt-1 inline-flex min-h-10 items-center gap-2 rounded-md border border-ink/10 bg-paper px-3 text-sm font-black text-ink shadow-sm transition hover:-translate-y-0.5 hover:bg-ink hover:text-white focus-visible:focus-ring"
        >
          <ArrowLeft size={18} />
          Missions
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-black ${conceptStyles[mission.concept]}`}
          >
            {mission.concept}
          </span>
          <span className="rounded-md border border-ink/10 bg-white px-2.5 py-1 text-xs font-black text-ink/70">
            {mission.grade}
          </span>
          <span className="rounded-md bg-saffron/20 px-2.5 py-1 text-xs font-black text-[#7b5513]">
            {mission.xp} XP
          </span>
          <span className="flex items-center gap-1 rounded-md bg-ink/5 px-2.5 py-1 text-xs font-black text-ink/55">
            <Timer size={14} />
            {mission.durationMinutes} min
          </span>
          {completed ? (
            <span className="rounded-md bg-leaf/10 px-2.5 py-1 text-xs font-black text-leaf">
              Mastered
            </span>
          ) : null}
        </div>

        <h2 className="mt-4 text-2xl font-black leading-tight text-ink sm:text-3xl">
          {mission.title}
        </h2>

        <div className="mt-4 border-y border-saffron/60 bg-[#fff9dd] py-4">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#8b6200]">
            <Sparkles size={16} />
            Your Challenge
          </p>
          <p className="mt-1 text-lg font-black leading-7 text-ink">
            {mission.challenge}
          </p>
        </div>

        <div className="mt-5">
          <h3 className="flex items-center gap-2 text-sm font-black text-ink">
            <ListChecks className="text-leaf" size={19} />
            Grab These First
          </h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {mission.materials.map((material) => (
              <li
                key={material}
                className="flex min-h-8 items-center gap-2 text-sm font-bold text-ink/70"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf text-white">
                  <Check size={13} strokeWidth={3} />
                </span>
                {material}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-ink">Do These 2 Steps</h3>
          <span className="text-xs font-bold text-ink/45">Show each step clearly</span>
        </div>
        <div className="mt-2 divide-y divide-ink/10 border-y border-ink/10">
          {(["setup", "result"] as EvidenceStage[]).map((stage, index) => (
            <motion.div
              key={stage}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + index * 0.08 }}
              className="flex gap-3 py-4"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-black shadow-sm ${evidenceStageAccent[stage]}`}>
                {index + 1}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/40">
                  Step {index + 1} | {evidenceStageLabels[stage]}
                </p>
                <h3 className="mt-1 text-sm font-black text-ink">
                  {mission.evidence[stage].title}
                </h3>
                <p className="mt-1 text-sm font-bold leading-5 text-ink/70">
                  {mission.evidence[stage].action}
                </p>
                <p className="mt-1 flex gap-1.5 text-xs leading-5 text-ink/50">
                  <Camera className="mt-0.5 shrink-0" size={14} />
                  <span>{mission.evidence[stage].photoTip}</span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <label className="mt-6 flex items-center justify-between gap-3 text-sm font-black text-ink" htmlFor="prediction">
          {mission.predictionLabel}
          <span className="shrink-0 text-xs font-bold text-ink/40">Optional guess</span>
        </label>
        <input
          id="prediction"
          value={prediction}
          onChange={(event) => setPrediction(event.target.value)}
          inputMode={mission.promptMode === "measurement" ? "decimal" : "text"}
          placeholder="Type your guess"
          className="mt-2 h-12 w-full rounded-lg border-2 border-ink/10 bg-paper px-3 text-base font-bold text-ink outline-none transition placeholder:text-ink/30 focus:border-lake focus:bg-white focus:ring-4 focus:ring-lake/20"
        />

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 text-xs font-black">
            <span className="text-ink/60">Photos ready</span>
            <span className={canVerify ? "text-leaf" : "text-ink/40"}>
              {photosReady}/2
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10">
            <motion.div
              animate={{ width: `${photosReady * 50}%` }}
              className="h-full bg-leaf"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onVerify}
          disabled={!canVerify || checking}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-3 text-sm font-black text-white shadow-button transition enabled:hover:-translate-y-0.5 enabled:hover:bg-black enabled:active:translate-y-1 enabled:active:shadow-none disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          {checking ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <ScanLine size={19} />
          )}
          {checking ? "Math Buddy Is Checking..." : "Check My Math"}
        </button>
        {!canVerify ? (
          <p className="mt-2 text-center text-xs font-bold text-ink/45">
            Take both photos to unlock the check button.
          </p>
        ) : (
          <p className="mt-2 text-center text-xs font-bold text-leaf">
            Both photos are ready. Nice work!
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {(["setup", "result"] as EvidenceStage[]).map((stage, index) => (
            <EvidenceCapture
              key={stage}
              mission={mission}
              stage={stage}
              stepNumber={index + 1}
              file={evidenceFiles[stage]}
              previewUrl={evidencePreviews[stage]}
              checking={checking}
              onPhotoChange={onPhotoChange}
            />
          ))}
        </div>

        {error ? <ErrorPanel message={error} /> : null}
        {result ? (
          <FeedbackPanel
            mission={mission}
            result={result}
            progress={progress}
            recentXp={recentXp}
            onRetry={onRetry}
            onNext={onNext}
          />
        ) : null}
      </div>
    </section>
  );
}

function EvidenceCapture({
  mission,
  stage,
  stepNumber,
  file,
  previewUrl,
  checking,
  onPhotoChange,
}: {
  mission: Mission;
  stage: EvidenceStage;
  stepNumber: number;
  file: File | null;
  previewUrl: string | null;
  checking: boolean;
  onPhotoChange: (stage: EvidenceStage, file: File | undefined) => void;
}) {
  const inputId = `${stage}-photo-${mission.id}`;
  const checkpoint = mission.evidence[stage];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotate: stage === "setup" ? -1 : 1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className={`overflow-hidden rounded-lg border shadow-button ${evidenceStageSurface[stage]}`}
    >
      <div className="flex min-h-16 items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-black shadow-sm ${evidenceStageAccent[stage]}`}>
            {stepNumber}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/50">
              {evidenceStageLabels[stage]}
            </p>
            <h3 className="truncate text-sm font-black text-ink">
              {checkpoint.title}
            </h3>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={file ? "attached" : "ready"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${
              file ? "bg-leaf/15 text-leaf" : "bg-white/70 text-ink/45"
            }`}
          >
            {file ? <Check size={13} strokeWidth={3} /> : <Camera size={13} />}
            {file ? "Attached" : "Ready"}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/60">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`${checkpoint.title} evidence`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center border-b border-dashed border-ink/20 px-4 text-center text-ink/50 sm:px-6">
            <motion.div
              animate={{ y: [0, -5, 0], rotate: [0, -3, 3, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className={`flex h-14 w-14 items-center justify-center rounded-lg ${evidenceStageAccent[stage]}`}
            >
              <Camera size={28} />
            </motion.div>
            <p className="mt-3 text-sm font-black leading-5 text-ink/70">
              {checkpoint.action}
            </p>
            <p className="mt-1 text-xs font-bold leading-5 text-ink/45">
              Photo tip: {checkpoint.photoTip}
            </p>
          </div>
        )}
        {previewUrl && !checking ? (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-ink/85 px-2.5 py-1.5 text-xs font-black text-white shadow-sm">
            <Check size={14} className="text-[#8ce0b6]" strokeWidth={3} />
            Photo attached
          </div>
        ) : null}
        {checking && previewUrl ? (
          <>
            <div className="absolute inset-0 bg-ink/10" />
            <motion.div
              initial={{ top: "5%" }}
              animate={{ top: ["5%", "92%", "5%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-x-0 h-1 bg-saffron shadow-[0_0_12px_rgba(255,200,61,0.9)]"
            />
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-ink px-2.5 py-1.5 text-xs font-black text-white shadow-sm">
              <ScanLine size={15} />
              Scanning
            </div>
          </>
        ) : null}
      </div>

      <label
        htmlFor={inputId}
        className={`mx-3 mb-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-sm font-black shadow-button transition ${
          checking
            ? "pointer-events-none opacity-50"
            : stage === "setup"
              ? "bg-lake text-white hover:-translate-y-0.5 hover:bg-[#2467cb] active:translate-y-1 active:shadow-none"
              : "bg-plum text-white hover:-translate-y-0.5 hover:bg-[#5e4194] active:translate-y-1 active:shadow-none"
        }`}
      >
        <Camera size={18} />
        {file
          ? `Replace ${evidenceStageLabels[stage]}`
          : `Take ${evidenceStageLabels[stage]}`}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => onPhotoChange(stage, event.target.files?.[0])}
      />
    </motion.div>
  );
}

function FeedbackPanel({
  mission,
  result,
  progress,
  recentXp,
  onRetry,
  onNext,
}: {
  mission: Mission;
  result: EvaluationResult;
  progress: ProgressState;
  recentXp: number;
  onRetry: () => void;
  onNext: () => void;
}) {
  const correct = result.status === "correct";
  const retake = result.status === "retake";
  const levelPercent = progress.totalXp % 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`rounded-lg border p-4 shadow-lift ${
        correct
          ? "border-leaf/25 bg-leaf/10"
          : retake
            ? "border-saffron/30 bg-saffron/20"
            : "border-coral/25 bg-coral/10"
      }`}
    >
      <div className="flex items-start gap-3">
        {correct ? (
          <SuccessMark />
        ) : retake ? (
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-saffron/25 text-[#7b5513]"
          >
            <Camera size={24} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ rotate: -12, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-coral/20 text-coral"
          >
            <X size={24} />
          </motion.div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-ink">
            {correct
              ? "Method and Result Verified"
              : retake
                ? "Clearer Evidence Needed"
                : "Check the Highlighted Step"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-ink/70">{result.explanation}</p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
        {result.checkpoints.map((checkpoint) => (
          <CheckpointFeedback
            key={checkpoint.stage}
            checkpoint={checkpoint}
          />
        ))}
      </div>

      {result.prediction ? (
        <div className="mt-4 border-t border-ink/10 pt-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/50">
            Prediction
          </p>
          <p className="mt-1 text-sm font-bold text-ink">
            {result.prediction.value}
          </p>
          <p className="mt-1 text-sm text-ink/70">{result.prediction.message}</p>
        </div>
      ) : null}

      {correct ? (
        <div className="mt-4 border-t border-ink/10 pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-ink">
              {recentXp > 0 ? `+${recentXp} XP earned` : `${mission.title} mastered`}
            </p>
            <p className="text-sm font-black text-ink/60">{progress.totalXp} XP</p>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-leaf"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-sm font-black text-ink shadow-button transition hover:-translate-y-0.5 hover:bg-ink hover:text-white active:translate-y-1 active:shadow-none focus-visible:focus-ring"
        >
          <RotateCcw size={18} />
          {correct ? "Review Again" : "Redo Highlighted"}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-3 text-sm font-black text-white shadow-button transition hover:-translate-y-0.5 hover:bg-black active:translate-y-1 active:shadow-none focus-visible:focus-ring"
        >
          <ChevronRight size={18} />
          Next
        </button>
      </div>
    </motion.div>
  );
}

function CheckpointFeedback({
  checkpoint,
}: {
  checkpoint: EvaluationResult["checkpoints"][number];
}) {
  const correct = checkpoint.status === "correct";
  const retake = checkpoint.status === "retake";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-3 py-4"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
          correct
            ? "bg-leaf/20 text-leaf"
            : retake
              ? "bg-saffron/25 text-[#7b5513]"
              : "bg-coral/20 text-coral"
        }`}
      >
        {correct ? (
          <Check size={19} />
        ) : retake ? (
          <Camera size={18} />
        ) : (
          <X size={19} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/50">
          {checkpoint.stage} checkpoint
        </p>
        <h4 className="mt-0.5 text-sm font-black text-ink">
          {checkpoint.title}
        </h4>
        <p className="mt-1 text-sm leading-5 text-ink/70">
          {checkpoint.explanation}
        </p>
        <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
          <p className="font-bold text-ink/60">
            <span className="text-ink/40">Detected: </span>
            {checkpoint.actual}
          </p>
          <p className="font-bold text-ink/60">
            <span className="text-ink/40">Needed: </span>
            {checkpoint.needed}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SuccessMark() {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      {Array.from({ length: 8 }).map((_, index) => (
        <motion.span
          key={index}
          className={`absolute h-1.5 w-2 rounded-sm ${
            index % 2 ? "bg-saffron" : "bg-leaf"
          }`}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0.6],
            x: Math.cos((index / 8) * Math.PI * 2) * 28,
            y: Math.sin((index / 8) * Math.PI * 2) * 28,
          }}
          transition={{ duration: 0.7, delay: index * 0.025 }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.6, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 18 }}
        className="flex h-12 w-12 items-center justify-center rounded-lg bg-leaf text-white"
      >
        <Check size={28} strokeWidth={3} />
      </motion.div>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-lg border border-coral/25 bg-coral/10 p-4 text-sm font-bold leading-6 text-ink shadow-sm"
    >
      {message}
    </motion.div>
  );
}

function ParentCenter({
  progress,
  onOpenMission,
}: {
  progress: ProgressState;
  onOpenMission: (mission: Mission) => void;
}) {
  const [shareStatus, setShareStatus] = useState("");
  const snapshot = getParentSnapshot(progress);
  const recentVerified = [...snapshot.verifiedMissions].sort((first, second) => {
    const firstDate = progress.missions[first.id]?.completedAt ?? "";
    const secondDate = progress.missions[second.id]?.completedAt ?? "";
    return secondDate.localeCompare(firstDate);
  });
  const reportText = buildParentReport(snapshot, progress);

  async function shareReport() {
    setShareStatus("");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Math learning update",
          text: reportText,
        });
        setShareStatus("Update shared.");
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(reportText);
        setShareStatus("Update copied to your clipboard.");
        return;
      }

      setShareStatus("Sharing is not available in this browser.");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        return;
      }

      setShareStatus("Could not share the update. Please try again.");
    }
  }

  return (
    <section aria-label="Parent Center" className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-lift"
      >
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div className="flex max-w-2xl gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink text-white shadow-button">
              <ShieldCheck size={25} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-plum">
                Parent Center
              </p>
              <h2 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
                Learning You Can See
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-ink/65">
                {snapshot.summary} Every completed mission includes a checked
                starting setup and final result.
              </p>
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <button
              type="button"
              onClick={shareReport}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-white shadow-button transition hover:-translate-y-0.5 hover:bg-black active:translate-y-1 active:shadow-none focus-visible:focus-ring"
            >
              <Share2 size={18} />
              Share Update
            </button>
            <p aria-live="polite" className="mt-2 max-w-52 text-xs font-bold text-ink/50">
              {shareStatus || "Shares progress only, never photos."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-ink/10 border-t border-ink/10">
          <ParentStat
            icon={ShieldCheck}
            label="Verified"
            value={`${snapshot.verifiedMissions.length}/${missions.length}`}
            detail="missions"
            color="text-leaf"
          />
          <ParentStat
            icon={RotateCcw}
            label="Practice"
            value={`${snapshot.needsPractice.length}`}
            detail="to revisit"
            color="text-coral"
          />
          <ParentStat
            icon={Flame}
            label="Streak"
            value={`${progress.streak}`}
            detail="active days"
            color="text-[#b36d00]"
          />
        </div>
      </motion.section>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.section
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-lg border border-lake/25 bg-[#f1f7ff] p-5 shadow-button sm:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lake text-white shadow-sm">
              <Star className="fill-white" size={21} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-lake">
                Recommended Next
              </p>
              <h3 className="mt-1 text-xl font-black text-ink">
                {snapshot.recommendedMission.title}
              </h3>
              <p className="mt-1 text-sm font-bold leading-6 text-ink/65">
                {snapshot.recommendationReason}
              </p>
            </div>
          </div>

          <div className="mt-5 border-y border-lake/15 py-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/45">
              Have Ready
            </p>
            <p className="mt-1 text-sm font-bold text-ink/70">
              {snapshot.recommendedMission.materials.join(" | ")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenMission(snapshot.recommendedMission)}
            className="mt-4 flex min-h-11 items-center gap-2 rounded-lg bg-lake px-4 text-sm font-black text-white shadow-button transition hover:-translate-y-0.5 hover:bg-[#2467cb] active:translate-y-1 active:shadow-none focus-visible:focus-ring"
          >
            Open Next Activity
            <ChevronRight size={18} />
          </button>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-lg border border-saffron/45 bg-[#fff9df] p-5 shadow-button sm:p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-saffron text-ink shadow-sm">
              <Lightbulb size={21} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8b6200]">
                60-Second Coach
              </p>
              <h3 className="mt-1 text-xl font-black text-ink">Ask, Then Listen</h3>
            </div>
          </div>

          <p className="mt-5 text-sm font-black leading-6 text-ink">
            “{parentConversationStarter(snapshot.recommendedMission)}”
          </p>
          <div className="mt-5 border-t border-[#d5ab22]/30 pt-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8b6200]">
              Why This Helps
            </p>
            <p className="mt-1 text-sm font-bold leading-6 text-ink/65">
              {snapshot.recommendedMission.explainer}
            </p>
          </div>
        </motion.section>
      </div>

      <section className="rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-aqua">
              Learning Record
            </p>
            <h2 className="mt-1 text-xl font-black text-ink">Verified Evidence</h2>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-black text-ink/50">
            <CalendarDays size={16} />
            Stored on this device
          </span>
        </div>

        {recentVerified.length ? (
          <div className="divide-y divide-ink/10">
            {recentVerified.map((mission) => {
              const completedAt = progress.missions[mission.id]?.completedAt;
              const Icon = conceptIcons[mission.concept];

              return (
                <div
                  key={mission.id}
                  className="flex items-center gap-3 px-5 py-4 sm:px-6"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${conceptAccentStyles[mission.concept]}`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-ink">{mission.title}</p>
                    <p className="mt-0.5 text-xs font-bold text-ink/50">
                      {mission.concept} | setup and result verified
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Check className="ml-auto text-leaf" size={19} strokeWidth={3} />
                    <p className="mt-1 text-xs font-bold text-ink/45">
                      {formatProgressDate(completedAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-8 text-center sm:px-6">
            <ShieldCheck className="mx-auto text-ink/20" size={32} />
            <p className="mt-3 text-sm font-black text-ink">No verified missions yet</p>
            <p className="mt-1 text-sm font-bold text-ink/50">
              The first completed activity will appear here with its evidence status.
            </p>
          </div>
        )}

        {snapshot.needsPractice.length ? (
          <div className="border-t border-ink/10 bg-[#fff5f7] px-5 py-4 sm:px-6">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-coral">
              <RotateCcw size={16} />
              Practice Queue
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {snapshot.needsPractice.map((mission) => (
                <button
                  key={mission.id}
                  type="button"
                  onClick={() => onOpenMission(mission)}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-coral/20 bg-white px-3 text-left text-sm font-black text-ink shadow-sm transition hover:border-coral hover:text-coral focus-visible:focus-ring"
                >
                  <span>{mission.title}</span>
                  <ChevronRight className="shrink-0" size={17} />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <p className="flex items-start gap-2 px-1 text-xs font-bold leading-5 text-ink/45">
        <HeartHandshake className="mt-0.5 shrink-0" size={15} />
        This report uses local completion data only. Uploaded photos are not saved
        in the report or included when an update is shared.
      </p>
    </section>
  );
}

function ParentStat({
  icon: Icon,
  label,
  value,
  detail,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="min-w-0 px-3 py-4 text-center sm:px-5">
      <Icon className={`mx-auto ${color}`} size={18} />
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-ink/45">
        {label}
      </p>
      <p className="mt-0.5 truncate text-lg font-black text-ink">{value}</p>
      <p className="text-[10px] font-bold text-ink/45">{detail}</p>
    </div>
  );
}

function parentConversationStarter(mission: Mission) {
  switch (mission.concept) {
    case "Addition":
      return "How can you check that both piles are included in the total?";
    case "Subtraction":
      return "How can you show which objects were taken away and which stayed?";
    case "Multiplication":
      return "How many are in one group, and how many groups do you have?";
    case "Division":
      return "How can you prove that every group was shared fairly?";
    case "Fractions":
      return "Do the parts look fair? How could you check before you decide?";
    case "Geometry":
      return "Where do you see the square corner in your paper fold?";
    case "Measurement":
      return "Where does the ruler start, and where does the pencil end?";
  }
}

function formatProgressDate(value: string | undefined) {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function buildParentReport(
  snapshot: ReturnType<typeof getParentSnapshot>,
  progress: ProgressState,
) {
  const verifiedNames = snapshot.verifiedMissions.map((mission) => mission.title);
  const needsPracticeNames = snapshot.needsPractice.map((mission) => mission.title);

  return [
    "Math Manipulative Verifier: learning update",
    snapshot.summary,
    `Verified activities: ${verifiedNames.length ? verifiedNames.join(", ") : "None yet"}.`,
    `Next activity: ${snapshot.recommendedMission.title}.`,
    snapshot.recommendationReason,
    `Activities to revisit: ${needsPracticeNames.length ? needsPracticeNames.join(", ") : "None right now"}.`,
    `Current learning streak: ${progress.streak} day${progress.streak === 1 ? "" : "s"}.`,
    "This update contains progress only. It does not include photos.",
  ].join("\n");
}

function ProgressScreen({
  progress,
  onReset,
}: {
  progress: ProgressState;
  onReset: () => void;
}) {
  const badges = getBadges(progress);
  const mastery = getMastery(progress);
  const completed = Object.values(progress.missions).filter((item) => item.correct);
  const badgeSurfaces = [
    "border-lake/30 bg-[#f1f7ff] text-lake",
    "border-coral/30 bg-[#fff3f6] text-coral",
    "border-leaf/30 bg-[#effaf5] text-leaf",
    "border-plum/30 bg-[#f6f2ff] text-plum",
    "border-saffron/50 bg-[#fff9df] text-[#8b6200]",
  ];

  return (
    <section className="space-y-7">
      <ProgressHero
        totalXp={progress.totalXp}
        streak={progress.streak}
        completed={completed.length}
      />

      <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-plum">
                Trophy Shelf
              </p>
              <h2 className="mt-1 text-2xl font-black text-ink">Your Badges</h2>
            </div>
            <Sparkles className="text-plum" size={24} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07 }}
                whileHover={badge.earned ? { y: -3, rotate: -0.5 } : undefined}
                className={`flex min-h-20 items-center gap-3 rounded-lg border p-3 shadow-sm ${
                  badge.earned
                    ? badgeSurfaces[index % badgeSurfaces.length]
                    : "border-ink/10 bg-white text-ink/40"
                }`}
              >
                <motion.div
                  animate={
                    badge.earned
                      ? { rotate: [0, -7, 7, 0], scale: [1, 1.08, 1] }
                      : undefined
                  }
                  transition={{ duration: 0.55, delay: 0.3 + index * 0.08 }}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                    badge.earned ? "bg-white/70" : "bg-ink/5"
                  }`}
                >
                  {badge.earned ? (
                    <Trophy size={24} />
                  ) : (
                    <Star size={23} />
                  )}
                </motion.div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-60">
                    {badge.earned ? "Unlocked" : "Keep Exploring"}
                  </p>
                  <h3 className="mt-0.5 text-sm font-black">{badge.title}</h3>
                </div>
                {badge.earned ? (
                  <Check className="ml-auto shrink-0" size={19} strokeWidth={3} />
                ) : null}
              </motion.div>
            ))}
          </div>

          <button
            type="button"
            onClick={onReset}
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-sm font-black text-ink/60 shadow-sm transition hover:border-coral/30 hover:bg-[#fff3f6] hover:text-coral focus-visible:focus-ring"
          >
            <RotateCcw size={18} />
            Reset Progress
          </button>
        </section>

        <section>
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-aqua">
              Skill Map
            </p>
            <h2 className="mt-1 text-2xl font-black text-ink">
              Concept Mastery
            </h2>
          </div>

          <div className="grid gap-3">
          {mastery.map((item) => {
            const percent = item.total ? (item.completed / item.total) * 100 : 0;
            const Icon = conceptIcons[item.concept];

            return (
              <motion.div
                key={item.concept}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ x: 3 }}
                className={`rounded-lg border p-4 shadow-sm ${conceptCardStyles[item.concept]}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${conceptAccentStyles[item.concept]}`}
                  >
                    <Icon size={21} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-black text-ink">
                        {item.concept}
                      </h3>
                      <span className="text-xs font-black text-ink/50">
                        {item.completed}/{item.total}
                      </span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full border border-ink/10 bg-white/75">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{
                          duration: 0.7,
                          delay: 0.08,
                          ease: "easeOut",
                        }}
                        className={`h-full ${conceptAccentStyles[item.concept]}`}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <span className="text-xs font-black text-ink/50">
                    {item.attempts} attempt{item.attempts === 1 ? "" : "s"}
                  </span>
                </div>
              </motion.div>
            );
          })}
          </div>
        </section>
      </div>
    </section>
  );
}

function ProgressHero({
  totalXp,
  streak,
  completed,
}: {
  totalXp: number;
  streak: number;
  completed: number;
}) {
  const level = Math.floor(totalXp / 100) + 1;
  const levelPercent = totalXp % 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative min-h-[200px] overflow-hidden rounded-lg border border-lake/25 bg-[#dcecff] p-5 shadow-lift sm:p-7"
    >
      <motion.div
        animate={{ rotate: [0, 10, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 3.8, repeat: Infinity }}
        className="absolute left-[48%] top-6 text-lake/20"
      >
        <Sparkles size={31} />
      </motion.div>

      <div className="relative z-10 max-w-[58%] sm:max-w-[66%]">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-lake">
          Explorer Level {level}
        </p>
        <div className="mt-1 flex items-end gap-2">
          <motion.h2
            key={totalXp}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-5xl font-black leading-none text-ink"
          >
            {totalXp}
          </motion.h2>
          <span className="pb-1 text-sm font-black text-ink/50">total XP</span>
        </div>

        <div className="mt-4 max-w-sm">
          <div className="h-3 overflow-hidden rounded-full border border-ink/10 bg-white/75">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-saffron"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-black text-ink/60">
            <span className="flex items-center gap-1.5">
              <Flame className="fill-coral text-coral" size={17} />
              {streak} day{streak === 1 ? "" : "s"} streak
            </span>
            <span className="flex items-center gap-1.5">
              <Trophy className="text-[#9a6b00]" size={17} />
              {completed}/{missions.length} mastered
            </span>
          </div>
        </div>
      </div>

      <motion.div
        animate={{ y: [4, -4, 4], rotate: [0, 1.5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-7 -right-1 w-[120px] sm:-bottom-10 sm:right-6 sm:w-[180px]"
      >
        <Image
          src="/math-buddy.png"
          alt=""
          width={560}
          height={700}
          className="h-auto w-full object-contain"
        />
      </motion.div>
    </motion.div>
  );
}
