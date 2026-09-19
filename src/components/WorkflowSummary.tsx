import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ReactNode,
} from "react";

import {
  Building2,
  FileText,
  Gavel,
  HandCoins,
  IndianRupee,
  LandPlot,
  RefreshCw,
  UsersRound,
  ClipboardCheck,
  WalletCards,
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
} from "lucide-react";

import {
  motion,
} from "motion/react";

import {
  workflowRequest,
  workflowError,
} from "../services/workflowApi";

import type {
  WorkflowSummary as Summary,
} from "../services/workflowApi";


type CompensationRecord = {
  id?: string;
  approved?: number | string | null;
  disbursed?: number | string | null;
};


type CompensationResponse = {
  items?: CompensationRecord[];
  total?: number;
};


type MoneyTotals = {
  approved: number;
  disbursed: number;
  balance: number;
  records: number;
};


function moneyNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replaceAll(",", "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}


function formatRupees(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
}


function safeDate(value: string | Date): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


export default function WorkflowSummary({
  projectId,
}: {
  projectId?: string;
}) {
  const [
    data,
    setData,
  ] = useState<Summary | null>(null);

  const [
    money,
    setMoney,
  ] = useState<MoneyTotals | null>(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    reload,
    setReload,
  ] = useState(0);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  useEffect(() => {
    const controller = new AbortController();

    setData(null);
    setMoney(null);
    setError("");

    const summaryQuery = projectId
      ? `?projectId=${encodeURIComponent(projectId)}`
      : "";

    const compensationQuery = projectId
      ? `?skip=0&limit=100&projectId=${encodeURIComponent(projectId)}`
      : "?skip=0&limit=100";

    Promise.all([
      workflowRequest<Summary>(
        `/api/workflow/summary${summaryQuery}`,
        {
          signal: controller.signal,
        },
      ),
      workflowRequest<CompensationResponse>(
        `/api/compensation${compensationQuery}`,
        {
          signal: controller.signal,
        },
      ),
    ])
      .then(([
        summary,
        compensation,
      ]) => {
        if (controller.signal.aborted) {
          return;
        }

        const rows = Array.isArray(compensation.items)
          ? compensation.items
          : [];

        const approved = rows.reduce(
          (total, row) => total + moneyNumber(row.approved),
          0,
        );

        const disbursed = rows.reduce(
          (total, row) => total + moneyNumber(row.disbursed),
          0,
        );

        setData(summary);
        setMoney({
          approved,
          disbursed,
          balance: Math.max(0, approved - disbursed),
          records:
            typeof compensation.total === "number"
              ? compensation.total
              : rows.length,
        });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(
            workflowError(requestError),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setRefreshing(false);
        }
      });

    return () => controller.abort();
  }, [
    projectId,
    reload,
  ]);


  function handleRefresh() {
    setRefreshing(true);
    setReload((value) => value + 1);
  }


  const operationalCards = useMemo(
    () =>
      data
        ? [
            {
              label: "Projects",
              value: data.projects,
              icon: Building2,
              eyebrow: "Portfolio",
              iconClass:
                "bg-[#edf4ef] text-[#315f53] ring-[#dce9df]",
            },
            {
              label: "Land parcels",
              value: data.parcels,
              icon: LandPlot,
              eyebrow: "Acquisition",
              iconClass:
                "bg-[#f4f3e9] text-[#7f6c38] ring-[#e9e2c8]",
            },
            {
              label: "Documents",
              value: data.documents,
              icon: FileText,
              eyebrow: "Records",
              iconClass:
                "bg-[#eef3f0] text-[#42685b] ring-[#dde8e2]",
            },
            {
              label: "Court cases",
              value: data.cases,
              icon: Gavel,
              eyebrow: "Legal",
              iconClass:
                "bg-[#f5f0e9] text-[#8b683d] ring-[#ebe0d0]",
            },
            {
              label: "Open actions",
              value: data.openActions,
              icon: ClipboardCheck,
              eyebrow: "Operations",
              iconClass:
                "bg-[#edf4ef] text-[#315f53] ring-[#dce9df]",
            },
            {
              label: "R&R records",
              value: data.rehabilitationRecords,
              icon: UsersRound,
              eyebrow: "Rehabilitation",
              iconClass:
                "bg-[#f4f3e9] text-[#7f6c38] ring-[#e9e2c8]",
            },
          ]
        : [],
    [data],
  );


  const paidPercent =
    money && money.approved > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (money.disbursed / money.approved) * 100,
          ),
        )
      : 0;


  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 14,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
      }}
      transition={{
        duration: 0.45,
      }}
      className="mb-7 overflow-hidden rounded-[30px] border border-[#dce5da] bg-white shadow-[0_18px_55px_rgba(23,63,53,0.07)]"
      aria-label="Saved workflow summary"
    >
      {/* HEADER */}
      <div className="flex flex-col gap-5 border-b border-[#e8eee7] bg-[linear-gradient(135deg,#ffffff_0%,#fbfcf9_55%,#f4f7f1_100%)] px-6 py-6 md:flex-row md:items-center md:justify-between lg:px-7">
        <div className="flex items-start gap-4">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#173f35] text-white shadow-[0_10px_24px_rgba(23,63,53,0.16)] sm:flex">
            <BadgeCheck
              size={22}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9a7c42]">
              Portfolio overview
            </p>

            <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-[#173f35]">
              Saved workflow summary
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#75827a]">
              Live operational totals from saved LIVA workflow records and connected modules.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#d7e1d8] bg-white px-4 py-2.5 text-xs font-semibold text-[#36594c] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c8d6cb] hover:bg-[#f8faf7] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
            aria-hidden="true"
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh data"}
        </button>
      </div>


      {error ? (
        <div
          className="m-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : !data || !money ? (
        <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="h-[128px] animate-pulse rounded-[22px] bg-[#f1f4ef]"
            />
          ))}
        </div>
      ) : (
        <>
          {/* OPERATIONAL METRICS */}
          <div className="p-6 lg:p-7">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {operationalCards.map(
                (
                  {
                    label,
                    value,
                    icon: Icon,
                    eyebrow,
                    iconClass,
                  },
                  index,
                ) => (
                  <motion.article
                    key={label}
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: index * 0.04,
                    }}
                    whileHover={{
                      y: -3,
                    }}
                    className="group relative min-h-[132px] overflow-hidden rounded-[22px] border border-[#e0e7df] bg-white p-4 shadow-[0_7px_22px_rgba(23,63,53,0.045)] transition-shadow hover:shadow-[0_13px_32px_rgba(23,63,53,0.09)]"
                  >
                    <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#f4f7f2] transition-transform duration-300 group-hover:scale-125" />

                    <div className="relative flex items-start justify-between gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-[15px] ring-1 ${iconClass}`}
                      >
                        <Icon
                          size={20}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full border border-[#e6ece6] bg-[#fafbf9] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#839087]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#4f7d68]" />
                        Live
                      </span>
                    </div>

                    <div className="relative mt-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#9a7c42]">
                        {eyebrow}
                      </p>

                      <div className="mt-1 flex items-end justify-between gap-2">
                        <div>
                          <p className="text-[28px] font-semibold leading-none tracking-[-0.05em] text-[#173f35]">
                            {value}
                          </p>

                          <p className="mt-2 text-[12px] font-medium text-[#68776f]">
                            {label}
                          </p>
                        </div>

                        <ArrowUpRight
                          size={15}
                          className="mb-0.5 text-[#a1aaa4] opacity-0 transition group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </motion.article>
                ),
              )}
            </div>


            {/* FINANCIAL SUMMARY */}
            <div className="mt-6 overflow-hidden rounded-[26px] border border-[#dce5da] bg-[#fbfcfa] shadow-[0_8px_25px_rgba(23,63,53,0.04)]">
              <div className="flex flex-col gap-4 border-b border-[#e5ebe2] bg-[linear-gradient(100deg,#f8faf7_0%,#f5f8f2_55%,#faf8f1_100%)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#173f35] text-white shadow-[0_8px_20px_rgba(23,63,53,0.16)]">
                    <IndianRupee
                      size={20}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#9a7c42]">
                      Compensation finance
                    </p>

                    <h3 className="mt-0.5 text-[15px] font-semibold tracking-[-0.02em] text-[#173f35]">
                      Recorded payment summary
                    </h3>

                    <p className="mt-0.5 text-[11px] text-[#7d8982]">
                      {money.records} saved compensation {money.records === 1 ? "record" : "records"}
                    </p>
                  </div>
                </div>

                <div className="min-w-[190px] rounded-xl border border-[#e3e9df] bg-white/80 px-4 py-3">
                  <div className="flex items-center justify-between gap-4 text-[10px]">
                    <span className="font-medium text-[#7c8981]">
                      Disbursement progress
                    </span>
                    <strong className="text-[#315f53]">
                      {paidPercent.toFixed(0)}%
                    </strong>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8eee8]">
                    <div
                      className="h-full rounded-full bg-[#4f7d68] transition-[width] duration-500"
                      style={{
                        width: `${paidPercent}%`,
                      }}
                    />
                  </div>
                </div>
              </div>


              <div className="grid gap-px bg-[#e5ebe2] md:grid-cols-3">
                <FinancialMetric
                  icon={
                    <WalletCards
                      size={20}
                      strokeWidth={1.7}
                    />
                  }
                  label="Approved amount"
                  value={formatRupees(money.approved)}
                  note="Total sanctioned compensation"
                  tone="green"
                />

                <FinancialMetric
                  icon={
                    <HandCoins
                      size={20}
                      strokeWidth={1.7}
                    />
                  }
                  label="Paid amount"
                  value={formatRupees(money.disbursed)}
                  note="Recorded disbursement"
                  tone="deep"
                />

                <FinancialMetric
                  icon={
                    <CircleDollarSign
                      size={20}
                      strokeWidth={1.7}
                    />
                  }
                  label="Balance"
                  value={formatRupees(money.balance)}
                  note="Approved less paid"
                  tone="gold"
                />
              </div>
            </div>


            {/* FOOTER */}
            <div className="mt-4 flex flex-col gap-1 border-t border-[#e8ece6] pt-4 text-[10px] leading-5 text-[#89948d] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Includes matching saved records, including clearly labelled demo records.
              </p>

              <p>
                Updated {safeDate(data.generatedAt)}
              </p>
            </div>
          </div>
        </>
      )}
    </motion.section>
  );
}


type FinancialTone =
  | "green"
  | "deep"
  | "gold";


function FinancialMetric({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  tone: FinancialTone;
}) {
  const toneClasses: Record<
    FinancialTone,
    string
  > = {
    green:
      "bg-[#eef5ef] text-[#315f53] ring-[#dbe8dd]",
    deep:
      "bg-[#eaf1ee] text-[#173f35] ring-[#d8e5df]",
    gold:
      "bg-[#f6f2e7] text-[#8c7138] ring-[#e9e0c6]",
  };

  return (
    <div className="group bg-white px-5 py-5 lg:px-6 lg:py-6">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] ring-1 ${toneClasses[tone]}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#849088]">
            {label}
          </p>

          <p className="mt-1.5 break-words text-[22px] font-semibold tracking-[-0.035em] text-[#173f35] sm:text-[24px]">
            {value}
          </p>

          <p className="mt-1 text-[10px] leading-4 text-[#8b968f]">
            {note}
          </p>
        </div>
      </div>
    </div>
  );
}
