import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import {
  motion,
} from "motion/react";

import type {
  RiskFactor,
} from "../../types/risk";

type Props = {
  factors: RiskFactor[];
};

export default function RiskFactors({
  factors,
}: Props) {
  const visibleFactors =
    factors.slice(0, 4);

  const maximumImpact = Math.max(
    ...visibleFactors.map(
      (factor) =>
        Math.abs(
          factor.impact_score,
        ),
    ),
    1,
  );

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
        delay: 0.08,
      }}
      className="h-full rounded-[26px] border border-[#dce5da] bg-white p-6 shadow-[0_14px_45px_rgba(23,63,53,0.055)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a8049]">
            Explainable risk
          </p>

          <h3 className="mt-2 text-lg font-semibold text-[#173f35]">
            What is driving the score?
          </h3>

          <p className="mt-1 text-sm text-[#78847d]">
            Operational signals contributing
            to the current assessment.
          </p>
        </div>

        <div className="rounded-xl bg-[#f4f7f2] p-2.5 text-[#587366]">
          <TrendingUp size={18} />
        </div>
      </div>

      {visibleFactors.length === 0 ? (
        <div className="mt-6 flex min-h-[175px] items-center justify-center rounded-2xl border border-dashed border-[#dce5da] bg-[#fafbf8] p-6">
          <div className="text-center">
            <CheckCircle2
              size={27}
              className="mx-auto text-[#5f806e]"
            />

            <p className="mt-3 font-semibold text-[#294b40]">
              No major risk drivers
            </p>

            <p className="mx-auto mt-1 max-w-sm text-sm text-[#7a857e]">
              Current linked workflow
              records do not show
              additional major risk
              signals.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {visibleFactors.map(
            (factor, index) => {
              const width =
                Math.max(
                  (
                    Math.abs(
                      factor.impact_score,
                    ) /
                    maximumImpact
                  ) *
                    100,
                  8,
                );

              return (
                <motion.div
                  key={factor.code}
                  initial={{
                    opacity: 0,
                    x: 12,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay:
                      0.12 +
                      index * 0.07,
                  }}
                  className="rounded-2xl border border-[#e5eae2] bg-[#fbfcfa] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-[#f4ead7] p-2 text-[#94763f]">
                      <AlertTriangle
                        size={16}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-[#24483d]">
                          {factor.label}
                        </p>

                        <span className="shrink-0 text-sm font-bold text-[#94763f]">
                          {factor.impact_score >
                          0
                            ? "+"
                            : ""}
                          {factor.impact_score.toFixed(
                            1,
                          )}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#77827b]">
                        {factor.reason}
                      </p>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ecefe9]">
                        <motion.div
                          initial={{
                            width: 0,
                          }}
                          animate={{
                            width: `${width}%`,
                          }}
                          transition={{
                            duration: 0.65,
                            delay:
                              0.18 +
                              index *
                                0.08,
                          }}
                          className="h-full rounded-full bg-[#b4975c]"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            },
          )}
        </div>
      )}
    </motion.article>
  );
}