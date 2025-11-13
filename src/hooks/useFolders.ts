import { LocalStorage, getPreferenceValues } from "@raycast/api";
import { readdir } from "fs/promises";
import { join } from "path";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { FOLDERS_CACHE_KEY } from "../utils/constants";
import { getFolderMetadataMap } from "../utils/folderMetadata";

const folderSchema = z.object({
  name: z.string(),
  path: z.string(),
});

const foldersSchema = z.array(folderSchema);

export type Folder = z.infer<typeof folderSchema>;

export function useFolders(): { folders: Folder[]; isLoading: boolean; error: string | null; refresh: () => void } {
  const [folders, setFolders] = useState<Folder[]>([]);
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

      const cachedFolders = await getCachedFolders();
      if (cancelled) return;
      if (cachedFolders) {
        const metadataMap = await getFolderMetadataMap();
        const sortedFolders = [...cachedFolders];
        sortFoldersByMetadata(sortedFolders, metadataMap);
        setFolders(sortedFolders);
        setIsLoading(false);
      }

      try {
        const preferences = getPreferenceValues<Preferences>();
        const directories = preferences.projectsDirectory
          .split(",")
          .map((dir) => dir.trim())
          .filter((dir) => dir.length > 0);

        const folderList: Folder[] = [];

        for (const directory of directories) {
          if (cancelled) return;
          try {
            const entries = await readdir(directory, { withFileTypes: true });

            for (const entry of entries) {
              if (entry.isDirectory()) {
                const folderPath = join(directory, entry.name);
                folderList.push({
                  name: entry.name,
                  path: folderPath,
                });
              }
            }
          } catch (dirErr) {
            console.error(`Failed to read directory ${directory}:`, dirErr);
          }
        }

        if (cancelled) return;

        const metadataMap = await getFolderMetadataMap();

        sortFoldersByMetadata(folderList, metadataMap);

        setFolders(folderList);
        setIsLoading(false);
        await setCachedFolders(folderList);
      } catch (err) {
        if (cancelled) return;
        const errorMessage = err instanceof Error ? err.message : "Failed to load folders";
        console.error("Failed to load folders:", err);
        setError(errorMessage);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [internalRefreshTrigger]);

  return { folders, isLoading, error, refresh };
}

async function getCachedFolders(): Promise<Folder[] | null> {
  try {
    const cacheJson = await LocalStorage.getItem(FOLDERS_CACHE_KEY);
    if (cacheJson && typeof cacheJson === "string") {
      const parsed = JSON.parse(cacheJson);
      return foldersSchema.parse(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

async function setCachedFolders(folders: Folder[]): Promise<void> {
  try {
    await LocalStorage.setItem(FOLDERS_CACHE_KEY, JSON.stringify(folders));
  } catch (err) {
    console.error("Failed to cache folders:", err);
  }
}

function sortFoldersByMetadata(
  folderList: Folder[],
  metadataMap: Record<string, { starred?: boolean; lastOpened?: number }>,
): void {
  folderList.sort((a, b) => {
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
