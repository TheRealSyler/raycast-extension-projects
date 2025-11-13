import { LocalStorage, getPreferenceValues } from "@raycast/api";
import { readdir } from "fs/promises";
import { join } from "path";
import { useEffect, useState } from "react";
import { z } from "zod";
import { FOLDERS_CACHE_KEY } from "../utils/constants";

const folderSchema = z.object({
  name: z.string(),
  path: z.string(),
});

const foldersSchema = z.array(folderSchema);

export type Folder = z.infer<typeof folderSchema>;

export function useFolders(): { folders: Folder[]; isLoading: boolean; error: string | null } {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);

      const cachedFolders = await getCachedFolders();
      if (cancelled) return;
      if (cachedFolders) {
        setFolders(cachedFolders);
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

        folderList.sort((a, b) => a.name.localeCompare(b.name));

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
  }, []);

  return { folders, isLoading, error };
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
