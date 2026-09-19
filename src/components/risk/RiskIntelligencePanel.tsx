import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router";

import {
  motion,
} from "motion/react";

import {
  getProjectRisk,
} from "../../services/riskApi";

import type {
  RiskPrediction,
} from "../../types/risk";


type Props = {
  projectId: string;
};


function levelStyle(
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


export default function RiskIntelligencePanel({
  projectId,
}: Props) {
  const [
    risk,
    setRisk,
  ] = useState<RiskPrediction | null>(
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


  const loadRisk =
    useCallback(async () => {
      if (!projectId) {
        setRisk(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result =
          await getProjectRisk(
            projectId,
          );

        setRisk(result);

      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load risk intelligence.",
        );
      } finally {
        setLoading(false);
      }
    }, [projectId]);


  useEffect(() => {
    loadRisk();
  }, [loadRisk]);


  if (loading) {
    return (
      <section className="rounded-[26px] border border-[#dce5da] bg-white p-6 shadow-[0_14px_40px_rgba(23,63,53,0.05)]">
        <div className="animate-pulse">
          <div className="h-3 w-36 rounded-full bg-[#e5ebe3]" />

          <div className="mt-4 h-8 w-56 rounded-xl bg-[#eef2ec]" />

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="h-24 rounded-2xl bg-[#f2f5f0]" />
            <div className="h-24 rounded-2xl bg-[#f2f5f0]" />
            <div className="h-24 rounded-2xl bg-[#f2f5f0]" />
          </div>
        </div>
      </section>
    );
  }


  if (error) {
    return (
      <section className="rounded-[26px] border border-red-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">

          <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
            <AlertCircle
              size={18}
            />
          </div>

          <div>
            <p className="font-semibold text-[#173f35]">
              Risk preview unavailable
            </p>

            <p className="mt-1 text-sm text-[#718078]">
              {error}
            </p>

            <button
              type="button"
              onClick={loadRisk}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#496c5c]"
            >
              <RefreshCw
                size={14}
              />
              Retry
            </button>
          </div>

        </div>
      </section>
    );
  }


  if (!risk) {
    return null;
  }


  const topFactor =
    risk.factors?.[0];


  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 16,
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
      className="overflow-hidden rounded-[28px] border border-[#dce5da] bg-white shadow-[0_16px_45px_rgba(23,63,53,0.06)]"
    >

      {/* HEADER */}

      <div className="flex flex-col gap-4 border-b border-[#e5ebe2] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9a7c42]">
            Predict · Explain · Act
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#173f35]">
            Risk Intelligence
          </h2>

          <p className="mt-1 text-xs text-[#75827a]">
            Quick operational risk preview
            for the selected project.
          </p>

        </div>


        <button
          type="button"
          onClick={loadRisk}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#dce5da] bg-[#f8faf6] px-3 py-2 text-xs font-semibold text-[#4c6d5e] transition hover:bg-[#eef3eb]"
        >
          <RefreshCw
            size={14}
          />

          Refresh
        </button>

      </div>


      {/* PREVIEW */}

      <div className="grid gap-4 p-6 lg:grid-cols-[0.7fr_1.25fr_0.8fr]">

        {/* SCORE */}

        <article className="rounded-[22px] bg-[#173f35] p-5 text-white">

          <div className="flex items-center gap-2 text-[#d8c58f]">

            <ShieldCheck
              size={15}
            />

            <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
              Current risk
            </span>

          </div>


          <div className="mt-5 flex items-end gap-2">

            <strong className="text-4xl font-semibold tracking-[-0.05em]">
              {risk.risk_score.toFixed(
                1,
              )}
            </strong>

            <span className="mb-1 text-xs text-white/45">
              / 100
            </span>

          </div>


          <span
            className={`mt-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold ${levelStyle(
              risk.risk_level,
            )}`}
          >
            {risk.risk_level} RISK
          </span>

        </article>


        {/* TOP FACTOR */}

        <article className="rounded-[22px] border border-[#e1e8df] bg-[#fafbf8] p-5">

          <div className="flex items-center gap-2 text-[#917844]">

            <BrainCircuit
              size={15}
            />

            <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
              Priority signal
            </span>

          </div>


          <h3 className="mt-4 text-lg font-semibold text-[#173f35]">
            {topFactor?.label ??
              "No major risk driver detected"}
          </h3>


          <p className="mt-2 text-sm leading-6 text-[#718078]">
            {topFactor?.reason ??
              "Current workflow records do not contain a major additional risk signal."}
          </p>

        </article>


        {/* ACTION */}

        <article className="flex flex-col justify-between rounded-[22px] border border-[#dce5da] bg-[#f1f6ef] p-5">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#917844]">
              Decision support
            </p>


            <p className="mt-3 text-sm font-semibold text-[#173f35]">
              {risk.factors.length} risk factors
            </p>

            <p className="mt-1 text-xs text-[#718078]">
              {risk.recommendations.length} recommended interventions
            </p>

          </div>


          <Link
            to={`/intelligence?projectId=${encodeURIComponent(
              projectId,
            )}`}
            className="mt-6 inline-flex items-center justify-between rounded-xl bg-[#173f35] px-4 py-3 text-sm font-semibold !text-white transition hover:bg-[#214f43]"
          >
            Open Delay Intelligence

            <ArrowRight
              size={16}
            />
          </Link>

        </article>

      </div>

    </motion.section>
  );
}