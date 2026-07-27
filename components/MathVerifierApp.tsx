"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Camera,
  Check,
  ChevronRight,
  ClipboardCheck,
  ImageUp,
  ListChecks,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { EvaluationResult } from "@/lib/evaluate";
import { concepts, missions, type Concept, type Mission } from "@/lib/missions";
import {
  emptyProgress,
  getBadges,
  getMastery,
  loadProgress,
  recordMissionAttempt,
  saveProgress,
  type ProgressState,
} from "@/lib/progress";

type Screen = "missions" | "progress";

type VerificationResponse = {
  vision?: unknown;
  evaluation?: EvaluationResult;
  error?: string;
};

const conceptStyles: Record<Concept, string> = {
  Addition: "border-lake/25 bg-lake/10 text-lake",
  Subtraction: "border-coral/25 bg-coral/10 text-coral",
  Multiplication: "border-leaf/25 bg-leaf/10 text-leaf",
  Division: "border-plum/25 bg-plum/10 text-plum",
  Fractions: "border-saffron/30 bg-saffron/15 text-[#936414]",
  Geometry: "border-ink/20 bg-ink/10 text-ink",
  Measurement: "border-[#1e9e95]/25 bg-[#1e9e95]/10 text-[#16766f]",
};

export default function MathVerifierApp() {
  const [screen, setScreen] = useState<Screen>("missions");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [prediction, setPrediction] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentXp, setRecentXp] = useState(0);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const completedCount = useMemo(
    () => Object.values(progress.missions).filter((item) => item.correct).length,
    [progress.missions],
  );

  const groupedMissions = useMemo(
    () =>
      concepts
        .map((concept) => ({
          concept,
          missions: missions.filter((mission) => mission.concept === concept),
        }))
        .filter((group) => group.missions.length > 0),
    [],
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
    setPhoto(null);
    setResult(null);
    setError(null);
    setRecentXp(0);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }

  function handlePhotoChange(file: File | undefined) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setResult(null);
    setError(null);
    setRecentXp(0);
    setPhoto(file ?? null);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function verifyPhoto() {
    if (!selectedMission || !photo) {
      return;
    }

    setChecking(true);
    setError(null);
    setResult(null);
    setRecentXp(0);

    const body = new FormData();
    body.append("missionId", selectedMission.id);
    body.append("prediction", prediction);
    body.append("image", photo);

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

  function resetProgress() {
    const next = emptyProgress;
    setProgress(next);
    saveProgress(next);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <AppHeader
        screen={screen}
        setScreen={setScreen}
        completedCount={completedCount}
        totalXp={progress.totalXp}
      />

      <AnimatePresence mode="wait">
        {screen === "progress" ? (
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
              photo={photo}
              previewUrl={previewUrl}
              checking={checking}
              result={result}
              error={error}
              recentXp={recentXp}
              onBack={backToList}
              onPhotoChange={handlePhotoChange}
              onVerify={verifyPhoto}
              onRetry={() => {
                setResult(null);
                setError(null);
                setRecentXp(0);
              }}
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
              groupedMissions={groupedMissions}
              progress={progress}
              onOpenMission={openMission}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function AppHeader({
  screen,
  setScreen,
  completedCount,
  totalXp,
}: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  completedCount: number;
  totalXp: number;
}) {
  return (
    <header className="mb-5 flex flex-col gap-4 border-b border-ink/10 pb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/manipulatives.svg"
            alt=""
            width={96}
            height={60}
            className="h-14 w-20 shrink-0 rounded-lg border border-ink/10 object-cover shadow-sm"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-leaf">
              Hands-on math
            </p>
            <h1 className="truncate text-2xl font-black text-ink sm:text-3xl">
              Math Manipulative Verifier
            </h1>
          </div>
        </div>
        <div className="hidden rounded-lg border border-ink/10 bg-white/70 px-4 py-3 text-right shadow-sm sm:block">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/55">
            XP
          </p>
          <p className="text-2xl font-black text-ink">{totalXp}</p>
        </div>
      </div>

      <nav className="grid grid-cols-2 gap-2 rounded-lg border border-ink/10 bg-white/65 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setScreen("missions")}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-bold transition ${
            screen === "missions"
              ? "bg-ink text-white shadow-sm"
              : "text-ink/70 hover:bg-white"
          }`}
        >
          <ListChecks size={18} />
          Missions
        </button>
        <button
          type="button"
          onClick={() => setScreen("progress")}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-bold transition ${
            screen === "progress"
              ? "bg-ink text-white shadow-sm"
              : "text-ink/70 hover:bg-white"
          }`}
        >
          <BarChart3 size={18} />
          Progress
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs">
            {completedCount}/{missions.length}
          </span>
        </button>
      </nav>
    </header>
  );
}

function MissionList({
  groupedMissions,
  progress,
  onOpenMission,
}: {
  groupedMissions: { concept: Concept; missions: Mission[] }[];
  progress: ProgressState;
  onOpenMission: (mission: Mission) => void;
}) {
  return (
    <section className="space-y-6">
      {groupedMissions.map((group) => (
        <div key={group.concept} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-ink">{group.concept}</h2>
            <span
              className={`rounded-md border px-2.5 py-1 text-xs font-black ${conceptStyles[group.concept]}`}
            >
              {group.missions.length} mission{group.missions.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.missions.map((mission) => {
              const done = progress.missions[mission.id]?.correct;

              return (
                <motion.button
                  key={mission.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOpenMission(mission)}
                  className="group min-h-40 rounded-lg border border-ink/10 bg-white/78 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft focus-visible:focus-ring"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span
                      className={`rounded-md border px-2.5 py-1 text-xs font-black ${conceptStyles[mission.concept]}`}
                    >
                      {mission.grade}
                    </span>
                    <span className="flex items-center gap-1 rounded-md bg-saffron/20 px-2 py-1 text-xs font-black text-[#7b5513]">
                      <Trophy size={14} />
                      {mission.xp} XP
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${conceptStyles[mission.concept]}`}
                    >
                      {done ? <Check size={20} /> : <ClipboardCheck size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-ink">
                        {mission.title}
                      </h3>
                      <p className="mt-1 line-clamp-3 text-sm leading-5 text-ink/68">
                        {mission.instruction}
                      </p>
                    </div>
                    <ChevronRight
                      className="mt-2 shrink-0 text-ink/35 transition group-hover:translate-x-0.5 group-hover:text-ink"
                      size={20}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function MissionDetail({
  mission,
  progress,
  prediction,
  setPrediction,
  photo,
  previewUrl,
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
  photo: File | null;
  previewUrl: string | null;
  checking: boolean;
  result: EvaluationResult | null;
  error: string | null;
  recentXp: number;
  onBack: () => void;
  onPhotoChange: (file: File | undefined) => void;
  onVerify: () => void;
  onRetry: () => void;
  onNext: () => void;
}) {
  const inputId = `photo-${mission.id}`;
  const completed = progress.missions[mission.id]?.correct;

  return (
    <section className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="rounded-lg border border-ink/10 bg-white/82 p-4 shadow-sm sm:p-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-ink/10 bg-white px-3 text-sm font-bold text-ink transition hover:bg-ink hover:text-white focus-visible:focus-ring"
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
          {completed ? (
            <span className="rounded-md bg-leaf/12 px-2.5 py-1 text-xs font-black text-leaf">
              Mastered
            </span>
          ) : null}
        </div>

        <h2 className="mt-4 text-3xl font-black leading-tight text-ink">
          {mission.title}
        </h2>
        <p className="mt-3 text-base leading-7 text-ink/72">{mission.instruction}</p>

        <label className="mt-6 block text-sm font-black text-ink" htmlFor="prediction">
          {mission.predictionLabel}
        </label>
        <input
          id="prediction"
          value={prediction}
          onChange={(event) => setPrediction(event.target.value)}
          inputMode={mission.promptMode === "measurement" ? "decimal" : "text"}
          placeholder="Optional"
          className="mt-2 h-12 w-full rounded-lg border border-ink/12 bg-white px-3 text-base font-semibold text-ink outline-none transition placeholder:text-ink/35 focus:border-lake focus:ring-4 focus:ring-lake/15"
        />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label
            htmlFor={inputId}
            className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-lake px-3 text-sm font-black text-white shadow-sm transition hover:bg-[#2766a8]"
          >
            <Camera size={18} />
            Take Photo
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => onPhotoChange(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={onVerify}
            disabled={!photo || checking}
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-3 text-sm font-black text-white shadow-sm transition enabled:hover:bg-black disabled:cursor-not-allowed disabled:bg-ink/30"
          >
            {checking ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <ImageUp size={18} />
            )}
            Verify
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="min-h-[280px] rounded-lg border border-ink/10 bg-white/82 p-3 shadow-sm">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Selected mission photo"
              className="h-full max-h-[420px] min-h-[250px] w-full rounded-md object-cover"
            />
          ) : (
            <div className="flex min-h-[250px] flex-col items-center justify-center rounded-md border border-dashed border-ink/20 bg-chalk/70 px-6 text-center text-ink/55">
              <Camera size={42} />
              <p className="mt-3 text-sm font-bold">Photo preview</p>
            </div>
          )}
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-4 shadow-sm ${
        correct
          ? "border-leaf/25 bg-leaf/10"
          : retake
            ? "border-saffron/30 bg-saffron/15"
            : "border-coral/25 bg-coral/10"
      }`}
    >
      <div className="flex items-start gap-3">
        {correct ? (
          <SuccessMark />
        ) : retake ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-saffron/25 text-[#7b5513]">
            <Camera size={24} />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-coral/15 text-coral">
            <X size={24} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-ink">
            {correct ? "Verified" : retake ? "Retake" : "Try Again"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-ink/72">{result.explanation}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FactTile label="Detected" value={result.actual} />
        <FactTile label="Needed" value={result.needed} />
      </div>

      {result.prediction ? (
        <div className="mt-3 rounded-lg border border-ink/10 bg-white/75 p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/50">
            Prediction
          </p>
          <p className="mt-1 text-sm font-bold text-ink">
            {result.prediction.value}
          </p>
          <p className="mt-1 text-sm text-ink/68">{result.prediction.message}</p>
        </div>
      ) : null}

      {correct ? (
        <div className="mt-4 rounded-lg border border-ink/10 bg-white/75 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-ink">
              {recentXp > 0 ? `+${recentXp} XP earned` : `${mission.title} mastered`}
            </p>
            <p className="text-sm font-black text-ink/65">{progress.totalXp} XP</p>
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
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-sm font-black text-ink transition hover:bg-ink hover:text-white focus-visible:focus-ring"
        >
          <RotateCcw size={18} />
          Retry
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-3 text-sm font-black text-white transition hover:bg-black focus-visible:focus-ring"
        >
          <ChevronRight size={18} />
          Next
        </button>
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
          className="absolute h-1.5 w-1.5 rounded-full bg-leaf"
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

function FactTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white/75 p-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/50">
        {label}
      </p>
      <p className="mt-1 text-sm font-black leading-5 text-ink">{value}</p>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-coral/25 bg-coral/10 p-4 text-sm font-bold leading-6 text-ink">
      {message}
    </div>
  );
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
  const levelPercent = progress.totalXp % 100;

  return (
    <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        <div className="rounded-lg border border-ink/10 bg-white/82 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-leaf">
                Total XP
              </p>
              <h2 className="mt-1 text-5xl font-black text-ink">{progress.totalXp}</h2>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-saffron/20 text-[#7b5513]">
              <Trophy size={30} />
            </div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-ink/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelPercent}%` }}
              className="h-full rounded-full bg-saffron"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <FactTile label="Streak" value={`${progress.streak} day`} />
            <FactTile label="Mastered" value={`${completed.length}/${missions.length}`} />
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white/82 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-ink">Badges</h2>
            <Sparkles className="text-plum" size={22} />
          </div>
          <div className="grid gap-2">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`flex min-h-12 items-center justify-between rounded-lg border px-3 ${
                  badge.earned
                    ? "border-leaf/25 bg-leaf/10 text-leaf"
                    : "border-ink/10 bg-white/70 text-ink/40"
                }`}
              >
                <span className="text-sm font-black">{badge.title}</span>
                {badge.earned ? <Check size={18} /> : <span className="h-2 w-2 rounded-full bg-ink/20" />}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white/70 px-3 text-sm font-black text-ink/65 transition hover:bg-coral hover:text-white focus-visible:focus-ring"
        >
          <RotateCcw size={18} />
          Reset Progress
        </button>
      </div>

      <div className="rounded-lg border border-ink/10 bg-white/82 p-5 shadow-sm">
        <h2 className="text-lg font-black text-ink">Mastery</h2>
        <div className="mt-4 space-y-4">
          {mastery.map((item) => {
            const percent = item.total ? (item.completed / item.total) * 100 : 0;

            return (
              <div key={item.concept}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className={`rounded-md border px-2.5 py-1 text-xs font-black ${conceptStyles[item.concept]}`}
                  >
                    {item.concept}
                  </span>
                  <span className="text-xs font-black text-ink/55">
                    {item.completed}/{item.total} complete
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="h-full rounded-full bg-lake"
                  />
                </div>
                <p className="mt-1 text-xs font-bold text-ink/50">
                  {item.attempts} attempt{item.attempts === 1 ? "" : "s"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
