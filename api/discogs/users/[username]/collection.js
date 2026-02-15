import {
  fetchDiscogsJson,
  getSingleQueryValue,
  sendError,
  sendJson,
  sendMethodNotAllowed,
  toPositiveInteger,
} from "../../../_lib/discogs.js";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendMethodNotAllowed(res, ["GET"]);
    return;
  }

  try {
    const username = getSingleQueryValue(req.query.username);

    if (typeof username !== "string" || !username.trim()) {
      sendJson(res, 400, { error: "Username is required." });
      return;
    }

    const page = toPositiveInteger(getSingleQueryValue(req.query.page), 1, 1, 9999);
    const perPage = toPositiveInteger(getSingleQueryValue(req.query.per_page), 50, 1, 100);

    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });

    const encodedUsername = encodeURIComponent(username.trim());
    const payload = await fetchDiscogsJson(`/users/${encodedUsername}/collection/folders/0/releases`, params);
    sendJson(res, 200, payload);
  } catch (error) {
    sendError(res, error);
  }
}
