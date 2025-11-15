import { LocalStorage } from "@raycast/api";
import { rm } from "fs/promises";
import { getStorageKey, STORAGE_KEYS } from "./constants";

export async function deleteProject(projectPath: string): Promise<void> {
  try {
    await rm(projectPath, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to delete project folder ${projectPath}:`, error);
    throw new Error(`Failed to delete project folder: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  await Promise.all(
    STORAGE_KEYS.map(async (storageKey) => {
      try {
        await LocalStorage.removeItem(getStorageKey(storageKey, projectPath));
      } catch (error) {
        console.error(`Failed to remove ${storageKey} for ${projectPath}:`, error);
      }
    }),
  );
}
