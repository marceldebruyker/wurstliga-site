export const DATA_BASE = import.meta.env.PUBLIC_DATA_BASE_URL || "https://marceldebruyker.github.io/wurstliga-data/season-2025-26";

export async function fetchStandings() {
  const r = await fetch(`${DATA_BASE}/../standings.json`, { cache: "no-store" });
  return r.json();
}

export async function fetchSpieltag(n: number) {
  const pad = String(n).padStart(2, "0");
  const r = await fetch(`${DATA_BASE}/spieltage/${pad}.json`, { cache: "no-store" });
  return r.json();
}

export async function fetchMetadata() {
  const r = await fetch(`${DATA_BASE}/metadata.json`, { cache: "no-store" });
  return r.json();
}