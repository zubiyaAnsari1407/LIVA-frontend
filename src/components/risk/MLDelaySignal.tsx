import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  Database,
  LoaderCircle,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  motion,
} from "motion/react";

import {
  predictGeneralDelay,
} from "../../services/riskApi";

import type {
  GeneralDelayMLPrediction,
} from "../../types/risk";


type Props = {
  projectId: string;
};


type ProjectMLRecord = {
  id: string;
  name: string;

  sector?: string | null;
  line_ministry?: string | null;

  original_cost_cr?: number | null;
  expenditure_cr?: number | null;

  physical_progress_pct?: number | null;

  original_completion_year?: number | null;
  sanction_year?: number | null;
};


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";


function humanizeFeature(
  feature: string,
) {
  return feature
    .replace(
      /^sector_/,
      "Sector: ",
    )
    .replace(
      /^line_ministry_/,
      "Ministry: ",
    )
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}


export default function MLDelaySignal({
  projectId,
}: Props) {
  const [
    prediction,
    setPrediction,
  ] =
    useState<GeneralDelayMLPrediction | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(null);

  const [
    missingFields,
    setMissingFields,
  ] = useState<string[]>([]);


  useEffect(() => {
    let active = true;

    async function loadMLSignal() {
      try {
        setLoading(true);
        setError(null);
        setPrediction(null);
        setMissingFields([]);

        const response = await fetch(
          `${API_BASE_URL}/api/projects/${encodeURIComponent(
            projectId,
          )}`,
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load project ML fields.",
          );
        }

        const project =
          (await response.json()) as ProjectMLRecord;


        const required = [
          {
            key: "sector",
            label: "Sector",
            value: project.sector,
          },
          {
            key: "line_ministry",
            label: "Line ministry",
            value:
              project.line_ministry,
          },
          {
            key: "original_cost_cr",
            label: "Original cost",
            value:
              project.original_cost_cr,
          },
          {
            key: "expenditure_cr",
            label: "Expenditure",
            value:
              project.expenditure_cr,
          },
          {
            key: "physical_progress_pct",
            label: "Physical progress",
            value:
              project.physical_progress_pct,
          },
          {
            key: "original_completion_year",
            label:
              "Original completion year",
            value:
              project.original_completion_year,
          },
          {
            key: "sanction_year",
            label: "Sanction year",
            value:
              project.sanction_year,
          },
        ];


        const missing = required
          .filter(
            (item) =>
              item.value === null ||
              item.value === undefined ||
              item.value === "",
          )
          .map(
            (item) => item.label,
          );


        if (
          project.original_cost_cr ===
            0 ||
          project.original_cost_cr ===
            null ||
          project.original_cost_cr ===
            undefined
        ) {
          if (
            !missing.includes(
              "Original cost",
            )
          ) {
            missing.push(
              "Original cost",
            );
          }
        }


        if (missing.length > 0) {
          if (active) {
            setMissingFields(
              missing,
            );
          }

          return;
        }


        const expenditureRatio =
          Number(
            project.expenditure_cr,
          ) /
          Number(
            project.original_cost_cr,
          );


        const result =
          await predictGeneralDelay({
            original_cost_cr:
              Number(
                project.original_cost_cr,
              ),

            expenditure_cr:
              Number(
                project.expenditure_cr,
              ),

            expenditure_ratio:
              expenditureRatio,

            physical_progress_pct:
              Number(
                project.physical_progress_pct,
              ),

            original_completion_year:
              Number(
                project.original_completion_year,
              ),

            sanction_year:
              Number(
                project.sanction_year,
              ),

            sector:
              String(
                project.sector,
              ),

            line_ministry:
              String(
                project.line_ministry,
              ),
          });


        if (active) {
          setPrediction(result);
        }

      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "ML prediction unavailable.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }


    loadMLSignal();

    return () => {
      active = false;
    };

  }, [projectId]);


  if (loading) {
    return (
      <section className="mt-5 rounded-[26px] border border-[#dce5da] bg-white p-6">

        <div className="flex items-center gap-3">

          <LoaderCircle
            size={18}
            className="animate-spin text-[#51715f]"
          />

          <span className="text-sm text-[#718078]">
            Loading government-trained
            ML signal...
          </span>

        </div>

      </section>
    );
  }


  if (missingFields.length > 0) {
    return (
      <section className="mt-5 rounded-[26px] border border-[#dce5da] bg-white p-6">

        <div className="flex items-start gap-3">

          <div className="rounded-xl bg-[#eef3eb] p-2.5 text-[#52705f]">
            <BrainCircuit
              size={19}
            />
          </div>


          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#977c46]">
              Government ML signal
            </p>

            <h3 className="mt-2 text-lg font-semibold text-[#173f35]">
              Project ML fields incomplete
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#718078]">
              Add these project fields
              before generating a
              government-trained schedule
              delay prediction:
            </p>

            <p className="mt-2 text-sm font-medium text-[#4f665c]">
              {missingFields.join(
                " · ",
              )}
            </p>

            <a
              href={`/projects/${encodeURIComponent(
                projectId,
              )}`}
              className="mt-4 inline-flex rounded-xl bg-[#173f35] px-4 py-2.5 text-sm font-semibold !text-white"
            >
              Open project details
            </a>

          </div>

        </div>

      </section>
    );
  }


  if (error) {
    return (
      <section className="mt-5 rounded-[26px] border border-red-100 bg-white p-6">

        <div className="flex gap-3 text-red-700">

          <AlertCircle
            size={19}
          />

          <p className="text-sm">
            {error}
          </p>

        </div>

      </section>
    );
  }


  if (!prediction) {
    return null;
  }


  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="mt-5 overflow-hidden rounded-[28px] border border-[#dce5da] bg-white shadow-[0_14px_45px_rgba(23,63,53,0.05)]"
    >

      {/* HEADER */}

      <div className="flex flex-col gap-3 border-b border-[#e5ebe2] px-6 py-5 md:flex-row md:items-center md:justify-between">

        <div>

          <div className="flex items-center gap-2 text-[#957a45]">

            <Database
              size={14}
            />

            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Government-trained ML
            </p>

          </div>


          <h2 className="mt-2 text-xl font-semibold text-[#173f35]">
            General schedule-delay signal
          </h2>


          <p className="mt-1 text-xs text-[#718078]">
            Random Forest trained on{" "}
            {prediction.training_rows ??
              "verified"}{" "}
            official MoSPI / PAIMANA
            project records.
          </p>

        </div>


        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${
            prediction.is_delay_predicted
              ? "border-orange-200 bg-orange-50 text-orange-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >

          {prediction.is_delay_predicted ? (
            <ArrowUpRight
              size={15}
            />
          ) : (
            <ArrowDownRight
              size={15}
            />
          )}

          {prediction.is_delay_predicted
            ? "DELAY SIGNAL"
            : "NO DELAY SIGNAL"}

        </div>

      </div>


      <div className="grid gap-5 p-6 xl:grid-cols-[0.72fr_1.28fr]">

        {/* Probability */}

        <article className="rounded-[24px] bg-[#173f35] p-6 text-white">

          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7c38c]">
            Predicted probability
          </p>


          <div className="mt-5 flex items-end gap-2">

            <strong className="text-5xl font-semibold tracking-[-0.06em]">
              {
                prediction.delay_probability_pct
              }
              %
            </strong>

          </div>


          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">

            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${prediction.delay_probability_pct}%`,
              }}
              transition={{
                duration: 0.8,
              }}
              className="h-full rounded-full bg-[#d2bb78]"
            />

          </div>


          <div className="mt-6 border-t border-white/10 pt-4">

            <p className="text-xs text-white/45">
              Model
            </p>

            <p className="mt-1 text-sm font-semibold">
              {prediction.model_name}
            </p>

          </div>

        </article>


        {/* SHAP */}

        <article className="rounded-[24px] border border-[#e1e8df] bg-[#fafbf8] p-6">

          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#957a45]">
            SHAP explainability
          </p>

          <h3 className="mt-2 text-lg font-semibold text-[#173f35]">
            Why did the model predict this?
          </h3>


          <div className="mt-5 space-y-3">

            {prediction.explanation
              .slice(0, 5)
              .map(
                (
                  factor,
                  index,
                ) => {

                  const increases =
                    factor.direction ===
                    "INCREASES_DELAY_RISK";

                  return (
                    <motion.div
                      key={`${factor.feature}-${index}`}
                      initial={{
                        opacity: 0,
                        x: 8,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        delay:
                          index *
                          0.05,
                      }}
                      className="rounded-2xl border border-[#e3e9e0] bg-white p-4"
                    >

                      <div className="flex items-center justify-between gap-4">

                        <div>

                          <p className="text-sm font-semibold text-[#294b40]">
                            {humanizeFeature(
                              factor.feature,
                            )}
                          </p>

                          <p className="mt-1 text-[11px] text-[#78857d]">
                            {increases
                              ? "Increases predicted delay risk"
                              : factor.direction ===
                                  "REDUCES_DELAY_RISK"
                                ? "Reduces predicted delay risk"
                                : "Neutral contribution"}
                          </p>

                        </div>


                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            increases
                              ? "bg-orange-50 text-orange-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {factor.shap_value >
                          0
                            ? "+"
                            : ""}
                          {factor.shap_value.toFixed(
                            3,
                          )}
                        </span>

                      </div>

                    </motion.div>
                  );
                },
              )}

          </div>

        </article>

      </div>


      <div className="border-t border-[#e5ebe2] bg-[#f8faf6] px-6 py-4">

        <p className="text-[11px] leading-5 text-[#7b877f]">
          {prediction.important_note}
        </p>

      </div>

    </motion.section>
  );
}