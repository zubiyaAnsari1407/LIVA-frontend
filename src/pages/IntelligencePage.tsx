
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileSearch,
  Gauge,
  Layers3,
  LoaderCircle,
  RefreshCw,
  Search,
  Target,
  WalletCards,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router";

import { motion } from "motion/react";

import { getLivaProjectRisk, getProjectRisk } from "../services/riskApi";
import type { RiskPrediction } from "../types/risk";
import ProjectContextBanner from "../components/project/ProjectContextBanner";
import MLDelaySignal from "../components/risk/MLDelaySignal";

type Tab = "overview" | "explain";

type ProjectOption = {
  id: string;
  name: string;
  state: string | null;
  district: string | null;
  stage: string | null;
  progress: number | null;
  sector: string | null;
  line_ministry: string | null;
  image: string | null;
  original_cost_cr: number | null;
  expenditure_cr: number | null;
  physical_progress_pct: number | null;
  original_completion_year: number | null;
  sanction_year: number | null;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";

function normalizeProjects(payload: unknown): ProjectOption[] {
  const raw =
    Array.isArray(payload)
      ? payload
      : typeof payload === "object" &&
          payload !== null &&
          "items" in payload &&
          Array.isArray((payload as { items: unknown[] }).items)
        ? (payload as { items: unknown[] }).items
        : [];

  return raw
    .map((item): ProjectOption | null => {
      if (!item || typeof item !== "object") return null;

      const record = item as Record<string, unknown>;
      const id = String(
        record.id ?? record._id ?? record.project_id ?? record.projectId ?? "",
      );

      if (!id) return null;

      return {
        id,
        name: String(
          record.name ??
            record.project_name ??
            record.projectName ??
            record.title ??
            "Untitled project",
        ),
        state:
          typeof record.state === "string"
            ? record.state
            : null,
        district:
          typeof record.district === "string"
            ? record.district
            : null,
        stage:
          typeof record.stage === "string"
            ? record.stage
            : null,
        progress:
          typeof record.progress === "number"
            ? record.progress
            : null,
        sector:
          typeof record.sector === "string"
            ? record.sector
            : null,
        line_ministry:
          typeof record.line_ministry === "string"
            ? record.line_ministry
            : null,
        image:
          typeof record.image === "string"
            ? record.image
            : null,
        original_cost_cr:
          typeof record.original_cost_cr === "number"
            ? record.original_cost_cr
            : null,
        expenditure_cr:
          typeof record.expenditure_cr === "number"
            ? record.expenditure_cr
            : null,
        physical_progress_pct:
          typeof record.physical_progress_pct === "number"
            ? record.physical_progress_pct
            : null,
        original_completion_year:
          typeof record.original_completion_year === "number"
            ? record.original_completion_year
            : null,
        sanction_year:
          typeof record.sanction_year === "number"
            ? record.sanction_year
            : null,
      };
    })
    .filter(
      (project): project is ProjectOption =>
        project !== null,
    );
}

function riskTone(level: RiskPrediction["risk_level"]) {
  if (level === "HIGH") {
    return {
      badge: "border-red-200 bg-red-50 text-red-700",
      accent: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    };
  }

  if (level === "MEDIUM") {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      accent: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    };
  }

  return {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accent: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  };
}

