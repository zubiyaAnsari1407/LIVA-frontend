import { useState } from "react";
import { motion } from "motion/react";
import {
  Eye,
  History,
  Orbit,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../../auth/AuthContext";
import SimulationHistory from "./SimulationHistory";
import WhatIfSimulator from "./WhatIfSimulator";

type Props = {
  projectId: string;
};

export default function DigitalTwinPanel({
  projectId,
}: Props) {
  const { can } = useAuth();
  const canRunSimulation = can("simulation.run");

  const [refreshKey, setRefreshKey] =
    useState(0);

  function refreshHistory() {
    setRefreshKey(
      (current) => current + 1,
    );
  }

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
      }}
      className="space-y-5"
    >
      <div className="relative overflow-hidden rounded-[30px] bg-[#173f35] px-6 py-7 text-white shadow-[0_18px_55px_rgba(23,63,53,0.18)] md:px-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-6 -top-10 h-48 w-48 rounded-full border border-[#d1c194]/20" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
              <Orbit size={22} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d1c194]">
                LIVA Digital Twin
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Intervention Simulation Workspace
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                Create a temporary copy of the
                selected project's operational
                state and test interventions
                without modifying real workflow
                records.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 text-xs text-white/75">
              <ShieldCheck
                size={14}
                className="text-[#d1c194]"
              />
              Real project unchanged
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 text-xs text-white/75">
              <History
                size={14}
                className="text-[#d1c194]"
              />
              Auditable scenarios
            </div>
          </div>
        </div>
      </div>

      {canRunSimulation ? (
        <WhatIfSimulator
          projectId={projectId}
          onSimulationSaved={
            refreshHistory
          }
        />
      ) : (
        <div className="rounded-[26px] border border-[#dce5da] bg-white px-6 py-5 shadow-[0_12px_35px_rgba(23,63,53,0.05)]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf3eb] text-[#52705f]">
              <Eye size={18} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#947b49]">
                Read-only simulation access
              </p>

              <h3 className="mt-1 text-base font-semibold text-[#173f35]">
                Scenario creation is disabled for this role.
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#748179]">
                You can review saved simulation history and results,
                but running or saving a new what-if scenario is available
                only to administrators, judges and project officers.
              </p>
            </div>
          </div>
        </div>
      )}

      <SimulationHistory
        projectId={projectId}
        refreshKey={refreshKey}
      />
    </motion.section>
  );
}
