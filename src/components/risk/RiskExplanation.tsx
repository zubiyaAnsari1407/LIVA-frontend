import {
  Database,
  FileCheck2,
  GitBranch,
  Landmark,
} from "lucide-react";
import {
  motion,
} from "motion/react";

import type {
  RiskPrediction,
} from "../../types/risk";

type Props = {
  risk: RiskPrediction;
};

export default function RiskExplanation({
  risk,
}: Props) {
  const context =
    risk.government_context;

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
        delay: 0.2,
      }}
      className="relative h-full overflow-hidden rounded-[26px] bg-[#173f35] p-6 text-white shadow-[0_16px_45px_rgba(23,63,53,0.16)]"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#d1c194]/10 blur-3xl" />

      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d1c194]">
          Evidence trace
        </p>

        <h3 className="mt-2 text-lg font-semibold">
          Government benchmark
        </h3>

        <p className="mt-1 text-xs leading-5 text-white/55">
          Supporting public-authority
          evidence shown separately from
          the operational risk score.
        </p>

        {context ? (
          <>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
                <p className="text-[10px] text-white/50">
                  Records
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {context.record_count}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
                <p className="text-[10px] text-white/50">
                  Avg pending land
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {context.average_pending_land_pct.toFixed(
                    1,
                  )}
                  %
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
                <p className="text-[10px] text-white/50">
                  Median
                </p>

                <p className="mt-1 text-base font-semibold">
                  {context.median_pending_land_pct.toFixed(
                    1,
                  )}
                  %
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
                <p className="text-[10px] text-white/50">
                  High backlog
                </p>

                <p className="mt-1 text-base font-semibold">
                  {
                    context.high_backlog_projects
                  }
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#d1c194]/15 bg-[#d1c194]/[0.07] px-3 py-2.5">
              <Landmark
                size={15}
                className="shrink-0 text-[#d1c194]"
              />

              <p className="text-xs text-white/70">
                {context.scope ===
                  "STATE" &&
                context.state
                  ? `${context.state} benchmark`
                  : "Cross-state government reference"}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-white/45">
              <FileCheck2
                size={13}
              />

              {
                context.source_files
                  .length
              }{" "}
              verified source files
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-white/60">
            No matching government
            reference is available for
            this project.
          </div>
        )}

        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3">
            <Database
              size={15}
              className="text-[#d1c194]"
            />

            <div>
              <p className="text-[10px] text-white/40">
                Operational source
              </p>

              <p className="text-xs font-medium text-white/75">
                LIVA MongoDB workflow
                records
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <GitBranch
              size={15}
              className="text-[#d1c194]"
            />

            <div>
              <p className="text-[10px] text-white/40">
                Engine
              </p>

              <p className="text-xs font-medium text-white/75">
                {risk.model_version}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[10px] leading-4 text-white/35">
          Government records provide
          contextual evidence and do not
          directly alter the current
          rule-based score.
        </p>
      </div>
    </motion.article>
  );
}