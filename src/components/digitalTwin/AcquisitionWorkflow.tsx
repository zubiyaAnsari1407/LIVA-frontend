import {
  ArrowRight,
  CheckCircle2,
  Circle,
  FileCheck2,
  Gavel,
  IndianRupee,
  MapPinned,
  Search,
  Users,
} from "lucide-react";

import type {
  DigitalTwinProject,
  DigitalTwinSummary,
} from "../../types/digitalTwin";

type WorkflowStep = {
  title: string;
  description: string;
  status: "completed" | "current" | "pending";
  icon: React.ElementType;
};

type AcquisitionWorkflowProps = {
  project: DigitalTwinProject;
  summary: DigitalTwinSummary;
};

export default function AcquisitionWorkflow({
  project,
  summary,
}: AcquisitionWorkflowProps) {
  const {
    surveyPending,
    ownershipPending,
    compensationPending,
    activeLitigationCases,
    pendingApprovals,
  } = summary.metrics;

  /*
   * The project object is intentionally accepted because
   * DigitalTwinOverview provides the selected project.
   * The workflow itself is driven by the current summary metrics.
   */
  void project;

  const steps: WorkflowStep[] = [
    {
      title: "Survey",
      description:
        surveyPending > 0
          ? `${surveyPending} survey record${
              surveyPending > 1 ? "s" : ""
            } pending`
          : "Survey information available",
      status:
        surveyPending > 0
          ? "current"
          : "completed",
      icon: Search,
    },

    {
      title: "Ownership",
      description:
        ownershipPending > 0
          ? `${ownershipPending} ownership record${
              ownershipPending > 1 ? "s" : ""
            } pending`
          : "Ownership records available",
      status:
        ownershipPending > 0
          ? "current"
          : surveyPending > 0
            ? "pending"
            : "completed",
      icon: Users,
    },

    {
      title: "Compensation",
      description:
        compensationPending > 0
          ? `${compensationPending} compensation record${
              compensationPending > 1 ? "s" : ""
            } pending`
          : "Compensation position available",
      status:
        compensationPending > 0
          ? "current"
          : ownershipPending > 0
            ? "pending"
            : "completed",
      icon: IndianRupee,
    },

    {
      title: "Legal & Litigation",
      description:
        activeLitigationCases > 0
          ? `${activeLitigationCases} active litigation case${
              activeLitigationCases > 1 ? "s" : ""
            }`
          : "No active litigation records",
      status:
        activeLitigationCases > 0
          ? "current"
          : "completed",
      icon: Gavel,
    },

    {
      title: "Approval",
      description:
        pendingApprovals > 0
          ? `${pendingApprovals} approval${
              pendingApprovals > 1 ? "s" : ""
            } pending`
          : "Approval information available",
      status:
        pendingApprovals > 0
          ? "current"
          : "pending",
      icon: FileCheck2,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf5f2] text-[#174f43]">
            <MapPinned size={20} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Acquisition Workflow
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Current position of the land-acquisition process
              from survey through approval.
            </p>
          </div>

        </div>
      </div>

      {/* Workflow */}
      <div className="px-6 py-7">
        <div className="overflow-x-auto">
          <div className="flex min-w-[900px] items-start">

            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast =
                index === steps.length - 1;

              return (
                <div
                  key={step.title}
                  className="flex flex-1 items-start"
                >

                  {/* Step */}
                  <div className="flex min-w-0 flex-1 flex-col items-center text-center">

                    {/* Icon */}
                    <div
                      className={[
                        "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors",

                        step.status === "completed"
                          ? "border-[#174f43] bg-[#174f43] text-white"

                          : step.status === "current"
                            ? "border-[#174f43] bg-[#edf5f2] text-[#174f43]"

                            : "border-slate-300 bg-white text-slate-400",
                      ].join(" ")}
                    >
                      {step.status === "completed" ? (
                        <CheckCircle2 size={21} />
                      ) : (
                        <Icon size={21} />
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-1 max-w-[155px] text-xs leading-5 text-slate-500">
                      {step.description}
                    </p>

                    {/* Status */}
                    <span
                      className={[
                        "mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",

                        step.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"

                          : step.status === "current"
                            ? "bg-amber-50 text-amber-700"

                            : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      {step.status === "completed" ? (
                        <>
                          <CheckCircle2 size={11} />
                          Completed
                        </>
                      ) : step.status === "current" ? (
                        <>
                          <Circle size={10} />
                          Current
                        </>
                      ) : (
                        <>
                          <Circle size={10} />
                          Pending
                        </>
                      )}
                    </span>

                  </div>

                  {/* Connector */}
                  {!isLast && (
                    <div className="mt-6 flex w-16 shrink-0 items-center justify-center">
                      <ArrowRight
                        size={18}
                        className="text-slate-300"
                      />
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
        <p className="text-xs leading-5 text-slate-500">
          Workflow status is based on the acquisition records
          currently available for this project.
        </p>
      </div>
    </section>
  );
}