import type {
  RiskFeatures,
  RiskPrediction,
} from "./risk";


export type SimulationDirection =
  | "IMPROVED"
  | "UNCHANGED"
  | "WORSENED";


export interface SimulationChangeSet {
  pending_parcels?: number;

  ownership_disputes?: number;

  ownership_pending?: number;

  survey_pending?: number;

  active_litigation_cases?: number;

  high_risk_litigation_cases?: number;

  missing_documents?: number;

  compensation_pending?: number;

  pending_approvals?: number;

  max_overdue_days?: number;

  open_actions?: number;

  overdue_actions?: number;

  high_priority_open_actions?: number;

  completion_percentage?: number;
}


export interface SimulationRequest {
  current_features: RiskFeatures;

  changes: SimulationChangeSet;
}


export interface SimulationResponse {
  project_id: string;

  project_name: string | null;

  current_prediction: RiskPrediction;

  simulated_prediction: RiskPrediction;

  score_change: number;

  risk_reduction_points: number;

  direction: SimulationDirection;

  improved: boolean;

  applied_changes: Record<
    string,
    number
  >;

  summary: string;

  simulation_id: string | null;

  saved: boolean;

  created_at: string;
}


export interface SimulationHistoryItem {
  simulation_id: string;

  project_id: string;

  project_name: string | null;

  current_risk_score: number;

  simulated_risk_score: number;

  current_risk_level: string;

  simulated_risk_level: string;

  score_change: number;

  risk_reduction_points: number;

  direction: SimulationDirection;

  applied_changes: Record<
    string,
    number
  >;

  created_at: string;
}