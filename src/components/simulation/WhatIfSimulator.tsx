import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  Building2,
  FileWarning,
  FlaskConical,
  Gauge,
  Gavel,
  LandPlot,
  LoaderCircle,
  RotateCcw,
  Scale,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from "lucide-react";
import {
  motion,
} from "motion/react";

import {
  getSimulationFeatures,
  runSimulation,
} from "../../services/simulationApi";

import type {
  RiskFeatures,
} from "../../types/risk";

import type {
  SimulationChangeSet,
  SimulationResponse,
} from "../../types/simulation";

import SimulationResult from "./SimulationResult";

type Props = {
  projectId: string;
  onSimulationSaved?: () => void;
};

type FormValues = {
  pending_parcels: number;
  ownership_disputes: number;
  ownership_pending: number;
  survey_pending: number;
  active_litigation_cases: number;
  high_risk_litigation_cases: number;
  missing_documents: number;
  compensation_pending: number;
  pending_approvals: number;
  max_overdue_days: number;
  overdue_actions: number;
  high_priority_open_actions: number;
  completion_percentage: number;
};

function mapFeaturesToForm(
  features: RiskFeatures,
): FormValues {
  return {
    pending_parcels:
      features.pending_parcels,
    ownership_disputes:
      features.ownership_disputes,
    ownership_pending:
      features.ownership_pending,
    survey_pending:
      features.survey_pending,
    active_litigation_cases:
      features.active_litigation_cases,
    high_risk_litigation_cases:
      features.high_risk_litigation_cases,
    missing_documents:
      features.missing_documents,
    compensation_pending:
      features.compensation_pending,
    pending_approvals:
      features.pending_approvals,
    max_overdue_days:
      features.max_overdue_days,
    overdue_actions:
      features.overdue_actions,
    high_priority_open_actions:
      features.high_priority_open_actions,
    completion_percentage:
      features.completion_percentage,
  };
}

type ControlProps = {
  label: string;
  description: string;
  value: number;
  original: number;
  max: number;
  suffix?: string;
  onChange: (
    value: number,
  ) => void;
};

function ScenarioControl({
  label,
  description,
  value,
  original,
  max,
  suffix = "",
  onChange,
}: ControlProps) {
  const safeMax = Math.max(
    max,
    original,
    value,
    1,
  );

  const changed =
    value !== original;

  return (
    <div className="rounded-2xl border border-[#e3e9e0] bg-[#fbfcfa] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#294b40]">
            {label}
          </p>

          <p className="mt-1 text-[11px] leading-4 text-[#7c8880]">
            {description}
          </p>
        </div>

        <div className="text-right">
          <span
            className={`inline-flex min-w-[58px] justify-center rounded-lg px-2.5 py-1.5 text-xs font-bold ${
              changed
                ? "bg-[#e7efe6] text-[#3f6956]"
                : "bg-[#f0f3ee] text-[#66746c]"
            }`}
          >
            {value}
            {suffix}
          </span>

          {changed && (
            <p className="mt-1 text-[9px] font-medium text-[#8b7a4a]">
              was {original}
              {suffix}
            </p>
          )}
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={safeMax}
        step={1}
        value={value}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value,
            ),
          )
        }
        className="mt-4 w-full accent-[#4d765f]"
      />

      <div className="mt-1 flex justify-between text-[9px] text-[#9aa39d]">
        <span>0</span>
        <span>
          {safeMax}
          {suffix}
        </span>
      </div>
    </div>
  );
}

type GroupProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
};

