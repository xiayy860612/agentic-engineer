
export type Instrument = {
  id: number;
  name: string;
};

export type FetchInstrumentsError = {
  kind: "unauthorized" | "upstream" | "network";
  message: string;
};

export type FetchInstrumentsResult =
  | { ok: true; data: Instrument[] }
  | { ok: false; error: FetchInstrumentsError };

let inflightListRequest: Promise<FetchInstrumentsResult> | null = null;

async function fetchInstrumentsOnce(
  accessToken: string,
): Promise<FetchInstrumentsResult> {
  const url = "/api/biz/v1/instruments";

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    const hint =
      process.env.NODE_ENV === "development"
        ? " Check that biz-service is running on http://127.0.0.1:8001."
        : "";
    return {
      ok: false,
      error: {
        kind: "network",
        message: `Could not reach the instruments API.${hint}`,
      },
    };
  }

  if (response.status === 401) {
    return {
      ok: false,
      error: {
        kind: "unauthorized",
        message: "Session expired or invalid. Please sign in again.",
      },
    };
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) {
        message = body.detail;
      }
    } catch {
      // ignore non-JSON error bodies
    }
    return {
      ok: false,
      error: {
        kind: response.status === 502 ? "upstream" : "network",
        message,
      },
    };
  }

  const data = (await response.json()) as Instrument[];
  return { ok: true, data };
}

export async function fetchInstruments(
  accessToken: string,
): Promise<FetchInstrumentsResult> {
  if (inflightListRequest) {
    return inflightListRequest;
  }

  inflightListRequest = fetchInstrumentsOnce(accessToken).finally(() => {
    inflightListRequest = null;
  });
  return inflightListRequest;
}
