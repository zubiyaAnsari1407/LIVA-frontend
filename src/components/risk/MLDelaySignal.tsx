import {
  AlertTriangle,
  BrainCircuit,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type MLDelaySignalProps = {
  projectId: string;
};

type ProjectRecord = {
  id: string;
  name?: string;

  sector?: string | null;
  line_ministry?: string | null;

  original_cost_cr?: number | null;
  expenditure_cr?: number | null;

  physical_progress_pct?: number | null;

  original_completion_year?:
    | number
    | null;

  sanction_year?: number | null;
};

type MLExplanation = {
  feature?: string;
  feature_name?: string;
  label?: string;

  impact?: number;
  impact_score?: number;
  shap_value?: number;

  direction?: string;
  reason?: string;
};

type MLPrediction = {
  prediction?: number;
  predicted_class?: number;

  delay_probability?: number;
  probability?: number;

  model_name?: string;
  model?: string;

  explanations?: MLExplanation[];
  shap_explanations?: MLExplanation[];

  feature_importance?: MLExplanation[];

  [key: string]: unknown;
};

const API_BASE_URL =
  (
    import.meta.env
      .VITE_API_BASE_URL ||
    "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function numberOrNull(
  value: unknown,
): number | null {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : null;
}

function getExplanationList(
  prediction: MLPrediction,
): MLExplanation[] {
  const candidates = [
    prediction.explanations,
    prediction.shap_explanations,
    prediction.feature_importance,
  ];

  for (const candidate of candidates) {
    if (
      Array.isArray(candidate) &&
      candidate.length > 0
    ) {
      return candidate;
    }
  }

  return [];
}

function getFeatureName(
  item: MLExplanation,
) {
  return (
    item.label ||
    item.feature_name ||
    item.feature ||
    "Model feature"
  );
}

function getImpact(
  item: MLExplanation,
): number {
  const value =
    item.impact_score ??
    item.impact ??
    item.shap_value;

  return typeof value === "number"
    ? value
    : 0;
}

function getProbability(
  prediction: MLPrediction,
): number | null {
  const value =
    prediction.delay_probability ??
    prediction.probability;

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  /*
   * Backend may return:
   * 0.9761
   * OR
   * 97.61
   */
  if (value <= 1) {
    return value * 100;
  }

  return value;
}

function formatFeatureName(
  value: string,
) {
  return value
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function featureReason(
  item: MLExplanation,
) {
  if (item.reason) {
    return item.reason;
  }

  const impact =
    getImpact(item);

  if (impact > 0) {
    return "Increases predicted delay risk.";
  }

  if (impact < 0) {
    return "Reduces predicted delay risk.";
  }

  return "Has a neutral contribution in this prediction.";
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function MLDelaySignal({
  projectId,
}: MLDelaySignalProps) {
  const [
    project,
    setProject,
  ] =
    useState<ProjectRecord | null>(
      null,
    );

  const [
    prediction,
    setPrediction,
  ] =
    useState<MLPrediction | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const loadSignal =
    useCallback(async () => {
      if (!projectId) {
        setProject(null);
        setPrediction(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        /* -------------------------------------------------------------- */
        /* LOAD PROJECT                                                     */
        /* -------------------------------------------------------------- */

        const projectResponse =
          await fetch(
            `${API_BASE_URL}/api/projects/${encodeURIComponent(
              projectId,
            )}`,
          );

        if (!projectResponse.ok) {
          throw new Error(
            "Unable to load project data for the ML signal.",
          );
        }

        const projectData =
          (await projectResponse.json()) as ProjectRecord;

        setProject(projectData);

        /* -------------------------------------------------------------- */
        /* PREPARE ML INPUT                                                */
        /* -------------------------------------------------------------- */

        const originalCost =
          numberOrNull(
            projectData.original_cost_cr,
          );

        const expenditure =
          numberOrNull(
            projectData.expenditure_cr,
          );

        const physicalProgress =
          numberOrNull(
            projectData.physical_progress_pct,
          );

        const originalCompletionYear =
          numberOrNull(
            projectData.original_completion_year,
          );

        const sanctionYear =
          numberOrNull(
            projectData.sanction_year,
          );

        if (
          originalCost === null ||
          expenditure === null ||
          physicalProgress === null ||
          originalCompletionYear ===
            null ||
          sanctionYear === null ||
          !projectData.sector ||
          !projectData.line_ministry
        ) {
          throw new Error(
            "Required project fields for the government-trained ML signal are not available.",
          );
        }

        const expenditureRatio =
          originalCost > 0
            ? expenditure /
              originalCost
            : 0;

        /* -------------------------------------------------------------- */
        /* CALL ML API                                                     */
        /* -------------------------------------------------------------- */

        const response =
          await fetch(
            `${API_BASE_URL}/api/risk/ml/predict`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                original_cost_cr:
                  originalCost,

                expenditure_cr:
                  expenditure,

                expenditure_ratio:
                  expenditureRatio,

                physical_progress_pct:
                  physicalProgress,

                original_completion_year:
                  originalCompletionYear,

                sanction_year:
                  sanctionYear,

                sector:
                  projectData.sector,

                line_ministry:
                  projectData.line_ministry,
              }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            typeof data?.detail ===
              "string"
              ? data.detail
              : "The ML prediction request failed.",
          );
        }

        setPrediction(
          data as MLPrediction,
        );
      } catch (err) {
        setPrediction(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the ML delay signal.",
        );
      } finally {
        setLoading(false);
      }
    }, [projectId]);

  useEffect(() => {
    loadSignal();
  }, [loadSignal]);

  /* ---------------------------------------------------------------------- */
  /* LOADING                                                                 */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <section className="rounded-[26px] border border-[#dce5da] bg-white p-8">
        <div className="flex min-h-[260px] items-center justify-center">
          <div className="text-center">
            <LoaderCircle
              size={28}
              className="mx-auto animate-spin text-[#173f35]"
            />

            <p className="mt-3 text-sm font-medium text-[#173f35]">
              Running government-trained
              delay model...
            </p>

            <p className="mt-1 text-xs text-[#87938b]">
              Preparing project features and
              model explanation.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* ERROR                                                                    */
  /* ---------------------------------------------------------------------- */

  if (error || !prediction) {
    return (
      <section className="rounded-[26px] border border-[#e6ddd2] bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#fff5ea] p-2.5 text-[#b8753d]">
              <AlertTriangle
                size={18}
              />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#947c49]">
                Government-trained ML
              </p>

              <h2 className="mt-1 text-lg font-semibold text-[#173f35]">
                ML delay signal unavailable
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#718078]">
                {error ??
                  "The model could not produce a prediction for this project."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadSignal}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce5da] bg-white px-4 py-2.5 text-sm font-semibold text-[#173f35] transition hover:bg-[#f5f8f3]"
          >
            <RefreshCw
              size={14}
            />
            Retry
          </button>
        </div>
      </section>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* DATA                                                                     */
  /* ---------------------------------------------------------------------- */

  const probability =
    getProbability(
      prediction,
    );

  const explanations =
    getExplanationList(
      prediction,
    );

  const modelName =
    String(
      prediction.model_name ??
        prediction.model ??
        "Random Forest",
    );

  const predictedDelay =
    Number(
      prediction.prediction ??
        prediction.predicted_class ??
        0,
    ) === 1;

  const sortedExplanations =
    [...explanations].sort(
      (a, b) =>
        Math.abs(
          getImpact(b),
        ) -
        Math.abs(
          getImpact(a),
        ),
    );

  const visibleExplanations =
    sortedExplanations.slice(
      0,
      5,
    );

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <section className="overflow-hidden rounded-[26px] border border-[#dce5da] bg-white shadow-[0_10px_35px_rgba(23,63,53,0.035)]">
      {/* ================================================================== */}
      {/* HEADER                                                              */}
      {/* ================================================================== */}

      <div className="border-b border-[#e2e8df] px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit
                size={15}
                className="text-[#947c49]"
              />

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#947c49]">
                Government-trained ML
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold text-[#173f35]">
              General schedule-delay signal
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#718078]">
              Random Forest trained on
              1,594 official MoSPI /
              PAIMANA project records.
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
              predictedDelay
                ? "border-orange-200 bg-orange-50 text-orange-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {predictedDelay ? (
              <TrendingUp
                size={13}
              />
            ) : (
              <ShieldCheck
                size={13}
              />
            )}

            {predictedDelay
              ? "DELAY SIGNAL"
              : "NO DELAY SIGNAL"}
          </span>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MAIN ML AREA                                                       */}
      {/* ================================================================== */}

      <div className="grid gap-4 p-5 lg:grid-cols-[0.72fr_1.28fr] lg:p-6">
        {/* -------------------------------------------------------------- */}
        {/* PROBABILITY                                                     */}
        {/* -------------------------------------------------------------- */}

        <article className="rounded-[24px] bg-[#173f35] p-6 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d1b66f]">
            Predicted probability
          </p>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-5xl font-semibold tracking-[-0.06em] md:text-6xl">
              {probability !==
              null
                ? `${probability.toFixed(
                    1,
                  )}%`
                : "—"}
            </span>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#d1b66f] transition-all duration-700"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    probability ??
                      0,
                  ),
                )}%`,
              }}
            />
          </div>

          <div className="mt-7 border-t border-white/10 pt-5">
            <p className="text-xs text-white/45">
              Model
            </p>

            <p className="mt-1 text-sm font-semibold">
              {modelName}
            </p>
          </div>

          {project && (
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="text-xs text-white/45">
                Project
              </p>

              <p className="mt-1 text-sm font-medium leading-5">
                {project.name ??
                  "Selected project"}
              </p>
            </div>
          )}
        </article>

        {/* -------------------------------------------------------------- */}
        {/* SHAP EXPLANATION                                                */}
        {/* -------------------------------------------------------------- */}

        <article className="rounded-[24px] border border-[#e0e7de] bg-[#fafbf8] p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#947c49]">
                SHAP explainability
              </p>

              <h3 className="mt-2 text-lg font-semibold text-[#173f35]">
                What influenced this prediction?
              </h3>
            </div>

            <div className="hidden rounded-xl bg-white p-2.5 text-[#55745f] shadow-sm sm:block">
              <BrainCircuit
                size={18}
              />
            </div>
          </div>

          {visibleExplanations.length >
          0 ? (
            <div className="mt-5 space-y-2.5">
              {visibleExplanations.map(
                (
                  item,
                  index,
                ) => {
                  const impact =
                    getImpact(
                      item,
                    );

                  const positive =
                    impact > 0;

                  return (
                    <div
                      key={`${getFeatureName(
                        item,
                      )}-${index}`}
                      className="rounded-2xl border border-[#e1e7df] bg-white px-4 py-3.5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#173f35]">
                            {formatFeatureName(
                              getFeatureName(
                                item,
                              ),
                            )}
                          </p>

                          <p className="mt-1 text-[11px] text-[#819087]">
                            {featureReason(
                              item,
                            )}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            positive
                              ? "bg-[#fff4e9] text-[#bd6b32]"
                              : impact <
                                  0
                                ? "bg-[#edf7f0] text-[#43805b]"
                                : "bg-[#f2f4f2] text-[#718078]"
                          }`}
                        >
                          {impact > 0
                            ? "+"
                            : ""}
                          {impact.toFixed(
                            3,
                          )}
                        </span>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-white p-5 text-sm text-[#718078]">
              Feature-level explanation
              is not available for this
              prediction.
            </div>
          )}
        </article>
      </div>

      {/* ================================================================== */}
      {/* MODEL NOTE                                                         */}
      {/* ================================================================== */}

      <div className="border-t border-[#e2e8df] px-6 py-4">
        <p className="text-xs leading-5 text-[#718078]">
          <strong className="font-semibold text-[#173f35]">
            Model scope:
          </strong>{" "}
          This model predicts general
          infrastructure schedule-delay
          risk using official MoSPI /
          PAIMANA project data. It is not
          a purely land-acquisition-specific
          model. The signal is therefore
          shown as supporting evidence,
          not as the project's final LIVA
          risk score.
        </p>
      </div>
    </section>
  );
}