"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { TutorialStep } from "@/lib/tutorial-steps";
import { highlightGo } from "@/lib/highlight-go";
import { useAuth } from "@/components/AuthProvider";

interface Props {
  tutorialTitle: string;
  tutorialSlug: string;
  steps: TutorialStep[];
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  currentOrder: number;
  totalTutorials: number;
}

type Status = "idle" | "running" | "passed" | "failed";

function checkOutput(output: string, expected: string[]): boolean {
  if (!output.trim()) return false;
  if (expected.length === 0) return true;
  const lower = output.toLowerCase();
  return expected.every((s) => lower.includes(s.toLowerCase()));
}

/** Render instruction text, wrapping `backtick` segments in <code> */
function InstructionText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={i}
            className="rounded bg-zinc-800 px-1 py-0.5 text-xs font-mono text-cyan-300"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function InteractiveTutorial({
  tutorialTitle,
  tutorialSlug,
  steps,
  prev,
  next,
}: Props) {
  const { toggleProgress, progress } = useAuth();

  const [stepIndex, setStepIndex] = useState(0);
  const [code, setCode] = useState(steps[0]?.starter ?? "");
  const [output, setOutput] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [showHint, setShowHint] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [tutorialDone, setTutorialDone] = useState(false);

  const preRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const markedRef = useRef(false);

  const currentStep = steps[stepIndex];

  // Mark tutorial complete when all steps are done
  useEffect(() => {
    if (
      completedSteps.size === steps.length &&
      steps.length > 0 &&
      !markedRef.current &&
      !progress.includes(tutorialSlug)
    ) {
      markedRef.current = true;
      setTutorialDone(true);
      toggleProgress(tutorialSlug);
    }
  }, [completedSteps, steps.length, tutorialSlug, toggleProgress, progress]);

  function syncScroll() {
    if (preRef.current && textareaRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  function goToStep(idx: number) {
    setStepIndex(idx);
    setCode(steps[idx].starter);
    setOutput(null);
    setStatus("idle");
    setShowHint(false);
  }

  async function runCodeRequest(currentCode: string) {
    const res = await fetch("/api/run-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: currentCode }),
    });
    const data = await res.json();
    if (data.Errors) {
      return { output: data.Errors as string, hasError: true };
    }
    const out = ((data.Events ?? []) as { Kind: string; Message: string }[])
      .filter((e) => e.Kind === "stdout")
      .map((e) => e.Message)
      .join("");
    return { output: out, hasError: false };
  }

  async function handleRun() {
    setStatus("running");
    setOutput(null);
    try {
      const { output: out, hasError } = await runCodeRequest(code);
      setOutput(out || (hasError ? "Compilation error (see above)" : "(no output)"));
      setStatus("idle");
    } catch {
      setOutput("Could not reach the Go compiler. Please try again.");
      setStatus("idle");
    }
  }

  async function handleCheck() {
    setStatus("running");
    setOutput(null);
    try {
      const { output: out, hasError } = await runCodeRequest(code);
      const display = out || (hasError ? "Compilation error" : "(no output)");
      setOutput(display);

      if (hasError) {
        setStatus("failed");
        return;
      }

      if (checkOutput(out, currentStep.expectedOutput)) {
        setStatus("passed");
        setCompletedSteps((prev) => new Set([...prev, stepIndex]));
        if (stepIndex < steps.length - 1) {
          const nextIdx = stepIndex + 1;
          setTimeout(() => {
            setStepIndex(nextIdx);
            setCode(steps[nextIdx].starter);
            setOutput(null);
            setStatus("idle");
            setShowHint(false);
          }, 1400);
        }
      } else {
        setStatus("failed");
      }
    } catch {
      setOutput("Could not reach the Go compiler. Please try again.");
      setStatus("failed");
    }
  }

  function handleReset() {
    setCode(currentStep.starter);
    setOutput(null);
    setStatus("idle");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore clipboard errors */
    }
  }

  if (!currentStep) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 text-zinc-300">
        No steps found for this tutorial.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100">
      {/* ── Top Bar ── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <span>←</span>
          <span className="hidden sm:inline">All Tutorials</span>
        </Link>

        <h1 className="max-w-[40%] truncate text-sm font-semibold text-zinc-100">
          {tutorialTitle}
        </h1>

        <div className="flex items-center gap-4">
          {prev && (
            <Link
              href={`/tutorials/${prev.slug}`}
              className="hidden text-xs text-zinc-500 transition-colors hover:text-cyan-400 md:block"
            >
              ← {prev.title}
            </Link>
          )}
          {next && (
            <Link
              href={`/tutorials/${next.slug}`}
              className="hidden text-xs text-zinc-500 transition-colors hover:text-cyan-400 md:block"
            >
              {next.title} →
            </Link>
          )}
        </div>
      </header>

      {/* ── Main Split ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel ── */}
        <aside className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-zinc-800 bg-zinc-900 xl:w-96">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step counter */}
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-500">
              Step {stepIndex + 1} of {steps.length}
            </p>

            {/* Step title */}
            <h2 className="mb-4 text-lg font-bold text-zinc-100">
              {currentStep.title}
            </h2>

            {/* Instruction */}
            <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
              {currentStep.instruction.split("\n").map((line, i) => (
                <p key={i}>
                  <InstructionText text={line} />
                </p>
              ))}
            </div>

            {/* Hint */}
            {currentStep.hint && (
              <div className="mt-6">
                <button
                  onClick={() => setShowHint((v) => !v)}
                  className="flex items-center gap-1.5 text-sm text-cyan-500 transition-colors hover:text-cyan-400"
                >
                  <span>{showHint ? "▾" : "▸"}</span>
                  {showHint ? "Hide hint" : "Show hint"}
                </button>
                {showHint && (
                  <div className="mt-2 rounded-lg border border-cyan-900 bg-cyan-950/40 p-3">
                    <code className="break-all text-xs text-cyan-300">
                      {currentStep.hint}
                    </code>
                  </div>
                )}
              </div>
            )}

            {/* Pass message */}
            {status === "passed" && (
              <div className="mt-6 rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-400">
                ✓ Correct!{" "}
                {stepIndex < steps.length - 1
                  ? "Moving to next step…"
                  : "You finished this tutorial!"}
              </div>
            )}
          </div>

          {/* Footer: dots + prev/next */}
          <div className="shrink-0 border-t border-zinc-800 p-4">
            <div className="mb-4 flex flex-wrap gap-1.5">
              {steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  title={`Step ${i + 1}: ${s.title}`}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    i === stepIndex
                      ? "bg-cyan-400"
                      : completedSteps.has(i)
                      ? "bg-emerald-500"
                      : "bg-zinc-600 hover:bg-zinc-400"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => stepIndex > 0 && goToStep(stepIndex - 1)}
                disabled={stepIndex === 0}
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Prev
              </button>
              <button
                onClick={() =>
                  stepIndex < steps.length - 1 && goToStep(stepIndex + 1)
                }
                disabled={stepIndex === steps.length - 1}
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        </aside>

        {/* ── Right Panel ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Code editor */}
          <div className="relative flex-1 overflow-hidden bg-zinc-950 font-mono text-sm leading-6">
            {/* Syntax highlight layer (non-interactive) */}
            <pre
              ref={preRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-auto whitespace-pre p-4 text-zinc-100"
              dangerouslySetInnerHTML={{ __html: highlightGo(code) + "\n" }}
            />
            {/* Editable textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={syncScroll}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              className="absolute inset-0 resize-none overflow-auto whitespace-pre bg-transparent p-4 text-transparent caret-white outline-none selection:bg-cyan-900/50"
            />
          </div>

          {/* Toolbar */}
          <div className="flex shrink-0 items-center gap-2 border-t border-zinc-800 bg-zinc-900 px-4 py-2">
            <button
              onClick={handleRun}
              disabled={status === "running"}
              className="flex items-center gap-1.5 rounded-md bg-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-600 disabled:opacity-50"
            >
              {status === "running" ? "Running…" : "▶ Run"}
            </button>
            <button
              onClick={handleCheck}
              disabled={status === "running"}
              className="flex items-center gap-1.5 rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
            >
              ✓ Check
            </button>
            <button
              onClick={handleReset}
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              Reset
            </button>
            <button
              onClick={handleCopy}
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Output panel */}
          <div className="h-44 shrink-0 overflow-y-auto border-t border-zinc-800 bg-zinc-950 p-4 font-mono text-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Output
            </p>
            {output === null ? (
              <p className="text-zinc-600 text-xs">
                Click Run to execute, or Check to validate.
              </p>
            ) : (
              <pre className="whitespace-pre-wrap text-zinc-200">{output}</pre>
            )}
            {status === "passed" && (
              <p className="mt-2 text-sm text-emerald-400">
                ✓ Correct!{" "}
                {stepIndex < steps.length - 1
                  ? "Moving to next step…"
                  : "All steps complete!"}
              </p>
            )}
            {status === "failed" && output !== null && (
              <p className="mt-2 text-sm text-red-400">
                ✗ Not quite.{" "}
                {currentStep.expectedOutput.length > 0
                  ? `Expected output to include: ${currentStep.expectedOutput
                      .slice(0, 4)
                      .map((s) => `"${s}"`)
                      .join(", ")}`
                  : "Make sure your code produces some output."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Congratulations Modal ── */}
      {tutorialDone && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-emerald-800 bg-zinc-900 p-8 text-center shadow-2xl">
            <div className="mb-3 text-5xl">🎉</div>
            <h2 className="mb-2 text-2xl font-bold text-zinc-100">
              Tutorial Complete!
            </h2>
            <p className="mb-6 text-zinc-400">
              You finished{" "}
              <span className="font-medium text-zinc-200">{tutorialTitle}</span>
              . Great work!
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setTutorialDone(false)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Review steps
              </button>
              {next ? (
                <Link
                  href={`/tutorials/${next.slug}`}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
                >
                  Next: {next.title} →
                </Link>
              ) : (
                <Link
                  href="/"
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
                >
                  All Tutorials
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
