import RiskCalculation from './RiskCalculation';
import {
  useEffect,
  useState,
} from "react";

import {
  History,
} from "lucide-react";

import {
  getSimulationHistory,
} from "../../services/simulationApi";

import type {
  SimulationHistoryItem,
} from "../../types/simulation";

type Props = {
  projectId: string;

  refreshKey?: number;
};


export default function SimulationHistory({
  projectId,
  refreshKey = 0,
}: Props) {
  const [
    records,
    setRecords,
  ] = useState<
    SimulationHistoryItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);

        const data =
          await getSimulationHistory(
            projectId,
            3,
          );

        if (active) {
          setRecords(data);
        }
      } catch {
        if (active) {
          setRecords([]);
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
  }, [
    projectId,
    refreshKey,
  ]);


  return (
    <section className="rounded-3xl border border-[#d7e2d8] bg-white p-6 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3ed] text-[#173f35]">
          <History size={18} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7a4a]">
            Audit trail
          </p>

          <h3 className="font-semibold text-[#173f35]">
            Simulation history
          </h3>
        </div>

      </div>


      {loading ? (
        <p className="mt-5 text-sm text-[#66776e]">
          Loading history...
        </p>
      ) : records.length === 0 ? (
        <p className="mt-5 text-sm text-[#66776e]">
          No simulations have been
          recorded for this project yet.
        </p>
      ) : (
        <div className="mt-5 space-y-3">

          {records.map(
            (record) => (
              <div
                key={
                  record.simulation_id
                }
                className="rounded-2xl border border-[#e1e8df] bg-[#fbfcf9] p-4"
              >

                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div>
                    <p className="text-sm font-semibold text-[#173f35]">
                      {
                        record
                          .current_risk_score
                      }
                      {" → "}
                      {
                        record
                          .simulated_risk_score
                      }
                    </p>

                    <p className="mt-1 text-xs text-[#66776e]">
                      {
                        record
                          .current_risk_level
                      }
                      {" → "}
                      {
                        record
                          .simulated_risk_level
                      }
                    </p>
                  </div>


                  <span className="rounded-full border border-[#d7e2d8] px-3 py-1 text-[11px] font-semibold text-[#42564d]">
                    {
                      record.direction
                    }
                  </span>

                </div>


                {record
                  .risk_reduction_points >
                  0 && (
                  <p className="mt-3 text-xs font-medium text-[#567f68]">
                    Risk reduced by{" "}
                    {
                      record
                        .risk_reduction_points
                    }{" "}
                    points
                  </p>
                )}


                <p className="mt-3 text-sm leading-6 text-[#4e6158]">
                  {record.direction === 'UNCHANGED'
                    ? `Risk stayed at ${record.simulated_risk_score.toFixed(2)} out of 100.`
                    : `Risk ${record.direction === 'IMPROVED' ? 'fell' : 'rose'} from ${record.current_risk_score.toFixed(2)} to ${record.simulated_risk_score.toFixed(2)} out of 100.`}
                  {' '}Risk level: {record.simulated_risk_level.toLowerCase()}.
                </p>
                <p className="mt-2 text-sm leading-6 text-[#4e6158]">
                  {Object.keys(record.applied_changes).length
                    ? `You changed: ${Object.entries(record.applied_changes).map(([key, value]) => `${key.replaceAll('_', ' ')} to ${value}${key === 'completion_percentage' ? '%' : ''}`).join('; ')}.`
                    : 'No changes were saved in this test.'}
                  {' '}Your actual project stayed unchanged.
                </p>
                {record.current_prediction && record.simulated_prediction ? <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-[#173f35]">Why this score?</summary>
                  <RiskCalculation current={record.current_prediction} simulated={record.simulated_prediction} />
                </details> : <p className="mt-2 text-xs text-[#66776e]">This older test has no saved explanation. Run a new test to see the reasons.</p>}

                <p className="mt-3 text-[11px] text-[#87938d]">
                  {new Date(
                    record.created_at,
                  ).toLocaleString()}
                </p>

              </div>
            ),
          )}

        </div>
      )}

    </section>
  );
}
