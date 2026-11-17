import "server-only";
import { promises as fs } from "fs";
import path from "path";

/**
 * Remembers which ready-made reviews were posted (copied) and when, so the same
 * review is not handed out again within NO_REPEAT_DAYS — across ALL patients.
 *
 * Storage:
 * - Upstash Redis (recommended, required on Vercel): set UPSTASH_REDIS_REST_URL and
 *   UPSTASH_REDIS_REST_TOKEN (Vercel's Upstash integration sets KV_REST_API_URL /
 *   KV_REST_API_TOKEN, which also work).
 * - Otherwise a JSON file in .data/ (works for `npm run dev` or a normal always-on
 *   server). On Vercel without Redis it falls back to memory, which resets often.
 */

export const NO_REPEAT_DAYS = Number(process.env.NO_REPEAT_DAYS) || 30;
const WINDOW_MS = NO_REPEAT_DAYS * 24 * 60 * 60 * 1000;

/** id -> time it was last posted (ms) */
export type UsedMap = Map<string, number>;

export interface UsedStore {
  getUsed(group: string): Promise<UsedMap>;
  markUsed(group: string, id: string): Promise<void>;
}

// ---------- Upstash Redis (REST) ----------

class RedisStore implements UsedStore {
  constructor(
    private url: string,
    private token: string,
  ) {}

  private key(group: string) {
    return `reviews:used:${group}`;
  }

  private async pipeline(commands: (string | number)[][]) {
    const res = await fetch(`${this.url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands.map((c) => c.map(String))),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Redis error ${res.status}`);
    return (await res.json()) as { result?: unknown; error?: string }[];
  }

  async getUsed(group: string): Promise<UsedMap> {
    const key = this.key(group);
    const cutoff = Date.now() - WINDOW_MS;
    const [, range] = await this.pipeline([
      ["ZREMRANGEBYSCORE", key, "-inf", cutoff],
      ["ZRANGE", key, 0, -1, "WITHSCORES"],
    ]);
    const flat = Array.isArray(range?.result) ? (range.result as string[]) : [];
    const used: UsedMap = new Map();
    for (let i = 0; i + 1 < flat.length; i += 2) used.set(flat[i], Number(flat[i + 1]));
    return used;
  }

  async markUsed(group: string, id: string) {
    const key = this.key(group);
    await this.pipeline([
      ["ZADD", key, Date.now(), id],
      ["EXPIRE", key, Math.ceil(WINDOW_MS / 1000) + 86400],
    ]);
  }
}

// ---------- File / memory fallback ----------

class LocalStore implements UsedStore {
  private data: Record<string, Record<string, number>> | null = null;
  private file = path.join(process.cwd(), ".data", "used-reviews.json");
  private canWrite = !process.env.VERCEL;
  private queue: Promise<void> = Promise.resolve();

  private async load() {
    if (this.data) return this.data;
    this.data = {};
    if (this.canWrite) {
      try {
        this.data = JSON.parse(await fs.readFile(this.file, "utf8"));
      } catch {
        // first run, or unreadable file: start empty
      }
    }
    return this.data!;
  }

  private prune(group: Record<string, number>) {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [id, t] of Object.entries(group)) if (t < cutoff) delete group[id];
  }

  async getUsed(group: string): Promise<UsedMap> {
    const data = await this.load();
    const g = data[group] ?? {};
    this.prune(g);
    return new Map(Object.entries(g));
  }

  async markUsed(group: string, id: string) {
    const data = await this.load();
    const g = (data[group] ??= {});
    this.prune(g);
    g[id] = Date.now();
    if (!this.canWrite) return;
    // Serialise writes so concurrent requests don't corrupt the file.
    this.queue = this.queue.then(async () => {
      try {
        await fs.mkdir(path.dirname(this.file), { recursive: true });
        await fs.writeFile(this.file, JSON.stringify(data));
      } catch (err) {
        this.canWrite = false;
        console.warn("[used-store] can't write .data/used-reviews.json, using memory only:", (err as Error).message);
      }
    });
    await this.queue;
  }
}

let store: UsedStore | null = null;

export function getUsedStore(): UsedStore {
  if (store) return store;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    store = new RedisStore(url, token);
  } else {
    if (process.env.VERCEL) {
      console.warn(
        "[used-store] No Upstash Redis configured — the 30-day no-repeat list is kept in memory and will reset. Add UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.",
      );
    }
    store = new LocalStore();
  }
  return store;
}
