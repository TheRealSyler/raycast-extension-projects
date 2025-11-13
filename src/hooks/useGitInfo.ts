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

export function useGitInfo(folderPath: string): { gitInfo: GitInfo | null; isLoading: boolean } {
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      const cachedInfo = await getCachedGitInfo(folderPath);

      if (cancelled) return;
      if (cachedInfo) {
        setGitInfo(cachedInfo);
        setIsLoading(false);
      }

      const gitDir = join(folderPath, ".git");
      try {
        await access(gitDir);
      } catch {
        if (cancelled) return;
        const noRepoInfo: GitInfo = { branch: null };
        setGitInfo(noRepoInfo);
        setIsLoading(false);
        await setCachedGitInfo(folderPath, noRepoInfo);

        return;
      }

      try {
        const git = await getGitInstance(folderPath);

        const branchResult = await fetchBranch(git);

        if (cancelled) return;

        const finalInfo: GitInfo = {
          branch: branchResult,
        };

        setGitInfo(finalInfo);
        setIsLoading(false);
        await setCachedGitInfo(folderPath, finalInfo);
      } catch (err) {
        console.error(`Failed to get git info for ${folderPath}:`, err);
        if (cancelled) return;
        const errorInfo: GitInfo = { branch: null };
        setGitInfo(errorInfo);
        setIsLoading(false);
        await setCachedGitInfo(folderPath, errorInfo);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [folderPath]);

  return { gitInfo, isLoading };
}

async function getGitInstance(folderPath: string): Promise<SimpleGit> {
  if (isWslPath(folderPath)) {
    return simpleGit({
      baseDir: folderPath,
      binary: ["wsl", "git"],
    });
  }
  return simpleGit(folderPath);
}

async function getCachedGitInfo(folderPath: string): Promise<GitInfo | null> {
  try {
    const cacheJson = await LocalStorage.getItem(`${GIT_INFO_CACHE_KEY}:${folderPath}`);
    if (cacheJson && typeof cacheJson === "string") {
      const parsed = JSON.parse(cacheJson);
      return gitInfoSchema.parse(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

async function setCachedGitInfo(folderPath: string, info: GitInfo): Promise<void> {
  try {
    await LocalStorage.setItem(`${GIT_INFO_CACHE_KEY}:${folderPath}`, JSON.stringify(info));
  } catch (err) {
    console.error(`Failed to cache git info for ${folderPath}:`, err);
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
