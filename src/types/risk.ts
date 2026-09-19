export type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type PredictionSource =
  | "RULE_BASED"
  | "ML"
  | "HYBRID";

export type RiskDirection =
  | "INCREASES_RISK"
  | "REDUCES_RISK";

export type ActionPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type GovernmentReferenceScope =
  | "STATE"
  | "ALL_STATES";


// ============================================================
// Risk Factor
// ============================================================

export interface RiskFactor {
  code: string;
  label: string;

  observed_value:
    | string
    | number
    | boolean
    | null;

  impact_score: number;
  direction: RiskDirection;
  reason: string;
}


// ============================================================
// Recommended Action
// ============================================================

export interface RecommendedAction {
  code: string;
  title: string;
  description: string;
  priority: ActionPriority;
  target_days: number | null;
  related_factor: string | null;
}


// ============================================================
// Government Land Reference
// ============================================================

export interface GovernmentLandReference {
  scope: GovernmentReferenceScope;
  state: string | null;

  record_count: number;

  average_pending_land_pct: number;
  median_pending_land_pct: number;

  high_backlog_projects: number;
  zero_acquisition_projects: number;

  source_files: string[];
  note: string;
}


// ============================================================
// Rule-based Risk Prediction
// ============================================================

export interface RiskPrediction {
  project_id: string;
  project_name: string | null;

  risk_score: number;
  risk_level: RiskLevel;

  prediction_source: PredictionSource;

  confidence: number | null;

  factors: RiskFactor[];

  recommendations:
    RecommendedAction[];

  government_context:
    | GovernmentLandReference
    | null;

  model_version: string;

  generated_at: string;
}


// ============================================================
// Risk Features
// ============================================================

export interface RiskFeatures {
  project_id: string;
  project_name: string | null;

  state: string | null;
  district: string | null;

  total_parcels: number;
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

  open_actions: number;
  overdue_actions: number;

  high_priority_open_actions: number;

  completion_percentage: number;
}


// ============================================================
// Government-trained ML
// ============================================================

export interface GeneralDelayMLInput {
  original_cost_cr: number;

  expenditure_cr: number;

  expenditure_ratio: number;

  physical_progress_pct: number;

  original_completion_year: number;

  sanction_year: number;

  sector: string;

  line_ministry: string;
}


export type MLExplanationDirection =
  | "INCREASES_DELAY_RISK"
  | "REDUCES_DELAY_RISK"
  | "NEUTRAL";


export interface MLExplanationFactor {
  feature: string;

  shap_value: number;

  absolute_impact: number;

  direction:
    MLExplanationDirection;
}


export interface GeneralDelayMLPrediction {
  prediction: number;

  is_delay_predicted: boolean;

  delay_probability: number;

  delay_probability_pct: number;

  model_name: string;

  model_version: string;

  training_rows: number | null;

  source_policy: string | null;

  explanation:
    MLExplanationFactor[];

  important_note: string;
}


export interface MLHealth {
  status: string;

  model_loaded: boolean;

  model_name: string | null;

  training_rows: number | null;

  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
    roc_auc?: number;
  };

  model_scope: string;
}