function readableFactorLabel(value?: string) {
  if (!value) return "Current project conditions";

  const map: Record<string, string> = {
    LOW_COMPLETION: "Project progress",
    LOW_PROGRESS: "Physical progress",
    HIGH_EXPENDITURE_RATIO: "Financial progress",
    COMPLETION_DELAY: "Completion timeline",
    OWNERSHIP: "Land ownership",
    LITIGATION: "Court or legal case",
    COMPENSATION: "Compensation",
    SURVEY: "Land survey",
    APPROVAL: "Approvals",
    DOCUMENT: "Documents",
  };

  return (
    map[value] ??
    value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function explanationForFactor(
  factor: RiskPrediction["factors"][number] | undefined,
  project: ProjectOption | undefined,
) {
  if (!factor) {
    return "No specific additional delay driver was identified from the current LIVA records.";
  }

  const label = readableFactorLabel(factor.label);

  if (
    factor.label === "LOW_COMPLETION" ||
    factor.label?.toLowerCase().includes("completion")
  ) {
    const progress =
      project?.physical_progress_pct ??
      project?.progress;

    return progress !== null && progress !== undefined
      ? `The project is at ${progress}% progress. This should be checked against the planned completion date.`
      : "The current progress should be checked against the planned completion date.";
  }

  if (
    factor.label === "LOW_PROGRESS" ||
    factor.label?.toLowerCase().includes("progress")
  ) {
    return "Project progress needs review. Check which work is still pending and why.";
  }

  if (
    factor.label === "HIGH_EXPENDITURE_RATIO" ||
    factor.label?.toLowerCase().includes("expenditure")
  ) {
    return "Check whether project spending and actual work on the ground are moving together.";
  }

  if (factor.label === "OWNERSHIP") {
    return "Check whether land ownership records are complete and clear.";
  }

  if (factor.label === "LITIGATION") {
    return "Check whether any court or legal case is holding up the work.";
  }

  if (factor.label === "COMPENSATION") {
    return "Check whether compensation work is complete for the affected land.";
  }

  if (factor.label === "SURVEY") {
    return "Check whether the land survey is complete and the records are updated.";
  }

  if (factor.label === "APPROVAL") {
    return "Check whether any required approval is still pending.";
  }

  if (factor.label === "DOCUMENT") {
    return "Check whether the required land acquisition documents are complete.";
  }

  return `${label} needs review. Check the current status and any pending work in this area.`;
}

function officerSummary(
  risk: RiskPrediction,
  _project?: ProjectOption,
) {
  if (risk.risk_level === "LOW") {
    return {
      title: "No major delay signal detected",
      text:
        "LIVA does not currently show a major delay concern. Keep monitoring the project and update the records when new information is available.",
    };
  }

  if (risk.risk_level === "MEDIUM") {
    return {
      title: "Delay risk requires attention",
      text:
        "Some project conditions may affect the planned timeline. Review the factors shown below and check the pending work.",
    };
  }

  return {
    title: "Delay risk requires immediate review",
    text:
      "The current records show a higher delay concern. Find the activities causing the delay and start follow-up.",
  };
}

function actionText(
  recommendation: unknown,
  fallback: string,
) {
  if (
    recommendation &&
    typeof recommendation === "object" &&
    "description" in recommendation
  ) {
    const description = (
      recommendation as { description?: unknown }
    ).description;

    if (typeof description === "string" && description.trim()) {
      return description;
    }
  }

  return fallback;
}

export default function IntelligencePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: Tab =
    searchParams.get("tab") === "explain"
      ? "explain"
      : "overview";

  const selectedProjectId =
    searchParams.get("projectId") ?? "";

  const [projects, setProjects] = useState<ProjectOption[]>([]);
 const [, setLoadingProjects] =
  useState(true);
  const [risk, setRisk] = useState<RiskPrediction | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/projects`,
        );

        if (!response.ok) {
          throw new Error("Unable to load projects.");
        }

        const data = await response.json();
        const livaProjects = await fetch(
          `${API_BASE_URL}/api/liva/projects`,
        )
          .then(async (livaResponse) =>
            livaResponse.ok ? livaResponse.json() : [],
          )
          .catch(() => []);

        if (mounted) {
          const normalized = [
            ...normalizeProjects(data),
            ...normalizeProjects(livaProjects),
          ];
          setProjects(normalized);

          // If the page is opened without a projectId, show the
          // first available project in the project-context banner.
          if (!selectedProjectId && normalized.length > 0) {
            setSearchParams((current) => {
              const next = new URLSearchParams(current);
              next.set("projectId", normalized[0].id);
              next.set("tab", activeTab);
              return next;
            });
          }
        }
      } catch {
        if (mounted) {
          setProjects([]);
        }
      } finally {
        if (mounted) {
          setLoadingProjects(false);
        }
      }
    }

    loadProjects();

    return () => {
      mounted = false;
    };
  }, []);

  const loadRisk = useCallback(async () => {
    if (!selectedProjectId) {
      setRisk(null);
      setRiskError(null);
      return;
    }

    try {
      setLoadingRisk(true);
      setRiskError(null);

      const result = selectedProjectId.startsWith("LIVA-PRJ-")
        ? await getLivaProjectRisk(selectedProjectId)
        : await getProjectRisk(selectedProjectId);
      setRisk(result);
    } catch (error) {
      setRisk(null);
      setRiskError(
        error instanceof Error
          ? error.message
          : "Unable to load the current risk assessment.",
      );
    } finally {
      setLoadingRisk(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadRisk();
  }, [loadRisk]);

  const project = useMemo(
    () =>
      projects.find(
        (item) => item.id === selectedProjectId,
      ),
    [projects, selectedProjectId],
  );

  function changeTab(tab: Tab) {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next);
  }

  function changeProject(projectId: string) {
    const next = new URLSearchParams(searchParams);

    if (projectId) {
      next.set("projectId", projectId);
    } else {
      next.delete("projectId");
    }

    next.set("tab", "overview");
    setSearchParams(next);
  }

  return (
    <main className="min-h-screen bg-[#f4f6f3] text-[#132f2a]">
      {/* Header */}
     

      <div className="mx-auto max-w-[1500px] px-5 py-5 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#718078]">
          <span>Workspace</span>
          <span>/</span>
          <span>Delay Intelligence</span>
          <span>/</span>
          <span className="font-medium text-[#28473f]">
            {activeTab === "explain"
              ? "Explainable Intelligence"
              : "Risk Overview"}
          </span>
        </div>

        {/* Project Context */}
        <div className="mt-4">
          {project && (
            <ProjectContextBanner
              project={{
                id: project.id,
                name: project.name,
                district: project.district,
                state: project.state,
                sector: project.sector,
                lineMinistry: project.line_ministry,
                image: project.image,
              }}
              projects={projects.map((item) => ({
                id: item.id,
                name: item.name,
                district: item.district,
                state: item.state,
                sector: item.sector,
                lineMinistry: item.line_ministry,
                image: item.image,
              }))}
              onProjectChange={changeProject}
              label="ACTIVE PROJECT"
            />
          )}
        </div>

        {!selectedProjectId ? (
          <EmptyState />
        ) : (
          <>
            {/* Tabs */}
            <div className="mt-5 flex items-center justify-between border-b border-[#d7e0da]">
              <div className="flex">
                <TabButton
                  active={activeTab === "overview"}
                  onClick={() => changeTab("overview")}
                  icon={<BarChart3 size={15} />}
                >
                  Risk overview
                </TabButton>

                <TabButton
                  active={activeTab === "explain"}
                  onClick={() => changeTab("explain")}
                  icon={<BrainCircuit size={15} />}
                >
                  Explainable intelligence
                </TabButton>
              </div>

              <Link
                to={`/projects/${selectedProjectId}`}
                className="mb-2 hidden items-center gap-2 rounded-lg border border-[#cfdad3] bg-white px-3.5 py-2 text-xs font-semibold text-[#24473f] hover:bg-[#f7f9f7] md:inline-flex"
              >
                View project details
                <ArrowRight size={14} />
              </Link>
            </div>

            {riskError && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span>{riskError}</span>

                <button
                  type="button"
                  onClick={loadRisk}
                  className="inline-flex items-center gap-2 font-semibold"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            )}

            {activeTab === "overview" ? (
              <RiskOverview
                risk={risk}
                project={project}
                loading={loadingRisk}
              />
            ) : (
              <ExplainableIntelligence
                risk={risk}
                project={project}
                projectId={selectedProjectId}
                loading={loadingRisk}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* RISK OVERVIEW                                                              */
/* -------------------------------------------------------------------------- */

function RiskOverview({
  risk,
  project,
  loading,
}: {
  risk: RiskPrediction | null;
  project?: ProjectOption;
  loading: boolean;
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (!risk) {
    return <EmptyState />;
  }

  const tone = riskTone(risk.risk_level);
  const primary = risk.factors[0];

  return (
    <section className="mt-5 space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.45fr_0.75fr]">
        <article className="rounded-2xl border border-[#d9e1dc] bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[#edf3ef] p-3 text-[#315c50]">
              <Gauge size={21} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#9a7d3f]">
                Current assessment
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {risk.risk_level} risk
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68776f]">
                {officerSummary(risk, project).text}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric
              label="Risk score"
              value={`${risk.risk_score.toFixed(1)} / 100`}
              hint={risk.risk_level === "LOW" ? "Low risk" : `${risk.risk_level} risk`}
            />

            <Metric
              label="Factors to review"
              value={String(risk.factors.length)}
              hint="Reasons behind this assessment"
            />

            <Metric
              label="Assessment source"
              value="LIVA records"
              hint="Current project information"
            />
          </div>
        </article>

        <article
          className={`rounded-2xl border p-6 ${tone.border} ${tone.bg}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#9a7d3f]">
            Main factor to review
          </p>

          <h2 className="mt-2 text-lg font-semibold">
            {readableFactorLabel(primary?.label)}
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#66766e]">
            {explanationForFactor(
              primary,
              project,
            )}
          </p>

          <div className="mt-5 flex items-center gap-2 text-xs font-semibold">
            <Activity size={14} />
            This factor is part of the current LIVA assessment.
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard
          icon={<Layers3 size={18} />}
          label="Project stage"
          value={project?.stage ?? "Not recorded"}
          text="Current stage recorded for this project."
        />

        <InfoCard
          icon={<Target size={18} />}
          label="Physical progress"
          value={
            project?.physical_progress_pct !== null &&
            project?.physical_progress_pct !== undefined
              ? `${project.physical_progress_pct}%`
              : "Not recorded"
          }
          text="Reported progress available in project records."
        />

        <InfoCard
          icon={<WalletCards size={18} />}
          label="Financial progress"
          value={
            project?.original_cost_cr &&
            project.expenditure_cr !== null &&
            project.expenditure_cr !== undefined
              ? `${(
                  (project.expenditure_cr /
                    project.original_cost_cr) *
                  100
                ).toFixed(1)}%`
              : "Not available"
          }
          text="Expenditure relative to the original project cost."
        />
      </div>

      <div className="rounded-2xl border border-[#d9e1dc] bg-[#f8faf8] p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white p-2.5 text-[#315c50] shadow-sm">
            <FileSearch size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a7d3f]">
              How to read this page
            </p>
            <p className="mt-1 text-sm leading-6 text-[#66766e]">
              The score shows the current level of delay risk. The factors below explain what is contributing to that score. Open Explainable Intelligence when you want to see the reasons in detail and the actions suggested by LIVA.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* EXPLAINABLE INTELLIGENCE                                                   */
/* -------------------------------------------------------------------------- */

function ExplainableIntelligence({
  risk,
  project,
  projectId,
  loading,
}: {
  risk: RiskPrediction | null;
  project?: ProjectOption;
  projectId: string;
  loading: boolean;
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (!risk) {
    return <EmptyState />;
  }

  const summary = officerSummary(
    risk,
    project,
  );

  const primary = risk.factors[0];
  const secondary = risk.factors.slice(1, 4);

  const progress =
    project?.physical_progress_pct ??
    project?.progress ??
    null;

  const completionYear =
    project?.original_completion_year ??
    null;

  const currentYear =
    new Date().getFullYear();

  const isPastCompletion =
    completionYear !== null &&
    currentYear > completionYear;

  return (
    <section className="mt-5 space-y-4">
      {/* Main explanation + timeline */}
      <div className="grid gap-4 lg:grid-cols-[1.65fr_0.75fr]">
        <article className="rounded-2xl border border-[#d9e1dc] bg-white p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a7d3f]">
                Delay explanation
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                What needs attention?
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#68776f]">
                {summary.text}
              </p>
            </div>

            <div
              className={`min-w-[190px] rounded-xl border p-4 ${
                risk.risk_level === "LOW"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              {risk.risk_level === "LOW" ? (
                <CheckCircle2
                  size={22}
                  className="text-emerald-700"
                />
              ) : (
                <AlertCircle
                  size={22}
                  className="text-amber-700"
                />
              )}

              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em]">
                {summary.title}
              </p>

              <p className="mt-1 text-xs leading-5 text-[#68776f]">
                Based on the current project records.
              </p>
            </div>
          </div>
        </article>

        <TimelineCard
          completionYear={completionYear}
          currentYear={currentYear}
          isPastCompletion={isPastCompletion}
          progress={progress}
        />
      </div>

      {/* Reasons */}
      <article className="rounded-2xl border border-[#d9e1dc] bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#f4f1e8] p-2.5 text-[#9a7d3f]">
            <Search size={19} />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a7d3f]">
              Contributing factors
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              What is contributing to the risk?
            </h2>

            <p className="mt-1 text-sm text-[#718078]">
              LIVA has identified the following factors from the information currently available for this project. Each card explains what the factor means in simple terms.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            primary,
            ...secondary,
          ]
            .filter(Boolean)
            .map((factor, index) => (
              <ReasonCard
                key={`${factor?.label}-${index}`}
                index={index + 1}
                label={readableFactorLabel(
                  factor?.label,
                )}
                text={explanationForFactor(
                  factor,
                  project,
                )}
              />
            ))}

          {risk.factors.length === 0 && (
            <div className="rounded-xl border border-[#e0e6e1] bg-[#f8faf8] p-5 text-sm text-[#718078] md:col-span-2 xl:col-span-4">
              LIVA could not identify a specific contributing factor from the information currently available. Adding more complete project records can make the assessment more specific.
            </div>
          )}
        </div>
      </article>

      {/* Officer actions */}
      <ActionPanel risk={risk} />

      {/* Evidence + technical */}
      <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
        <AssessmentBasisPanel />

        <article className="rounded-2xl border border-[#d9e1dc] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#edf3ef] p-2.5 text-[#315c50]">
              <FileSearch size={18} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a7d3f]">
                Information checked
              </p>

              <h3 className="mt-1 font-semibold">
                Information LIVA checks before giving this result
              </h3>
            </div>
          </div>

          <ul className="mt-4 space-y-3 text-sm text-[#62726a]">
            <EvidenceItem>
              Current project information available in LIVA, including progress and timeline details.
            </EvidenceItem>

            <EvidenceItem>
              Relevant government project records used as supporting information.
            </EvidenceItem>

            <EvidenceItem>
              The current LIVA risk assessment generated from the available project information.
            </EvidenceItem>
          </ul>
        </article>
      </div>

      {/* Optional technical details */}
      <details className="group rounded-2xl border border-[#d9e1dc] bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <BrainCircuit
              size={18}
              className="text-[#5b7067]"
            />

            <div>
              <p className="text-sm font-semibold">
                Technical details
              </p>

              <p className="text-xs text-[#819087]">
                Technical information for reference only.
              </p>
            </div>
          </div>

          <ChevronDown
            size={17}
            className="text-[#718078] transition group-open:rotate-180"
          />
        </summary>

        <div className="border-t border-[#e1e7e2] p-5">
          <MLDelaySignal projectId={projectId} />
        </div>
      </details>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* TIMELINE                                                                   */
/* -------------------------------------------------------------------------- */

function TimelineCard({
  completionYear,
  currentYear,
  isPastCompletion,
  progress,
}: {
  completionYear: number | null;
  currentYear: number;
  isPastCompletion: boolean;
  progress: number | null;
}) {
  return (
    <article className="rounded-2xl border border-[#d9e1dc] bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[#edf3ef] p-2.5 text-[#315c50]">
          <CalendarDays size={18} />
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a7d3f]">
            Project timeline
          </p>

          <h3 className="mt-1 font-semibold">
            Timeline vs progress
          </h3>
        </div>
      </div>

      <div className="mt-5 border-l border-[#ccd8d1] pl-5">
        <TimelineRow
          label="Planned completion"
          value={
            completionYear !== null
              ? String(completionYear)
              : "Not available"
          }
          danger={isPastCompletion}
        />

        <TimelineRow
          label="Current year"
          value={String(currentYear)}
        />

        <div className="relative mt-4">
          <div className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#315c50]" />

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#718078]">
              Physical progress
            </span>

            <strong>
              {progress !== null
                ? `${progress}%`
                : "Not available"}
            </strong>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e3e9e5]">
            <div
              className="h-full rounded-full bg-[#315c50]"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, progress ?? 0),
                )}%`,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function TimelineRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="relative mb-5">
      <div
        className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ${
          danger ? "bg-red-500" : "bg-[#789086]"
        }`}
      />

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-[#718078]">
          {label}
        </span>

        <span
          className={`text-sm font-semibold ${
            danger ? "text-red-600" : "text-[#183d35]"
          }`}
        >
          {value}
        </span>
      </div>

      {danger && (
        <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
          Past due
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ACTION PANEL                                                               */
/* -------------------------------------------------------------------------- */

function ActionPanel({
  risk,
}: {
  risk: RiskPrediction;
}) {
  const fallbackActions = [
    "Review the planned completion date together with the latest project progress so that any difference is clearly understood.",
    "Check whether any land acquisition work is still pending and identify the activity that is holding up the next stage.",
    "Confirm which department or responsible team needs to complete the pending work and record the required follow-up.",
    "Create a follow-up action in LIVA and keep it open until the pending work has been completed and verified.",
  ];

  const actions = risk.recommendations.length
    ? risk.recommendations.slice(0, 4)
    : fallbackActions;

  return (
    <article className="rounded-2xl border border-[#d9e1dc] bg-white p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#f4f1e8] p-2.5 text-[#9a7d3f]">
          <ClipboardCheck size={19} />
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a7d3f]">
            Officer action
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            What should the officer do?
          </h2>

          <p className="mt-1 text-sm text-[#718078]">
            The following steps explain what can be checked or followed up based on the current assessment.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-4">
        {actions.map((action, index) => (
          <div
            key={index}
            className="relative rounded-xl border border-[#e0e6e1] bg-[#f8faf8] p-4"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-[#315c50] shadow-sm">
              {index + 1}
            </span>

            <p className="mt-3 text-sm font-semibold leading-5 text-[#183d35]">
              {actionText(
                action,
                fallbackActions[index] ??
                  fallbackActions[0],
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to="/actions"
          className="inline-flex items-center gap-2 rounded-lg bg-[#123d34] px-4 py-2.5 text-sm font-semibold !text-white hover:bg-[#0e322b]"
        >
          Create Action
          <ArrowRight size={15} />
        </Link>

        <Link
          to="/projects"
          className="inline-flex items-center gap-2 rounded-lg border border-[#cfdad3] bg-white px-4 py-2.5 text-sm font-semibold text-[#24473f] hover:bg-[#f7f9f7]"
        >
          View project details
        </Link>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* EVIDENCE PANEL                                                             */
/* -------------------------------------------------------------------------- */

function AssessmentBasisPanel() {
  return (
    <article className="rounded-2xl border border-[#d9e1dc] bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#edf3ef] p-2.5 text-[#315c50]">
          <FileSearch size={18} />
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a7d3f]">
            Assessment basis
          </p>

          <h3 className="mt-1 font-semibold">
            How did LIVA reach this result?
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#68776f]">
            LIVA reviews the project information currently available in the system and uses relevant government project records as supporting information. The result reflects the information available at the time of assessment.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <div className="rounded-xl bg-[#f7f9f7] p-4">
          <p className="text-xs font-semibold text-[#24473f]">
            Project information
          </p>
          <p className="mt-1 text-xs leading-5 text-[#718078]">
            Current progress, timeline and other project records available in LIVA.
          </p>
        </div>

        <div className="rounded-xl bg-[#f7f9f7] p-4">
          <p className="text-xs font-semibold text-[#24473f]">
            Government records
          </p>
          <p className="mt-1 text-xs leading-5 text-[#718078]">
            Public-authority project information used to provide supporting context.
          </p>
        </div>

        <div className="rounded-xl bg-[#f7f9f7] p-4">
          <p className="text-xs font-semibold text-[#24473f]">
            Current assessment
          </p>
          <p className="mt-1 text-xs leading-5 text-[#718078]">
            The current LIVA risk assessment based on the available information.
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-[#819087]">
        If important project information is added or updated, the assessment may change.
      </p>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* SMALL COMPONENTS                                                           */
/* -------------------------------------------------------------------------- */

function ReasonCard({
  index,
  label,
  text,
}: {
  index: number;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-[#e0e6e1] bg-[#fbfcfb] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#edf3ef] text-xs font-bold text-[#315c50]">
          {index}
        </span>

      </div>

      <h3 className="mt-4 text-sm font-semibold">
        {label}
      </h3>

      <p className="mt-2 text-xs leading-5 text-[#718078]">
        {text}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  text,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  text: string;
}) {
  return (
    <article className="rounded-2xl border border-[#d9e1dc] bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[#edf3ef] p-2.5 text-[#315c50]">
          {icon}
        </div>

        <p className="text-xs font-semibold text-[#718078]">
          {label}
        </p>
      </div>

      <p className="mt-4 text-xl font-semibold">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-[#819087]">
        {text}
      </p>
    </article>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[#e0e6e1] bg-[#f8faf8] p-4">
      <p className="text-[11px] text-[#819087]">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] font-medium text-[#527b69]">
          {hint}
        </p>
      )}
    </div>
  );
}



function EvidenceItem({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2
        size={15}
        className="mt-0.5 shrink-0 text-[#527b69]"
      />
      <span>{children}</span>
    </li>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold ${
        active
          ? "text-[#173f35]"
          : "text-[#718078] hover:text-[#173f35]"
      }`}
    >
      {icon}
      {children}

      {active && (
        <motion.div
          layoutId="intelligence-tab"
          className="absolute inset-x-2 bottom-0 h-0.5 bg-[#b18d4d]"
        />
      )}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="mt-5 flex min-h-[300px] items-center justify-center rounded-2xl border border-[#d9e1dc] bg-white">
      <div className="text-center">
        <LoaderCircle
          size={26}
          className="mx-auto animate-spin text-[#315c50]"
        />

        <p className="mt-3 text-sm font-medium">
          Loading project intelligence
        </p>

        <p className="mt-1 text-xs text-[#819087]">
          Reading the current LIVA assessment.
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-5 rounded-2xl border border-[#d9e1dc] bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf3ef] text-[#315c50]">
        <Layers3 size={22} />
      </div>

      <h2 className="mt-4 text-lg font-semibold">
        Select a project
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#718078]">
        Select a project above to view its delay assessment and recommended actions.
      </p>
    </div>
  );
}
