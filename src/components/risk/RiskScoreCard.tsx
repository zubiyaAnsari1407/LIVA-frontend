import {
  AlertTriangle,
  BrainCircuit,
  ShieldCheck,
} from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  useEffect,
} from "react";

import type {
  RiskPrediction,
} from "../../types/risk";

type Props = {
  risk: RiskPrediction;
};

const levelStyles = {
  LOW: {
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-600",
    accent: "text-emerald-700",
  },

  MEDIUM: {
    badge:
      "border-amber-200 bg-amber-50 text-amber-700",
    bar: "bg-amber-500",
    accent: "text-amber-700",
  },

  HIGH: {
    badge:
      "border-orange-200 bg-orange-50 text-orange-700",
    bar: "bg-orange-500",
    accent: "text-orange-700",
  },

  CRITICAL: {
    badge:
      "border-red-200 bg-red-50 text-red-700",
    bar: "bg-red-600",
    accent: "text-red-700",
  },
};

export default function RiskScoreCard({
  risk,
}: Props) {
  const style =
    levelStyles[risk.risk_level];

  const animatedScore =
    useMotionValue(0);

  const displayScore =
    useTransform(
      animatedScore,
      (value) => value.toFixed(1),
    );

  useEffect(() => {
    const controls = animate(
      animatedScore,
      risk.risk_score,
      {
        duration: 0.9,
        ease: "easeOut",
      },
    );

    return () => controls.stop();
  }, [
    animatedScore,
    risk.risk_score,
  ]);

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
      }}
      className="relative flex h-full min-h-[290px] flex-col overflow-hidden rounded-[26px] border border-[#dce5da] bg-white p-6 shadow-[0_14px_45px_rgba(23,63,53,0.055)]"
    >
      {/* subtle background */}

      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#edf4ee] blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#65766d]">
            <BrainCircuit size={16} />

            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
              Delay risk
            </span>
          </div>

          <h3 className="mt-2 text-lg font-semibold text-[#173f35]">
            Project risk
          </h3>

          <p className="mt-1 max-w-[230px] truncate text-sm text-[#76827b]">
            {risk.project_name ??
              "Selected project"}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-[0.08em] ${style.badge}`}
        >
          {risk.risk_level}
        </span>
      </div>

      <div className="relative mt-7 flex flex-1 flex-col justify-end">
        <div className="flex items-end gap-2">
          <motion.span className="text-[58px] font-semibold leading-none tracking-[-0.07em] text-[#173f35]">
            {displayScore}
          </motion.span>

          <span className="mb-1.5 text-sm font-medium text-[#8a968f]">
            / 100
          </span>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#edf1eb]">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${Math.max(
                risk.risk_score,
                2,
              )}%`,
            }}
            transition={{
              duration: 0.9,
              ease: "easeOut",
            }}
            className={`h-full rounded-full ${style.bar}`}
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#edf0eb] pt-4">
          <div className="flex items-center gap-2">
            {risk.risk_level ===
            "LOW" ? (
              <ShieldCheck
                size={17}
                className={
                  style.accent
                }
              />
            ) : (
              <AlertTriangle
                size={17}
                className={
                  style.accent
                }
              />
            )}

            <span className="text-xs font-medium text-[#65736b]">
              {risk.risk_level ===
              "LOW"
                ? "Stable workflow signal"
                : "Attention recommended"}
            </span>
          </div>

          <span className="rounded-lg bg-[#f3f6f1] px-2.5 py-1 text-[10px] font-semibold text-[#65736b]">
            {risk.prediction_source.replace(
              "_",
              " ",
            )}
          </span>
        </div>
      </div>
    </motion.article>
  );
}