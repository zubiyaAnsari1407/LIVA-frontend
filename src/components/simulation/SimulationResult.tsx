import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Database,
  GitCompareArrows,
  TrendingDown,
} from "lucide-react";
import {
  motion,
} from "motion/react";

import type {
  SimulationResponse,
} from "../../types/simulation";

type Props = {
  result: SimulationResponse;
};

function DirectionIcon({
  direction,
}: {
  direction: SimulationResponse["direction"];
}) {
  if (direction === "IMPROVED") {
    return <ArrowDownRight size={17} />;
  }

  if (direction === "WORSENED") {
    return <ArrowUpRight size={17} />;
  }

  return <ArrowRight size={17} />;
}

function riskBadge(level: string) {
  switch (level) {
    case "LOW":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "MEDIUM":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "HIGH":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "CRITICAL":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function SimulationResult({
  result,
}: Props) {
  const current =
    result.current_prediction;

  const simulated =
    result.simulated_prediction;

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 20,
        scale: 0.99,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.45,
      }}
      className="mt-5 overflow-hidden rounded-[28px] border border-[#dce5da] bg-white shadow-[0_16px_50px_rgba(23,63,53,0.07)]"
    >
      {/* header */}

      <div className="flex flex-col gap-4 border-b border-[#e6ebe3] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#967b45]">
            <GitCompareArrows size={15} />

            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Scenario comparison
            </p>
          </div>

          <h3 className="mt-2 text-xl font-semibold text-[#173f35]">
            Current vs simulated state
          </h3>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-[#dce5da] bg-[#f7f9f5] px-3 py-2 text-xs font-bold text-[#385c4f]">
          <DirectionIcon
            direction={result.direction}
          />

          {result.direction}
        </div>
      </div>

      {/* comparison */}

      <div className="p-6">
        <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">

          {/* CURRENT */}

          <motion.div
            initial={{
              opacity: 0,
              x: -12,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 0.1,
            }}
            className="rounded-[24px] border border-[#e1e7de] bg-[#fafbf8] p-5"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a877f]">
              Current state
            </p>

            <div className="mt-5 flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-[-0.06em] text-[#173f35]">
                {current.risk_score.toFixed(
                  1,
                )}
              </span>

              <span className="mb-1 text-xs text-[#859189]">
                / 100
              </span>
            </div>

            <span
              className={`mt-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold ${riskBadge(
                current.risk_level,
              )}`}
            >
              {current.risk_level} RISK
            </span>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e9eee7]">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.max(
                    current.risk_score,
                    2,
                  )}%`,
                }}
                transition={{
                  duration: 0.8,
                }}
                className="h-full rounded-full bg-[#8b7a4a]"
              />
            </div>
          </motion.div>

          {/* connector */}

          <div className="hidden items-center justify-center lg:flex">
            <motion.div
              initial={{
                scale: 0.7,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              transition={{
                delay: 0.25,
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#dce5da] bg-white text-[#567568] shadow-sm"
            >
              <ArrowRight size={20} />
            </motion.div>
          </div>

          {/* SIMULATED */}

          <motion.div
            initial={{
              opacity: 0,
              x: 12,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 0.15,
            }}
            className="relative overflow-hidden rounded-[24px] border border-[#bfcfc1] bg-[#edf4ed] p-5"
          >
            <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-white/35" />

            <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-[#587064]">
              Simulated state
            </p>

            <div className="relative mt-5 flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-[-0.06em] text-[#173f35]">
                {simulated.risk_score.toFixed(
                  1,
                )}
              </span>

              <span className="mb-1 text-xs text-[#738179]">
                / 100
              </span>
            </div>

            <span
              className={`relative mt-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold ${riskBadge(
                simulated.risk_level,
              )}`}
            >
              {simulated.risk_level} RISK
            </span>

            <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-white/70">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.max(
                    simulated.risk_score,
                    2,
                  )}%`,
                }}
                transition={{
                  duration: 0.9,
                  delay: 0.1,
                }}
                className="h-full rounded-full bg-[#47715e]"
              />
            </div>
          </motion.div>
        </div>

        {/* Impact strip */}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e2e8df] p-4">
            <p className="text-xs text-[#758179]">
              Risk change
            </p>

            <p className="mt-1 text-2xl font-semibold text-[#173f35]">
              {result.score_change > 0
                ? "+"
                : ""}
              {result.score_change.toFixed(
                1,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2e8df] p-4">
            <p className="text-xs text-[#758179]">
              Reduction
            </p>

            <div className="mt-1 flex items-center gap-2">
              <TrendingDown
                size={18}
                className="text-[#4f7864]"
              />

              <p className="text-2xl font-semibold text-[#173f35]">
                {result.risk_reduction_points.toFixed(
                  1,
                )}
              </p>
            </div>

            <p className="mt-1 text-[10px] text-[#87928b]">
              risk points
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2e8df] p-4">
            <p className="text-xs text-[#758179]">
              Applied changes
            </p>

            <p className="mt-1 text-2xl font-semibold text-[#173f35]">
              {
                Object.keys(
                  result.applied_changes,
                ).length
              }
            </p>

            <p className="mt-1 text-[10px] text-[#87928b]">
              scenario variables
            </p>
          </div>
        </div>

        {/* explanation */}

        <div className="mt-4 rounded-2xl border border-[#dce5da] bg-[#fafbf8] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-[#567f68]"
            />

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7d704c]">
                What changed?
              </p>

              <p className="mt-1 text-sm leading-6 text-[#4e6158]">
                {result.summary}
              </p>
            </div>
          </div>
        </div>

        {/* disclaimer */}

        <div className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-[#849088]">
          <Database
            size={14}
            className="mt-0.5 shrink-0"
          />

          <p>
            This is a what-if scenario
            generated from the current LIVA
            risk engine and user-selected
            assumptions. It does not modify
            the project's live workflow
            records and should not be treated
            as a guaranteed future outcome.
          </p>
        </div>

        {result.saved && (
          <p className="mt-3 text-[11px] font-medium text-[#567568]">
            Scenario stored in the LIVA
            simulation audit trail.
          </p>
        )}
      </div>
    </motion.section>
  );
}