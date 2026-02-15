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
    const query = getSingleQueryValue(req.query.q);
    if (typeof query !== "string" || !query.trim()) {
      sendJson(res, 400, { error: "Artist query is required." });
      return;
    }

    const perPage = toPositiveInteger(getSingleQueryValue(req.query.per_page), 5, 1, 25);
    const params = new URLSearchParams({
      q: query.trim(),
      type: "artist",
      per_page: String(perPage),
    });

    const payload = await fetchDiscogsJson("/database/search", params);
    sendJson(res, 200, payload);
  } catch (error) {
    sendError(res, error);
  }
}
