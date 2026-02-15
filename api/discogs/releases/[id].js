import {
  fetchDiscogsJson,
  getSingleQueryValue,
  sendError,
  sendJson,
  sendMethodNotAllowed,
  toPositiveInteger,
} from "../../_lib/discogs.js";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendMethodNotAllowed(res, ["GET"]);
    return;
  }

  try {
    const releaseId = toPositiveInteger(getSingleQueryValue(req.query.id), 0, 1, Number.MAX_SAFE_INTEGER);

    if (!releaseId) {
      sendJson(res, 400, { error: "Invalid release id." });
      return;
    }

    const payload = await fetchDiscogsJson(`/releases/${releaseId}`, new URLSearchParams());
    sendJson(res, 200, payload);
  } catch (error) {
    sendError(res, error);
  }
}