function ControlGroup({
  icon,
  title,
  description,
  children,
}: GroupProps) {
  return (
    <section className="rounded-[24px] border border-[#dfe6dc] bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef3ec] text-[#496b5b]">
          {icon}
        </div>

        <div>
          <h3 className="font-semibold text-[#173f35]">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-[#7b877f]">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export default function WhatIfSimulator({
  projectId,
  onSimulationSaved,
}: Props) {
  const [features, setFeatures] =
    useState<RiskFeatures | null>(
      null,
    );

  const [values, setValues] =
    useState<FormValues | null>(
      null,
    );

  const [result, setResult] =
    useState<SimulationResponse | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [running, setRunning] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data =
          await getSimulationFeatures(
            projectId,
          );

        if (!active) return;

        setFeatures(data);
        setValues(
          mapFeaturesToForm(data),
        );
        setResult(null);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load project features.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [projectId]);

  function updateValue(
    key: keyof FormValues,
    value: number,
  ) {
    setValues((current) => {
      if (!current) return current;

      return {
        ...current,
        [key]: value,
      };
    });

    setResult(null);
  }

  function resetScenario() {
    if (!features) return;

    setValues(
      mapFeaturesToForm(features),
    );
    setResult(null);
  }

  function optimiseWorkflow() {
    if (!values) return;

    setValues({
      ...values,

      pending_parcels:
        Math.floor(
          values.pending_parcels *
            0.5,
        ),

      ownership_disputes:
        Math.floor(
          values.ownership_disputes *
            0.5,
        ),

      ownership_pending:
        Math.floor(
          values.ownership_pending *
            0.5,
        ),

      survey_pending:
        Math.floor(
          values.survey_pending *
            0.5,
        ),

      missing_documents:
        Math.floor(
          values.missing_documents *
            0.5,
        ),

      compensation_pending:
        Math.floor(
          values.compensation_pending *
            0.5,
        ),

      pending_approvals:
        Math.floor(
          values.pending_approvals *
            0.5,
        ),

      max_overdue_days:
        Math.floor(
          values.max_overdue_days *
            0.5,
        ),

      overdue_actions:
        Math.floor(
          values.overdue_actions *
            0.5,
        ),

      completion_percentage:
        Math.min(
          values.completion_percentage +
            20,
          100,
        ),
    });

    setResult(null);
  }

  function resolveLegalBlockers() {
    if (!values) return;

    setValues({
      ...values,
      ownership_disputes: 0,
      active_litigation_cases: 0,
      high_risk_litigation_cases: 0,
    });

    setResult(null);
  }

  function clearAdministrativeBacklog() {
    if (!values) return;

    setValues({
      ...values,
      missing_documents: 0,
      compensation_pending: 0,
      pending_approvals: 0,
      max_overdue_days: 0,
      overdue_actions: 0,
    });

    setResult(null);
  }

  const changedCount =
    useMemo(() => {
      if (!features || !values) {
        return 0;
      }

      const original =
        mapFeaturesToForm(features);

      return (
        Object.keys(values) as Array<
          keyof FormValues
        >
      ).filter(
        (key) =>
          values[key] !==
          original[key],
      ).length;
    }, [features, values]);

  async function handleRun() {
    if (!values) return;

    try {
      setRunning(true);
      setError(null);

      const changes:
        SimulationChangeSet = {
        ...values,
      };

      const response =
        await runSimulation(
          projectId,
          changes,
        );

      setResult(response);

      if (
        response.saved &&
        onSimulationSaved
      ) {
        onSimulationSaved();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to run simulation.",
      );
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <section className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-[#dce5da] bg-white">
        <LoaderCircle className="animate-spin text-[#4e735f]" />

        <span className="ml-3 text-sm text-[#718078]">
          Creating project Digital
          Twin...
        </span>
      </section>
    );
  }

  if (
    !features ||
    !values
  ) {
    return (
      <section className="rounded-[28px] border border-red-100 bg-white p-6">
        <div className="flex gap-3">
          <AlertCircle className="text-red-600" />

          <p className="text-sm text-red-700">
            {error ??
              "Project features unavailable."}
          </p>
        </div>
      </section>
    );
  }

  const original =
    mapFeaturesToForm(features);

  return (
    <section className="space-y-5">
      {/* toolbar */}

      <div className="rounded-[28px] border border-[#dce5da] bg-[#f9fbf7] p-5 shadow-[0_12px_40px_rgba(23,63,53,0.045)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#967b45]">
              <SlidersHorizontal size={15} />

              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
                Scenario assumptions
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold text-[#173f35]">
              Test an intervention strategy
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-[#758179]">
              Adjust temporary workflow
              values below. Live project
              records remain unchanged.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[#dce5da] bg-white px-3 py-2 text-xs text-[#66756d]">
              <span className="font-bold text-[#173f35]">
                {changedCount}
              </span>{" "}
              assumptions changed
            </div>

            <button
              type="button"
              onClick={
                resetScenario
              }
              className="inline-flex items-center gap-2 rounded-xl border border-[#dce5da] bg-white px-3 py-2 text-xs font-semibold text-[#45675a] transition hover:bg-[#f4f7f2]"
            >
              <RotateCcw
                size={14}
              />
              Reset
            </button>
          </div>
        </div>

        {/* Presets */}

        <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e2e8df] pt-5">
          <span className="mr-1 self-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#89958d]">
            Scenario presets
          </span>

          <motion.button
            whileTap={{
              scale: 0.97,
            }}
            type="button"
            onClick={
              optimiseWorkflow
            }
            className="inline-flex items-center gap-2 rounded-full bg-[#173f35] px-4 py-2 text-xs font-semibold text-white"
          >
            <Sparkles size={14} />
            Balanced intervention
          </motion.button>

          <motion.button
            whileTap={{
              scale: 0.97,
            }}
            type="button"
            onClick={
              resolveLegalBlockers
            }
            className="inline-flex items-center gap-2 rounded-full border border-[#dce5da] bg-white px-4 py-2 text-xs font-semibold text-[#173f35]"
          >
            <Scale size={14} />
            Resolve legal blockers
          </motion.button>

          <motion.button
            whileTap={{
              scale: 0.97,
            }}
            type="button"
            onClick={
              clearAdministrativeBacklog
            }
            className="inline-flex items-center gap-2 rounded-full border border-[#dce5da] bg-white px-4 py-2 text-xs font-semibold text-[#173f35]"
          >
            <Workflow size={14} />
            Clear admin backlog
          </motion.button>
        </div>
      </div>

      {/* grouped controls */}

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <ControlGroup
          icon={<LandPlot size={17} />}
          title="Land & Ownership"
          description="Test parcel acquisition and ownership-resolution scenarios."
        >
          <ScenarioControl
            label="Pending parcels"
            description="Parcels still awaiting workflow completion."
            value={
              values.pending_parcels
            }
            original={
              original.pending_parcels
            }
            max={
              features.total_parcels >
              0
                ? features.total_parcels
                : Math.max(
                    original.pending_parcels *
                      2,
                    10,
                  )
            }
            onChange={(value) =>
              updateValue(
                "pending_parcels",
                value,
              )
            }
          />

          <ScenarioControl
            label="Ownership disputes"
            description="Unresolved ownership conflicts."
            value={
              values.ownership_disputes
            }
            original={
              original.ownership_disputes
            }
            max={Math.max(
              original.ownership_disputes *
                2,
              10,
            )}
            onChange={(value) =>
              updateValue(
                "ownership_disputes",
                value,
              )
            }
          />

          <ScenarioControl
            label="Ownership pending"
            description="Ownership reviews awaiting closure."
            value={
              values.ownership_pending
            }
            original={
              original.ownership_pending
            }
            max={Math.max(
              original.ownership_pending *
                2,
              10,
            )}
            onChange={(value) =>
              updateValue(
                "ownership_pending",
                value,
              )
            }
          />

          <ScenarioControl
            label="Survey pending"
            description="Incomplete parcel survey work."
            value={
              values.survey_pending
            }
            original={
              original.survey_pending
            }
            max={Math.max(
              features.total_parcels,
              original.survey_pending *
                2,
              10,
            )}
            onChange={(value) =>
              updateValue(
                "survey_pending",
                value,
              )
            }
          />
        </ControlGroup>

        <ControlGroup
          icon={<Gavel size={17} />}
          title="Legal & Litigation"
          description="Explore the effect of resolving legal blockers."
        >
          <ScenarioControl
            label="Active litigation"
            description="Active cases linked with acquisition."
            value={
              values.active_litigation_cases
            }
            original={
              original.active_litigation_cases
            }
            max={Math.max(
              original.active_litigation_cases *
                2,
              10,
            )}
            onChange={(value) =>
              updateValue(
                "active_litigation_cases",
                value,
              )
            }
          />

          <ScenarioControl
            label="High-risk litigation"
            description="Cases classified as high workflow risk."
            value={
              values.high_risk_litigation_cases
            }
            original={
              original.high_risk_litigation_cases
            }
            max={Math.max(
              original.high_risk_litigation_cases *
                2,
              10,
            )}
            onChange={(value) =>
              updateValue(
                "high_risk_litigation_cases",
                value,
              )
            }
          />
        </ControlGroup>

        <ControlGroup
          icon={
            <FileWarning size={17} />
          }
          title="Administration & Compensation"
          description="Test clearance of documents, compensation and approvals."
        >
          <ScenarioControl
            label="Missing documents"
            description="Mandatory records currently unavailable."
            value={
              values.missing_documents
            }
            original={
              original.missing_documents
            }
            max={Math.max(
              original.missing_documents *
                2,
              10,
            )}
            onChange={(value) =>
              updateValue(
                "missing_documents",
                value,
              )
            }
          />

          <ScenarioControl
            label="Compensation pending"
            description="Compensation records awaiting completion."
            value={
              values.compensation_pending
            }
            original={
              original.compensation_pending
            }
            max={Math.max(
              original.compensation_pending *
                2,
              10,
            )}
            onChange={(value) =>
              updateValue(
                "compensation_pending",
                value,
              )
            }
          />

          <ScenarioControl
            label="Pending approvals"
            description="Administrative approvals not yet cleared."
            value={
              values.pending_approvals
            }
            original={
              original.pending_approvals
            }
            max={Math.max(
              original.pending_approvals *
                2,
              10,
            )}
            onChange={(value) =>
              updateValue(
                "pending_approvals",
                value,
              )
            }
          />

          <ScenarioControl
            label="Maximum overdue days"
            description="Largest overdue duration in the workflow."
            value={
              values.max_overdue_days
            }
            original={
              original.max_overdue_days
            }
            max={Math.max(
              original.max_overdue_days *
                2,
              120,
            )}
            suffix="d"
            onChange={(value) =>
              updateValue(
                "max_overdue_days",
                value,
              )
            }
          />
        </ControlGroup>

        <ControlGroup
          icon={
            <Building2 size={17} />
          }
          title="Delivery & Action Centre"
          description="Test action backlog reduction and project progress."
        >
          <ScenarioControl
            label="Overdue actions"
            description="Action Centre tasks currently overdue."
            value={
              values.overdue_actions
            }
            original={
              original.overdue_actions
            }
            max={Math.max(
              original.overdue_actions *
                2,
              10,
            )}
            onChange={(value) =>
              updateValue(
                "overdue_actions",
                value,
              )
            }
          />

          <ScenarioControl
            label="High-priority actions"
            description="Open tasks requiring urgent attention."
            value={
              values.high_priority_open_actions
            }
            original={
              original.high_priority_open_actions
            }
            max={Math.max(
              original.high_priority_open_actions *
                2,
              10,
            )}
            onChange={(value) =>
              updateValue(
                "high_priority_open_actions",
                value,
              )
            }
          />

          <ScenarioControl
            label="Completion"
            description="Assumed overall acquisition workflow completion."
            value={
              values.completion_percentage
            }
            original={
              original.completion_percentage
            }
            max={100}
            suffix="%"
            onChange={(value) =>
              updateValue(
                "completion_percentage",
                value,
              )
            }
          />
        </ControlGroup>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="shrink-0"
          />
          {error}
        </div>
      )}

      {/* Run bar */}

      <div className="sticky bottom-4 z-10 flex flex-col gap-4 rounded-[22px] border border-[#cdd9cf] bg-white/95 p-4 shadow-[0_14px_45px_rgba(23,63,53,0.14)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3ed] text-[#426a57]">
            <Gauge size={18} />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#173f35]">
              Scenario ready
            </p>

            <p className="text-xs text-[#78847c]">
              {changedCount === 0
                ? "Adjust a control or apply a preset."
                : `${changedCount} workflow assumptions will be tested.`}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{
            y: -1,
          }}
          whileTap={{
            scale: 0.98,
          }}
          type="button"
          disabled={
            running ||
            changedCount === 0
          }
          onClick={handleRun}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173f35] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#214f43] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {running ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          ) : (
            <FlaskConical
              size={17}
            />
          )}

          {running
            ? "Running Digital Twin..."
            : "Run scenario"}
        </motion.button>
      </div>

      {result && (
        <SimulationResult
          result={result}
        />
      )}
    </section>
  );
}