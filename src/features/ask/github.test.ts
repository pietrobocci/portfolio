import { describe, it, expect, beforeEach } from "vitest";
import {
  ALLOWED_REPOS,
  GITHUB_OWNER,
  clearGithubCache,
  githubCommits,
  githubOverview,
} from "./github";

// Offline by design. A test here that reaches api.github.com is a defect:
// it would burn the anonymous quota and fail whenever GitHub is slow.

function jsonFetch(body: unknown, init: ResponseInit = {}) {
  const calls: string[] = [];
  const headers: Array<Record<string, string>> = [];
  const impl = (async (url: string | URL | Request, options?: RequestInit) => {
    calls.push(String(url));
    headers.push((options?.headers ?? {}) as Record<string, string>);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  }) as unknown as typeof fetch;
  return { impl, calls, headers };
}

beforeEach(() => {
  clearGithubCache();
});

describe("the account and the repository list", () => {
  it("takes the account from the site's own profile link", () => {
    expect(GITHUB_OWNER).toBe("pietrobocci");
  });

  it("allows only my own repositories", () => {
    expect(ALLOWED_REPOS).toContain("batch-certify");
    expect(ALLOWED_REPOS).toContain("portfolio");
    // The list is derived, so a new project appears here automatically and
    // nothing else ever does.
    expect(ALLOWED_REPOS.length).toBe(new Set(ALLOWED_REPOS).size);
  });
});

describe("githubOverview", () => {
  const repos = [
    {
      name: "batch-certify",
      description: "A certification dApp",
      language: "Solidity",
      pushed_at: "2026-10-28T09:14:00Z",
      html_url: "https://github.com/pietrobocci/batch-certify",
      fork: false,
      private: false,
    },
    {
      name: "someone-elses-thing",
      description: null,
      language: "Go",
      pushed_at: "2026-01-02T00:00:00Z",
      html_url: "https://github.com/pietrobocci/someone-elses-thing",
      fork: true,
      private: false,
    },
  ];

  it("asks GitHub for my repositories, newest push first", async () => {
    const { impl, calls, headers } = jsonFetch(repos);
    const result = await githubOverview({ fetchImpl: impl });

    expect(calls[0]).toBe(
      "https://api.github.com/users/pietrobocci/repos?per_page=100&sort=pushed"
    );
    // No token configured in a test: no Authorization header may be invented.
    expect(headers[0].Authorization).toBeUndefined();
    expect(result.ok).toBe(true);
  });

  it("drops forks and reports dates to the day", async () => {
    const { impl } = jsonFetch(repos);
    const result = await githubOverview({ fetchImpl: impl });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const listed = result.data.repositories as Array<{
        name: string;
        lastPush: string;
      }>;
      expect(listed).toHaveLength(1);
      expect(listed[0]).toMatchObject({
        name: "batch-certify",
        lastPush: "2026-10-28",
      });
    }
  });

  it("sends a token when one is configured", async () => {
    const { impl, headers } = jsonFetch(repos);
    await githubOverview({ fetchImpl: impl, token: "ghp_test" });
    expect(headers[0].Authorization).toBe("Bearer ghp_test");
  });

  it("serves a second question from the cache instead of GitHub", async () => {
    const { impl, calls } = jsonFetch(repos);
    await githubOverview({ fetchImpl: impl });
    await githubOverview({ fetchImpl: impl });
    expect(calls).toHaveLength(1);
  });

  it("fetches again once the cache entry is stale", async () => {
    const { impl, calls } = jsonFetch(repos);
    let clock = 1_000_000;
    await githubOverview({ fetchImpl: impl, now: () => clock });
    clock += 11 * 60 * 1000;
    await githubOverview({ fetchImpl: impl, now: () => clock });
    expect(calls).toHaveLength(2);
  });
});

describe("githubCommits", () => {
  const commits = [
    {
      commit: {
        message: "Fix the agent's function calling\n\nLong body ignored.",
        author: { date: "2026-11-02T18:40:00Z" },
      },
    },
  ];

  it("refuses a repository that is not mine, without calling GitHub", async () => {
    let called = false;
    const impl = (async () => {
      called = true;
      return new Response("{}");
    }) as unknown as typeof fetch;

    const result = await githubCommits("torvalds/linux", { fetchImpl: impl });

    expect(called).toBe(false);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("invalid_input");
  });

  it("refuses a path traversal attempt for the same reason", async () => {
    const result = await githubCommits("../../users/someone/repos");
    expect(result.ok).toBe(false);
  });

  it("returns the subject line and the day for an allowed repository", async () => {
    const { impl, calls } = jsonFetch(commits);
    const result = await githubCommits("batch-certify", { fetchImpl: impl });

    expect(calls[0]).toBe(
      "https://api.github.com/repos/pietrobocci/batch-certify/commits?per_page=10"
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.commits).toEqual([
        {
          date: "2026-11-02",
          message: "Fix the agent's function calling",
        },
      ]);
    }
  });
});

describe("when GitHub says no", () => {
  it("reads an exhausted anonymous quota out of a 403", async () => {
    const impl = (async () =>
      new Response("rate limited", {
        status: 403,
        headers: { "x-ratelimit-remaining": "0" },
      })) as unknown as typeof fetch;

    const result = await githubOverview({ fetchImpl: impl });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("rate_limit");
      expect(result.error.retryable).toBe(true);
    }
  });

  it("treats a plain 403 as a network problem, not a quota problem", async () => {
    const impl = (async () =>
      new Response("forbidden", { status: 403 })) as unknown as typeof fetch;

    const result = await githubOverview({ fetchImpl: impl });
    if (!result.ok) expect(result.error.type).toBe("network");
  });

  it("turns an unreachable API into an error, not a crash", async () => {
    const impl = (async () => {
      throw new Error("getaddrinfo ENOTFOUND");
    }) as unknown as typeof fetch;

    const result = await githubOverview({ fetchImpl: impl });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("network");
  });

  it("does not cache a failure", async () => {
    let calls = 0;
    const impl = (async () => {
      calls++;
      return new Response("boom", { status: 500 });
    }) as unknown as typeof fetch;

    await githubOverview({ fetchImpl: impl });
    await githubOverview({ fetchImpl: impl });
    expect(calls).toBe(2);
  });
});
