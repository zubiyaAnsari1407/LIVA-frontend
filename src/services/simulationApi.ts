import type {
  RiskFeatures,
} from "../types/risk";

import type {
  SimulationChangeSet,
  SimulationHistoryItem,
  SimulationResponse,
} from "../types/simulation";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";


async function parseResponse<T>(
  response: Response,
): Promise<T> {
  if (!response.ok) {
    let message =
      `Request failed with status ${response.status}`;

    try {
      const data = await response.json();

      if (data?.detail) {
        message =
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(
                data.detail,
              );
      }
    } catch {
      // Ignore JSON parsing errors.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function getSimulationFeatures(
  projectId: string,
): Promise<RiskFeatures> {
  const response = await fetch(
    `${API_BASE_URL}/api/risk/project/${encodeURIComponent(
      projectId,
    )}/features`,
  );

  return parseResponse<RiskFeatures>(
    response,
  );
}


export async function runSimulation(
  projectId: string,
  changes: SimulationChangeSet,
): Promise<SimulationResponse> {
  const currentFeatures =
    await getSimulationFeatures(
      projectId,
    );

  const response = await fetch(
    `${API_BASE_URL}/api/simulation/run`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        current_features:
          currentFeatures,

        changes,
      }),
    },
  );

  return parseResponse<SimulationResponse>(
    response,
  );
}


export async function getSimulationHistory(
  projectId: string,
  limit = 10,
): Promise<SimulationHistoryItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/simulation/history/${encodeURIComponent(
      projectId,
    )}?limit=${limit}`,
  );

  return parseResponse<
    SimulationHistoryItem[]
  >(response);
}