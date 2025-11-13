import { LocalStorage } from "@raycast/api";
import { z } from "zod";
import { FOLDER_METADATA_KEY } from "./constants";

const folderMetadataSchema = z.object({
  starred: z.boolean().optional().default(false),
  lastOpened: z.number().optional(),
});

const folderMetadataMapSchema = z.record(z.string(), folderMetadataSchema);

export type FolderMetadata = z.infer<typeof folderMetadataSchema>;
export type FolderMetadataMap = z.infer<typeof folderMetadataMapSchema>;

export async function getFolderMetadataMap(): Promise<FolderMetadataMap> {
  try {
    const metadataJson = await LocalStorage.getItem(FOLDER_METADATA_KEY);
    if (metadataJson && typeof metadataJson === "string") {
      const parsed = JSON.parse(metadataJson);
      return folderMetadataMapSchema.parse(parsed);
    }
    return {};
  } catch {
    return {};
  }
}

export async function getFolderMetadata(folderPath: string): Promise<FolderMetadata> {
  const metadataMap = await getFolderMetadataMap();
  return metadataMap[folderPath] || { starred: false };
}

export async function updateFolderMetadata(folderPath: string, updates: Partial<FolderMetadata>): Promise<void> {
  const metadataMap = await getFolderMetadataMap();
  const currentMetadata = metadataMap[folderPath] || { starred: false };
  metadataMap[folderPath] = {
    ...currentMetadata,
    ...updates,
  };
  await LocalStorage.setItem(FOLDER_METADATA_KEY, JSON.stringify(metadataMap));
}

export async function toggleStarred(folderPath: string): Promise<boolean> {
  const metadata = await getFolderMetadata(folderPath);
  const newStarredStatus = !metadata.starred;
  await updateFolderMetadata(folderPath, { starred: newStarredStatus });
  return newStarredStatus;
}

export async function recordFolderOpened(folderPath: string): Promise<void> {
  await updateFolderMetadata(folderPath, { lastOpened: Date.now() });
}
