import { getPreferenceValues, LocalStorage } from "@raycast/api";
import { readdir } from "fs/promises";
import { join } from "path";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { PROJECTS_CACHE_KEY } from "../utils/constants";
import { getProjectMetadataMap } from "../utils/projectMetadata";

const projectSchema = z.object({
  name: z.string(),
  path: z.string(),
});

const projectsSchema = z.array(projectSchema);

export type Project = z.infer<typeof projectSchema>;

export function useProjects(): { projects: Project[]; isLoading: boolean; error: string | null; refresh: () => void } {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);

  const refresh = useCallback(() => {
    setInternalRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);

      const cachedProjects = await getCachedProjects();
      if (cancelled) return;
      if (cachedProjects) {
        const projectPaths = cachedProjects.map((p) => p.path);
        const metadataMap = await getProjectMetadataMap(projectPaths);
        const sortedProjects = [...cachedProjects];
        sortProjectsByMetadata(sortedProjects, metadataMap);
        setProjects(sortedProjects);
        setIsLoading(false);
      }

      try {
        const preferences = getPreferenceValues<Preferences>();
        const directories = preferences.projectsDirectory
          .split(",")
          .map((dir) => dir.trim())
          .filter((dir) => dir.length > 0);

        const projectList: Project[] = [];

        for (const directory of directories) {
          if (cancelled) return;
          try {
            const entries = await readdir(directory, { withFileTypes: true });

            for (const entry of entries) {
              if (entry.isDirectory()) {
                const projectPath = join(directory, entry.name);
                projectList.push({
                  name: entry.name,
                  path: projectPath,
                });
              }
            }
          } catch (dirErr) {
            console.error(`Failed to read directory ${directory}:`, dirErr);
          }
        }

        if (cancelled) return;

        const projectPaths = projectList.map((p) => p.path);
        const metadataMap = await getProjectMetadataMap(projectPaths);

        sortProjectsByMetadata(projectList, metadataMap);

        setProjects(projectList);
        setIsLoading(false);
        await setCachedProjects(projectList);
      } catch (err) {
        if (cancelled) return;
        const errorMessage = err instanceof Error ? err.message : "Failed to load projects";
        console.error("Failed to load projects:", err);
        setError(errorMessage);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [internalRefreshTrigger]);

  return { projects, isLoading, error, refresh };
}

async function getCachedProjects(): Promise<Project[] | null> {
  try {
    const cacheJson = await LocalStorage.getItem(PROJECTS_CACHE_KEY);
    if (cacheJson && typeof cacheJson === "string") {
      const parsed = JSON.parse(cacheJson);
      return projectsSchema.parse(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

async function setCachedProjects(projects: Project[]): Promise<void> {
  try {
    await LocalStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error("Failed to cache projects:", err);
  }
}

function sortProjectsByMetadata(
  projectList: Project[],
  metadataMap: Record<string, { starred?: boolean; lastOpened?: number }>,
): void {
  projectList.sort((a, b) => {
    const metadataA = metadataMap[a.path] || { starred: false };
    const metadataB = metadataMap[b.path] || { starred: false };

    const starredA = metadataA.starred ?? false;
    const starredB = metadataB.starred ?? false;

    // If one is starred and the other isn't, starred comes first
    if (starredA && !starredB) return -1;
    if (!starredA && starredB) return 1;

    // Both are starred or both are not starred - sort by lastOpened
    const lastOpenedA = metadataA.lastOpened ?? 0;
    const lastOpenedB = metadataB.lastOpened ?? 0;

    // Most recent first (descending order)
    if (lastOpenedB !== lastOpenedA) {
      return lastOpenedB - lastOpenedA;
    }

    return a.name.localeCompare(b.name);
  });
}
