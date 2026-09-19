import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  ChevronDown,
  LoaderCircle,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useSearchParams,
} from "react-router";
import { motion } from "motion/react";


import {
  getProjectRisk,
} from "../services/riskApi";


import type {
  RiskPrediction,
} from "../types/risk";

import MLDelaySignal from "../components/risk/MLDelaySignal";
type Tab =
  | "overview"
  | "explain"
  | "simulate";
type ProjectOption = {
  id: string;
  name: string;
  state: string | null;
  district: string | null;
}
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";

function normalizeProjects(
  payload: unknown,
): ProjectOption[] {
  const raw =
    Array.isArray(payload)
      ? payload
      : typeof payload === "object" &&
          payload !== null &&
          "items" in payload &&
          Array.isArray(
            (payload as { items: unknown[] }).items,
          )
        ? (payload as { items: unknown[] }).items
        : [];

  return raw
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null
      ) {
        return null;
      }

      const record =
        item as Record<string, unknown>;

      const id = String(
        record.id ??
          record._id ??
          record.project_id ??
          "",
      );

      if (!id) return null;

      return {
        id,
        name: String(
          record.name ??
            record.project_name ??
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
      };
    })
    .filter(
      (
        project,
      ): project is ProjectOption =>
        project !== null,
    );
}
function levelClass(
  level: RiskPrediction["risk_level"],
) {
  if (level === "LOW") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (level === "MEDIUM") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (level === "HIGH") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

export default function IntelligencePage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const requestedTab =
    searchParams.get("tab");

  const activeTab: Tab =
    requestedTab === "explain" ||
    requestedTab === "overview"
      ? requestedTab
      : "overview";

  const selectedProjectId =
    searchParams.get("projectId") ??
    "";

  const [
    projects,
    setProjects,
  ] = useState<ProjectOption[]>([]);

  const [
    loadingProjects,
    setLoadingProjects,
  ] = useState(true);

  const [
    risk,
    setRisk,
  ] =
    useState<RiskPrediction | null>(
      null,
    );

  const [
    loadingRisk,
    setLoadingRisk,
  ] = useState(false);

  const [
    riskError,
    setRiskError,
  ] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoadingProjects(true);

        const response = await fetch(
          `${API_BASE_URL}/api/projects`,
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load projects.",
          );
        }

        const payload =
          await response.json();

        if (!active) {
          return;
        }

        setProjects(
          normalizeProjects(payload),
        );
      } catch {
        if (active) {
          setProjects([]);
        }
      } finally {
        if (active) {
          setLoadingProjects(false);
        }
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  const loadRisk =
    useCallback(async () => {
      if (!selectedProjectId) {
        setRisk(null);
        setRiskError(null);
        return;
      }

      try {
        setLoadingRisk(true);
        setRiskError(null);

        const result =
          await getProjectRisk(
            selectedProjectId,
          );

        setRisk(result);
      } catch (error) {
        setRisk(null);

        setRiskError(
          error instanceof Error
            ? error.message
            : "Unable to load risk intelligence.",
        );
      } finally {
        setLoadingRisk(false);
      }
    }, [selectedProjectId]);

  useEffect(() => {
    loadRisk();
  }, [loadRisk]);

  const selectedProject =
    useMemo(
      () =>
        projects.find(
          (project) =>
            project.id ===
            selectedProjectId,
        ),
      [
        projects,
        selectedProjectId,
      ],
    );

  function changeTab(tab: Tab) {
    const next =
      new URLSearchParams(
        searchParams,
      );

    next.set("tab", tab);

    setSearchParams(next);
  }

  function changeProject(
    projectId: string,
  ) {
    const next =
      new URLSearchParams(
        searchParams,
      );

    if (projectId) {
      next.set(
        "projectId",
        projectId,
      );
    } else {
      next.delete("projectId");
    }

    setSearchParams(next);
  }
  return (
    <main className="min-h-screen bg-[#f4f7f1] text-[#173f35]">
      {/* TOP NAV */}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#143f35] text-white shadow-sm">
        <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-8">
            <Link
              to="/dashboard"
              className="text-2xl font-bold tracking-[-0.04em]"
            >
              Liva.
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              <Link
                to="/dashboard"
                className="text-white/70 transition hover:text-white"
              >
                Overview
              </Link>

              <Link
                to="/projects"
                className="text-white/70 transition hover:text-white"
              >
                Projects
              </Link>

              <span className="border-b-2 border-[#d1b66f] py-6">
                Intelligence
              </span>

              <Link
                to="/actions"
                className="text-white/70 transition hover:text-white"
              >
                Action Centre
              </Link>
            </nav>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
          >
            <ArrowLeft size={15} />
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
        {/* BREADCRUMB */}

        <p className="text-xs font-medium text-[#718078]">
          Workspace
          <span className="mx-2 text-[#b1bbb4]">
            /
          </span>
          Delay Intelligence
        </p>

        {/* HERO */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative mt-5 overflow-hidden rounded-[30px] bg-[#173f35] px-6 py-8 text-white shadow-[0_20px_55px_rgba(23,63,53,0.16)] md:px-9 md:py-10"
        >
          <div className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute right-10 top-10 h-52 w-52 rounded-full bg-[#d1b66f]/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_430px] lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-[#d8c58f]">
                <Sparkles size={14} />

                <span className="text-[10px] font-bold uppercase tracking-[0.22em]">
                  Predict · Explain · Act
                </span>
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] md:text-[42px]">
                Understand delay risk.
                <br />
                Test the next move.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                Connect operational project
                records with explainable risk
                intelligence and transparent
                what-if scenarios.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#d8c58f]">
                Active project
              </label>

              <div className="relative mt-2">
                <select
                  value={
                    selectedProjectId
                  }
                  disabled={
                    loadingProjects
                  }
                  onChange={(event) =>
                    changeProject(
                      event.target.value,
                    )
                  }
                  className="w-full appearance-none rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3.5 pr-10 text-sm font-semibold text-white outline-none backdrop-blur transition focus:border-[#d1b66f]/70"
                >
                  <option
                    value=""
                    className="text-[#173f35]"
                  >
                    Select a project
                  </option>

                  {projects.map(
                    (project) => (
                      <option
                        key={
                          project.id
                        }
                        value={
                          project.id
                        }
                        className="text-[#173f35]"
                      >
                        {project.name}
                      </option>
                    ),
                  )}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                />
              </div>

              {selectedProject && (
                <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
                  <MapPin size={13} />

                  {[
                    selectedProject.district,
                    selectedProject.state,
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                    "Location not recorded"}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* PROJECT REQUIRED */}

        {!selectedProjectId ? (
          <motion.section
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="mt-5 rounded-[26px] border border-[#dce5da] bg-white px-6 py-12 text-center shadow-sm"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3eb] text-[#52705f]">
              <BrainCircuit
                size={24}
              />
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              Select a project to
              activate intelligence
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#748179]">
              Risk analysis and Digital
              Twin simulations use the
              selected project's live LIVA
              workflow records.
            </p>
        <Link
        to="/projects"
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#173f35] px-5 py-3 text-sm font-semibold !text-white"
      >
        Explore projects
      </Link>
          </motion.section>
        ) : (
          <>
            {/* SUMMARY */}

            <section className="mt-5 grid gap-3 md:grid-cols-3">
              <SummaryCard
                icon={
                  <ShieldCheck
                    size={18}
                  />
                }
                label="Current risk"
                loading={loadingRisk}
                value={
                  risk
                    ? `${risk.risk_score.toFixed(
                        1,
                      )} / 100`
                    : "Unavailable"
                }
                detail={
                  risk
                    ? `${risk.risk_level} risk`
                    : "Assessment unavailable"
                }
              />

              <SummaryCard
                icon={
                  <BrainCircuit
                    size={18}
                  />
                }
                label="Risk engine"
                loading={loadingRisk}
                value={
                  risk
                    ? risk.prediction_source.replace(
                        "_",
                        " ",
                      )
                    : "Unavailable"
                }
                detail={
                  risk
                    ? risk.model_version
                    : "No assessment"
                }
              />

              {/* <SummaryCard
                icon={
                  <FlaskConical
                    size={18}
                  />
                }
                label="Digital Twin"
                value="Ready"
                detail="Project-linked scenario workspace"
              /> */}
            </section>

            {/* TABS */}

            <div className="mt-6 border-b border-[#d7e0d5]">
              <div className="flex gap-1 overflow-x-auto">
                <TabButton
                  active={
                    activeTab ===
                    "overview"
                  }
                  onClick={() =>
                    changeTab(
                      "overview",
                    )
                  }
                  icon={
                    <BarChart3
                      size={15}
                    />
                  }
                >
                  Risk overview
                </TabButton>

                <TabButton
                  active={
                    activeTab ===
                    "explain"
                  }
                  onClick={() =>
                    changeTab(
                      "explain",
                    )
                  }
                  icon={
                    <BrainCircuit
                      size={15}
                    />
                  }
                >
                  Explainable factors
                </TabButton>

              </div>
            </div>

            <motion.div
              key={activeTab}
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.3,
              }}
              className="py-6"
            >
              {riskError && (
                <div className="mb-5 flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  {riskError}

                  <button
                    type="button"
                    onClick={loadRisk}
                    className="inline-flex items-center gap-2 font-semibold"
                  >
                    <RefreshCw
                      size={14}
                    />
                    Retry
                  </button>
                </div>
              )}

              {activeTab ===
                "overview" && (
                <RiskOverview
                  risk={risk}
                  loading={
                    loadingRisk
                  }
                />
              )}

              {activeTab ===
                "explain" && (
                <ExplainableView
                  risk={risk}
                  loading={
                    loadingRisk
                  }
                />
              )}
                <MLDelaySignal
      projectId={selectedProjectId}
    />
            
            </motion.div>
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  loading = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  loading?: boolean;
}) {
  return (
    <motion.article
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-[#dce5da] bg-white p-5 shadow-[0_8px_30px_rgba(23,63,53,0.04)]"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[#edf3e8] p-2.5 text-[#55745f]">
          {icon}
        </div>

        <div>
          <p className="text-xs text-[#78857d]">
            {label}
          </p>

          {loading ? (
            <LoaderCircle className="mt-2 animate-spin" />
          ) : (
            <p className="mt-1 text-lg font-semibold text-[#173f35]">
              {value}
            </p>
          )}

          <p className="mt-1 text-[11px] text-[#8b968f]">
            {detail}
          </p>
        </div>
      </div>
    </motion.article>
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
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 whitespace-nowrap px-5 py-4 text-sm font-semibold transition ${
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
          className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#b69345]"
        />
      )}
    </button>
  );
}

function RiskOverview({
  risk,
  loading,
}: {
  risk: RiskPrediction | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center">
        <LoaderCircle className="animate-spin text-[#173f35]" />
      </div>
    );
  }

  if (!risk) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <article className="rounded-[26px] bg-[#173f35] p-6 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d1b66f]">
          Current assessment
        </p>

        <div className="mt-6 flex items-end gap-2">
          <span className="text-6xl font-semibold tracking-[-0.07em]">
            {risk.risk_score.toFixed(
              1,
            )}
          </span>

          <span className="mb-2 text-sm text-white/45">
            / 100
          </span>
        </div>

        <span
          className={`mt-5 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${levelClass(
            risk.risk_level,
          )}`}
        >
          {risk.risk_level} RISK
        </span>

        <div className="mt-7 border-t border-white/10 pt-5">
          <p className="text-xs text-white/45">
            Assessment engine
          </p>

          <p className="mt-1 text-sm font-medium">
            {risk.model_version}
          </p>
        </div>
      </article>

      <article className="rounded-[26px] border border-[#dce5da] bg-white p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#947c49]">
          Priority signal
        </p>

        <h2 className="mt-2 text-xl font-semibold">
          {risk.factors[0]?.label ??
            "No major risk driver detected"}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718078]">
          {risk.factors[0]?.reason ??
            "Current linked workflow records do not contain a major additional risk signal."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MiniMetric
            label="Risk factors"
            value={String(
              risk.factors.length,
            )}
          />

          <MiniMetric
            label="Interventions"
            value={String(
              risk.recommendations
                .length,
            )}
          />

          <MiniMetric
            label="Gov. references"
            value={String(
              risk.government_context
                ?.record_count ?? 0,
            )}
          />
        </div>
      </article>
    </div>
  );
}

function ExplainableView({
  risk,
  loading,
}: {
  risk: RiskPrediction | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center">
        <LoaderCircle className="animate-spin text-[#173f35]" />
      </div>
    );
  }

  if (!risk) {
    return null;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
      <article className="rounded-[26px] border border-[#dce5da] bg-white p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#947c49]">
          Explainable intelligence
        </p>

        <h2 className="mt-2 text-xl font-semibold">
          Why this risk?
        </h2>

        <div className="mt-5 space-y-3">
          {risk.factors.length ===
          0 ? (
            <div className="rounded-2xl bg-[#f6f8f4] p-5 text-sm text-[#718078]">
              No major contributing
              factors were detected.
            </div>
          ) : (
            risk.factors.map(
              (factor, index) => (
                <motion.div
                  key={factor.code}
                  initial={{
                    opacity: 0,
                    x: 10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay:
                      index * 0.05,
                  }}
                  className="rounded-2xl border border-[#e2e8df] bg-[#fafbf8] p-4"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {factor.label}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#748078]">
                        {factor.reason}
                      </p>
                    </div>

                    <span className="shrink-0 font-semibold text-[#9a7c42]">
                      {factor.impact_score >
                      0
                        ? "+"
                        : ""}
                      {factor.impact_score.toFixed(
                        1,
                      )}
                    </span>
                  </div>
                </motion.div>
              ),
            )
          )}
        </div>
      </article>

      <article className="rounded-[26px] bg-[#173f35] p-6 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d1b66f]">
          Government evidence
        </p>

        <h2 className="mt-2 text-xl font-semibold">
          Acquisition benchmark
        </h2>

        {risk.government_context ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <DarkMetric
              label="Records"
              value={String(
                risk
                  .government_context
                  .record_count,
              )}
            />

            <DarkMetric
              label="Avg pending"
              value={`${risk.government_context.average_pending_land_pct.toFixed(
                1,
              )}%`}
            />

            <DarkMetric
              label="Median"
              value={`${risk.government_context.median_pending_land_pct.toFixed(
                1,
              )}%`}
            />

            <DarkMetric
              label="High backlog"
              value={String(
                risk
                  .government_context
                  .high_backlog_projects,
              )}
            />
          </div>
        ) : (
          <p className="mt-5 text-sm text-white/55">
            No matching government
            benchmark is available.
          </p>
        )}

        <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/45">
          Government records provide
          contextual evidence. They do
          not directly alter the current
          rule-based score.
        </p>
      </article>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f5f8f3] p-4">
      <p className="text-xs text-[#78857d]">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}

function DarkMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <p className="text-[11px] text-white/45">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}