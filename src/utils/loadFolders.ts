import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import { readdir } from "fs/promises";
import { join } from "path";

export type Folder = {
  name: string;
  path: string;
};

export async function loadFolders(): Promise<{ error: string | null; folders: Folder[] }> {
  try {
    const preferences = getPreferenceValues<Preferences>();
    const directories = preferences.projectsDirectory
      .split(",")
      .map((dir) => dir.trim())
      .filter((dir) => dir.length > 0);

    const folderList: Folder[] = [];

    for (const directory of directories) {
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

    folderList.sort((a, b) => a.name.localeCompare(b.name));

    return { error: null, folders: folderList };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load folders";
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: errorMessage,
    });
    return { error: errorMessage, folders: [] };
  }
}

