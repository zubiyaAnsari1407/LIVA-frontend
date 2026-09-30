import type { RiskPrediction } from '../../types/risk'

const rules: Record<string, string> = {
  PENDING_PARCELS: 'Pending parcels ÷ total parcels × 15; maximum 15 points.',
  OWNERSHIP_ISSUES: 'Disputes × 2 + pending ownership reviews × 0.75; maximum 15 points.',
  SURVEY_PENDING: 'Pending surveys ÷ total parcels × 10; maximum 10 points. Without a usable parcel total, each pending survey adds 1 point, capped at 10.',
  LITIGATION: 'Active cases × 2.5 + high-risk cases × 2.5; maximum 20 points.',
  MISSING_DOCUMENTS: 'Missing documents × 1.5; maximum 10 points.',
  COMPENSATION_PENDING: 'Pending compensation records × 0.75; maximum 8 points.',
  PENDING_APPROVALS: 'Pending approvals × 1.5; maximum 10 points.',
  OVERDUE_DURATION: 'Longest overdue duration in days ÷ 6; maximum 10 points.',
  ACTION_PRESSURE: 'Overdue actions + high-priority open actions × 0.5; maximum 7 points.',
  LOW_COMPLETION: '(50 − completion percentage) ÷ 10 when completion is below 50%; maximum 5 points.',
}

export default function RiskCalculation({ current, simulated }: { current: RiskPrediction; simulated: RiskPrediction }) {
  const codes = [...new Set([...current.factors, ...simulated.factors].map((factor) => factor.code))]
  const unchangedFactors = codes.every((code) =>
    (current.factors.find((factor) => factor.code === code)?.impact_score ?? 0)
    === (simulated.factors.find((factor) => factor.code === code)?.impact_score ?? 0))

  return <section className="mt-4 rounded-2xl border border-[#dce5da] bg-[#fafbf8] p-4 text-sm leading-6 text-[#4e6158]">
    <h4 className="font-semibold text-[#173f35]">Why this risk score?</h4>
    <p className="mt-2">Pending work and unresolved problems add risk points. We add these points to get a score out of 100. A lower score means less delay risk.</p>
    <p className="mt-2">Before: <b>{current.risk_score.toFixed(2)}</b>. After your changes: <b>{simulated.risk_score.toFixed(2)}</b> ({simulated.risk_level.toLowerCase()} risk).</p>
    {current.risk_score === simulated.risk_score && <p className="mt-2 font-medium">{unchangedFactors
      ? 'The score stayed the same. The changes did not affect the risk points shown below.'
      : 'Some risk points changed, but the final score stayed the same.'}</p>}
    <div className="mt-3 space-y-3">
      {codes.map((code) => {
        const before = current.factors.find((factor) => factor.code === code)
        const after = simulated.factors.find((factor) => factor.code === code)
        return <article key={code} className="rounded-xl border border-[#e1e8df] bg-white p-3">
          <strong className="text-[#173f35]">{(after ?? before)?.label}: {(before?.impact_score ?? 0).toFixed(2)} → {(after?.impact_score ?? 0).toFixed(2)} points</strong>
          <p>{after?.reason ?? 'After your changes, this issue adds no risk points.'}</p>
          <p>{(after?.impact_score ?? 0) < (before?.impact_score ?? 0)
            ? 'Your changes reduced the risk from this issue.'
            : (after?.impact_score ?? 0) > (before?.impact_score ?? 0)
              ? 'Your changes increased the risk from this issue.'
              : 'Risk from this issue stayed the same.'}</p>
          {rules[code] && <details className="mt-1 text-xs text-[#66776e]"><summary className="cursor-pointer">How are these points counted?</summary><p>{rules[code]}</p>{before && <p>Before: {before.reason}</p>}</details>}
        </article>
      })}
      {!codes.length && <p>No risk points were added from the available project details.</p>}
    </div>
    <p className="mt-2 text-xs">Only available project details are counted. Missing details may hide other risks.</p>
    <details className="mt-2 text-xs"><summary className="cursor-pointer">Score ranges</summary><p>Below 25: Low. 25 to below 50: Medium. 50 to below 75: High. 75 to 100: Critical.</p><p>The total cannot exceed 100. Points are rounded, so displayed totals may differ slightly.</p></details>
  </section>
}
