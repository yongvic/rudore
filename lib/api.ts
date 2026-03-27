import { headers } from "next/headers";

export async function apiGet<T>(path: string, init?: RequestInit) {
  const headersList = await headers();
  const host = headersList.get("host");
  if (!host) {
    throw new Error("Host header is missing.");
  }
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}${path}`;
  const res = await fetch(url, { ...init, cache: "no-store" });

  if (!res.ok) {
    throw new Error(`API ${path} failed with status ${res.status}.`);
  }

  return (await res.json()) as T;
}
