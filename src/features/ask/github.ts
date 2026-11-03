// Reading my public GitHub activity, for the agent's fourth tool.
//
// Same scope principle as the chain tools: the account is a constant derived
// from the site's own content, never a parameter. The one argument the model
// does control — which repository — is a closed list built from the projects
// the site already publishes, so "show me the commits in <someone else's
// repo>" is not a request this code can carry out.
//
// Unauthenticated GitHub allows 60 requests an hour per IP, shared by every
// visitor hitting the same server instance. Two things keep that workable:
// a short-lived cache, so a burst of questions costs one request, and an
// honest rate-limit error when it runs out anyway. A GITHUB_TOKEN raises the
// ceiling to 5000/hour if it is ever needed; the code works without one.

import { projects } from "@/content/projects";
import { siteContent } from "@/content/site";
import { ok, err, type Result } from "./result";

export type GithubDeps = {
  /** Injected in tests. Nothing here ever touches the network in a test. */
  fetchImpl?: typeof fetch;
  now?: () => number;
  /** Optional; only raises the rate limit. */
  token?: string;
};

/** The account, taken from the site's own profile link. */
export const GITHUB_OWNER = lastPathSegment(siteContent.github);

/**
 * Repositories the model may ask about: the published projects, plus this
 * site. Anything else is refused before a request is made.
 */
export const ALLOWED_REPOS: readonly string[] = [
  ...new Set([
    ...projects.map((project) => lastPathSegment(project.repo)),
    "portfolio",
  ]),
];

const API = "https://api.github.com";
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_COMMITS = 10;

/** Per-instance, like the rate limiter: a cost saver, not a guarantee. */
const cache = new Map<string, { at: number; value: unknown }>();

/** Every public repository, most recently pushed first. */
export async function githubOverview(
  deps: GithubDeps = {}
): Promise<Result<Record<string, unknown>>> {
  const result = await getJson<GithubRepo[]>(
    `/users/${GITHUB_OWNER}/repos?per_page=100&sort=pushed`,
    deps
  );
  if (!result.ok) return err(result.error);

  const repositories = result.data
    .filter((repo) => !repo.fork && !repo.private)
    .map((repo) => ({
      name: repo.name,
      description: repo.description ?? null,
      language: repo.language ?? null,
      lastPush: dayOf(repo.pushed_at),
      url: repo.html_url,
    }));

  return ok({
    account: `github.com/${GITHUB_OWNER}`,
    publicRepositories: repositories.length,
    repositories,
    note: `Ask for recent commits in one of: ${ALLOWED_REPOS.join(", ")}.`,
  });
}

/** Recent commits in one allowed repository. */
export async function githubCommits(
  repo: string,
  deps: GithubDeps = {}
): Promise<Result<Record<string, unknown>>> {
  const name = repo.trim();

  // Checked against the list rather than sanitised: a name that is not mine
  // has no safe interpretation, so there is nothing to clean up.
  if (!ALLOWED_REPOS.includes(name)) {
    return err({
      type: "invalid_input",
      message: `"${name}" is not one of my repositories. Available: ${ALLOWED_REPOS.join(
        ", "
      )}.`,
      retryable: false,
    });
  }

  const result = await getJson<GithubCommit[]>(
    `/repos/${GITHUB_OWNER}/${name}/commits?per_page=${MAX_COMMITS}`,
    deps
  );
  if (!result.ok) return err(result.error);

  return ok({
    repository: `${GITHUB_OWNER}/${name}`,
    url: `https://github.com/${GITHUB_OWNER}/${name}`,
    commits: result.data.map((commit) => ({
      date: dayOf(commit.commit?.author?.date),
      // First line only: the body is for whoever reads the repository.
      message: firstLine(commit.commit?.message ?? ""),
    })),
  });
}

type GithubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  pushed_at: string;
  html_url: string;
  fork: boolean;
  private: boolean;
};

type GithubCommit = {
  commit?: { message?: string; author?: { date?: string } };
};

async function getJson<T>(path: string, deps: GithubDeps): Promise<Result<T>> {
  const now = deps.now ?? Date.now;
  const cached = cache.get(path);
  if (cached && now() - cached.at < CACHE_TTL_MS) {
    return ok(cached.value as T);
  }

  const token = deps.token ?? process.env.GITHUB_TOKEN;
  const doFetch = deps.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await doFetch(`${API}${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (e) {
    return err({
      type: "network",
      message: e instanceof Error ? e.message : "could not reach GitHub",
      retryable: true,
    });
  }

  if (!response.ok) {
    // GitHub answers 403 for an exhausted anonymous quota, not only 429.
    const exhausted =
      response.status === 429 ||
      (response.status === 403 &&
        response.headers.get("x-ratelimit-remaining") === "0");
    if (exhausted) {
      return err({
        type: "rate_limit",
        message: "GitHub's rate limit for this server is used up for now.",
        retryable: true,
      });
    }
    return err({
      type: "network",
      message: `GitHub answered ${response.status}`,
      retryable: response.status >= 500,
    });
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    return err({
      type: "bad_response",
      message: "GitHub returned something that is not JSON",
      retryable: true,
    });
  }

  cache.set(path, { at: now(), value: parsed });
  return ok(parsed as T);
}

/** Dates are reported to the day: the hour is noise in an answer. */
function dayOf(iso: string | undefined): string | null {
  return iso ? iso.slice(0, 10) : null;
}

function firstLine(text: string): string {
  return text.split("\n", 1)[0].trim();
}

function lastPathSegment(url: string): string {
  return url.replace(/\/+$/, "").split("/").pop() ?? "";
}

/** Test seam: the cache is module state, so a test has to be able to clear it. */
export function clearGithubCache(): void {
  cache.clear();
}
