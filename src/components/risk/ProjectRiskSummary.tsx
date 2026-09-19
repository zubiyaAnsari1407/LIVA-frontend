import {
  ArrowRight,
  LoaderCircle,
  ShieldAlert,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router";

import {
  getProjectRisk,
} from "../../services/riskApi";

import type {
  RiskPrediction,
} from "../../types/risk";


export default function ProjectRiskSummary({
  projectId,
}: {
  projectId: string;
}) {
  const [risk, setRisk] =
    useState<RiskPrediction | null>(null);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);

        const result =
          await getProjectRisk(projectId);

        if (active) {
          setRisk(result);
        }
      } catch {
        if (active) {
          setRisk(null);
        }
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


  if (loading) {
    return (
      <article className="pl-card pl-risk-card">
        <LoaderCircle className="animate-spin" />
        <p>Loading risk intelligence...</p>
      </article>
    );
  }


  if (!risk) {
    return null;
  }


  const topFactor =
    risk.factors?.[0];


  return (
    <article className="pl-card pl-risk-card">

      <div className="pl-card-heading">
        <div>
          <p className="pl-eyebrow">
            DELAY INTELLIGENCE
          </p>

          <h2>
            Risk & pending stages
          </h2>
        </div>

        <ShieldAlert
          size={24}
          aria-hidden="true"
        />
      </div>


      <div className="pl-risk-summary">

        <span className="pl-risk-symbol">
          <ShieldAlert
            size={30}
            strokeWidth={1.4}
          />
        </span>

        <div>
          <strong>
            {risk.risk_score.toFixed(1)} / 100
          </strong>

          <p>
            {risk.risk_level} risk
          </p>
        </div>

      </div>


      <p className="pl-description">
        {topFactor?.reason ??
          "No major additional risk driver is currently detected."}
      </p>


      <Link
        to={`/intelligence?projectId=${encodeURIComponent(
          projectId,
        )}`}
        className="pl-primary"
      >
        Open Intelligence
        <ArrowRight size={16} />
      </Link>

    </article>
  );
}