import type {
  GeneralDelayMLInput,
  GeneralDelayMLPrediction,
  MLHealth,
  RiskFeatures,
  RiskPrediction,
} from "../types/risk";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";


async function apiRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    url,
    options,
  );

  if (!response.ok) {
    let message =
      "Risk Intelligence request failed.";

    try {
      const body =
        await response.json();

      if (body?.detail) {
        message =
          typeof body.detail ===
          "string"
            ? body.detail
            : JSON.stringify(
                body.detail,
              );
      }
    } catch {
      // Ignore invalid JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}


// ============================================================
// Rule-based project risk
// ============================================================

export async function getProjectRisk(
  projectId: string,
): Promise<RiskPrediction> {
  return apiRequest<RiskPrediction>(
    `${API_BASE_URL}/api/risk/project/${encodeURIComponent(
      projectId,
    )}`,
  );
}


export async function getProjectRiskFeatures(
  projectId: string,
): Promise<RiskFeatures> {
  return apiRequest<RiskFeatures>(
    `${API_BASE_URL}/api/risk/project/${encodeURIComponent(
      projectId,
    )}/features`,
  );
}


// ============================================================
// Government-trained ML
// ============================================================

export async function getMLHealth(): Promise<MLHealth> {
  return apiRequest<MLHealth>(
    `${API_BASE_URL}/api/risk/ml/health`,
  );
}


export async function predictGeneralDelay(
  payload: GeneralDelayMLInput,
): Promise<GeneralDelayMLPrediction> {
  return apiRequest<GeneralDelayMLPrediction>(
    `${API_BASE_URL}/api/risk/ml/predict`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(
        payload,
      ),
    },
  );
}