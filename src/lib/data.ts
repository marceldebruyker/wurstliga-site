export const DATA_BASE = import.meta.env.PUBLIC_DATA_BASE_URL || "https://marceldebruyker.github.io/wurstliga-data/season-2025-26";

export async function fetchStandings() {
  const url = `https://marceldebruyker.github.io/wurstliga-data/season-2025-26/standings.json?t=${Date.now()}`;
  const r = await fetch(url, { cache: "no-store" });
  return r.json();
}

export async function fetchSpieltag(n: number) {
  const pad = String(n).padStart(2, "0");
  const url = `${DATA_BASE}/spieltage/${pad}.json?t=${Date.now()}`;
  const r = await fetch(url, { cache: "no-store" });
  return r.json();
}

export async function fetchMetadata() {
  const url = `${DATA_BASE}/metadata.json?t=${Date.now()}`;
  const r = await fetch(url, { cache: "no-store" });
  return r.json();
}