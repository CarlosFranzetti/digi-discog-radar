import {
  fetchDiscogsJson,
  getSingleQueryValue,
  readAllowedString,
  sendError,
  sendJson,
  sendMethodNotAllowed,
  toPositiveInteger,
} from "../_lib/discogs.js";

const ALLOWED_TYPES = ["release", "master", "artist", "label"];
const ALLOWED_SORT = ["year", "title", "artist"];
const ALLOWED_SORT_ORDER = ["asc", "desc"];

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendMethodNotAllowed(res, ["GET"]);
    return;
  }

  try {
    const params = new URLSearchParams();

    const q = getSingleQueryValue(req.query.q);
    const year = getSingleQueryValue(req.query.year);
    const genre = getSingleQueryValue(req.query.genre);
    const style = getSingleQueryValue(req.query.style);
    const label = getSingleQueryValue(req.query.label);
    const artist = getSingleQueryValue(req.query.artist);
    const format = getSingleQueryValue(req.query.format);
    const country = getSingleQueryValue(req.query.country);

    if (typeof q === "string" && q.trim()) params.set("q", q.trim());
    if (typeof year === "string" && year.trim()) params.set("year", year.trim());
    if (typeof genre === "string" && genre.trim()) params.set("genre", genre.trim());
    if (typeof style === "string" && style.trim()) params.set("style", style.trim());
    if (typeof label === "string" && label.trim()) params.set("label", label.trim());
    if (typeof artist === "string" && artist.trim()) params.set("artist", artist.trim());
    if (typeof format === "string" && format.trim()) params.set("format", format.trim());
    if (typeof country === "string" && country.trim()) params.set("country", country.trim());

    const type = readAllowedString(req.query.type, ALLOWED_TYPES);
    if (type) params.set("type", type);

    const sort = readAllowedString(req.query.sort, ALLOWED_SORT);
    if (sort) params.set("sort", sort);

    const sortOrder = readAllowedString(req.query.sort_order, ALLOWED_SORT_ORDER);
    if (sortOrder) params.set("sort_order", sortOrder);

    const page = toPositiveInteger(getSingleQueryValue(req.query.page), 1, 1, 9999);
    const perPage = toPositiveInteger(getSingleQueryValue(req.query.per_page), 25, 1, 200);
    params.set("page", String(page));
    params.set("per_page", String(perPage));

    const payload = await fetchDiscogsJson("/database/search", params);
    sendJson(res, 200, payload);
  } catch (error) {
    sendError(res, error);
  }
}
