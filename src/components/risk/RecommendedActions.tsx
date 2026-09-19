import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Lightbulb,
} from "lucide-react";
import {
  motion,
} from "motion/react";

import type {
  RecommendedAction,
} from "../../types/risk";

type Props = {
  recommendations:
    RecommendedAction[];
};

const priorityStyles = {
  LOW:
    "bg-slate-100 text-slate-700",
  MEDIUM:
    "bg-amber-50 text-amber-700",
  HIGH:
    "bg-orange-50 text-orange-700",
  CRITICAL:
    "bg-red-50 text-red-700",
};

export default function RecommendedActions({
  recommendations,
}: Props) {
  const visible =
    recommendations.slice(0, 3);

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
        delay: 0.14,
      }}
      className="h-full rounded-[26px] border border-[#dce5da] bg-white p-6 shadow-[0_14px_45px_rgba(23,63,53,0.055)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a8049]">
            Decision support
          </p>

          <h3 className="mt-2 text-lg font-semibold text-[#173f35]">
            Recommended actions
          </h3>

          <p className="mt-1 text-sm text-[#78847d]">
            Prioritised interventions
            generated from current
            workflow signals.
          </p>
        </div>

        <div className="rounded-xl bg-[#f4ead7] p-2.5 text-[#96783e]">
          <Lightbulb size={18} />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 flex min-h-[150px] items-center rounded-2xl bg-[#f7f9f5] p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white p-2.5 text-[#5f806e] shadow-sm">
              <CheckCircle2
                size={19}
              />
            </div>

            <div>
              <p className="font-semibold text-[#294b40]">
                No immediate intervention
              </p>

              <p className="mt-1 max-w-lg text-sm leading-6 text-[#78847d]">
                Current workflow signals
                are within the baseline
                monitoring range. Continue
                tracking project progress
                and outstanding actions.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {visible.map(
            (action, index) => (
              <motion.article
                key={action.code}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay:
                    0.18 +
                    index * 0.07,
                }}
                whileHover={{
                  y: -2,
                }}
                className="rounded-2xl border border-[#e3e9e0] bg-[#fbfcfa] p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-semibold text-[#23483c]">
                    {action.title}
                  </h4>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${priorityStyles[action.priority]}`}
                  >
                    {action.priority}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-5 text-[#758078]">
                  {action.description}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-[#e8ece6] pt-3">
                  {action.target_days !==
                  null ? (
                    <span className="flex items-center gap-1.5 text-xs text-[#68766e]">
                      <Clock3
                        size={13}
                      />

                      {action.target_days}{" "}
                      days
                    </span>
                  ) : (
                    <span />
                  )}

                  <ArrowUpRight
                    size={15}
                    className="text-[#5a7769]"
                  />
                </div>
              </motion.article>
            ),
          )}
        </div>
      )}
    </motion.article>
  );
}