import { LocalStorage } from "@raycast/api";
import { z } from "zod";
import { PROJECT_METADATA_KEY } from "./constants";

const projectMetadataSchema = z.object({
  starred: z.boolean().optional().default(false),
  lastOpened: z.number().optional(),
});

const projectMetadataMapSchema = z.record(z.string(), projectMetadataSchema);

export type ProjectMetadata = z.infer<typeof projectMetadataSchema>;
export type ProjectMetadataMap = z.infer<typeof projectMetadataMapSchema>;

export async function getProjectMetadataMap(): Promise<ProjectMetadataMap> {
  try {
    const metadataJson = await LocalStorage.getItem(PROJECT_METADATA_KEY);
    if (metadataJson && typeof metadataJson === "string") {
      const parsed = JSON.parse(metadataJson);
      return projectMetadataMapSchema.parse(parsed);
    }
    return {};
  } catch {
    return {};
  }
}

export async function getProjectMetadata(projectPath: string): Promise<ProjectMetadata> {
  const metadataMap = await getProjectMetadataMap();
  return metadataMap[projectPath] || { starred: false };
}

export async function updateProjectMetadata(projectPath: string, updates: Partial<ProjectMetadata>): Promise<void> {
  const metadataMap = await getProjectMetadataMap();
  const currentMetadata = metadataMap[projectPath] || { starred: false };
  metadataMap[projectPath] = {
    ...currentMetadata,
    ...updates,
  };
  await LocalStorage.setItem(PROJECT_METADATA_KEY, JSON.stringify(metadataMap));
}

export async function toggleStarred(projectPath: string): Promise<boolean> {
  const metadata = await getProjectMetadata(projectPath);
  const newStarredStatus = !metadata.starred;
  await updateProjectMetadata(projectPath, { starred: newStarredStatus });
  return newStarredStatus;
}

export async function recordProjectOpened(projectPath: string): Promise<void> {
  await updateProjectMetadata(projectPath, { lastOpened: Date.now() });
}
