import { LocalStorage } from "@raycast/api";
import { access } from "fs/promises";
import { join } from "path";
import { useEffect, useState } from "react";
import simpleGit, { SimpleGit } from "simple-git";
import { z } from "zod";
import { GIT_INFO_CACHE_KEY } from "../utils/constants";
import { isWslPath } from "../utils/wslUtils";

const gitInfoSchema = z.object({
  branch: z.string().nullable(),
});

export type GitInfo = z.infer<typeof gitInfoSchema>;

export function useGitInfo(projectPath: string): { gitInfo: GitInfo | null; isLoading: boolean } {
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      const cachedInfo = await getCachedGitInfo(projectPath);

      if (cancelled) return;
      if (cachedInfo) {
        setGitInfo(cachedInfo);
        setIsLoading(false);
      }

      const gitDir = join(projectPath, ".git");
      try {
        await access(gitDir);
      } catch {
        if (cancelled) return;
        const noRepoInfo: GitInfo = { branch: null };
        setGitInfo(noRepoInfo);
        setIsLoading(false);
        await setCachedGitInfo(projectPath, noRepoInfo);

        return;
      }

      try {
        const git = await getGitInstance(projectPath);

        const branchResult = await fetchBranch(git);

        if (cancelled) return;

        const finalInfo: GitInfo = {
          branch: branchResult,
        };

        setGitInfo(finalInfo);
        setIsLoading(false);
        await setCachedGitInfo(projectPath, finalInfo);
      } catch (err) {
        console.error(`Failed to get git info for ${projectPath}:`, err);
        if (cancelled) return;
        const errorInfo: GitInfo = { branch: null };
        setGitInfo(errorInfo);
        setIsLoading(false);
        await setCachedGitInfo(projectPath, errorInfo);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectPath]);

  return { gitInfo, isLoading };
}

async function getGitInstance(projectPath: string): Promise<SimpleGit> {
  if (isWslPath(projectPath)) {
    return simpleGit({
      baseDir: projectPath,
      binary: ["wsl", "git"],
    });
  }
  return simpleGit(projectPath);
}

async function getCachedGitInfo(projectPath: string): Promise<GitInfo | null> {
  try {
    const cacheJson = await LocalStorage.getItem(`${GIT_INFO_CACHE_KEY}:${projectPath}`);
    if (cacheJson && typeof cacheJson === "string") {
      const parsed = JSON.parse(cacheJson);
      return gitInfoSchema.parse(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

async function setCachedGitInfo(projectPath: string, info: GitInfo): Promise<void> {
  try {
    await LocalStorage.setItem(`${GIT_INFO_CACHE_KEY}:${projectPath}`, JSON.stringify(info));
  } catch (err) {
    console.error(`Failed to cache git info for ${projectPath}:`, err);
  }
}

async function fetchBranch(git: SimpleGit): Promise<string | null> {
  try {
    const branch = (await git.branch()).current;
    return branch.trim() || null;
  } catch {
    return null;
  }
}
