import { LocalStorage } from "@raycast/api";
import { z } from "zod";
import { getStorageKey } from "./constants";

const projectMetadataSchema = z.object({
  starred: z.boolean().optional().default(false),
  lastOpened: z.number().optional(),
});

export type ProjectMetadata = z.infer<typeof projectMetadataSchema>;

export async function getProjectMetadata(projectPath: string): Promise<ProjectMetadata> {
  try {
    const metadataJson = await LocalStorage.getItem(getStorageKey("project-metadata", projectPath));
    if (metadataJson && typeof metadataJson === "string") {
      const parsed = JSON.parse(metadataJson);
      return projectMetadataSchema.parse(parsed);
    }
    return { starred: false };
  } catch {
    return { starred: false };
  }
}

export async function updateProjectMetadata(projectPath: string, updates: Partial<ProjectMetadata>): Promise<void> {
  const currentMetadata = await getProjectMetadata(projectPath);
  const updatedMetadata: ProjectMetadata = {
    ...currentMetadata,
    ...updates,
  };
  await LocalStorage.setItem(getStorageKey("project-metadata", projectPath), JSON.stringify(updatedMetadata));
}

export async function getProjectMetadataMap(projectPaths: string[]): Promise<Record<string, ProjectMetadata>> {
  const metadataMap: Record<string, ProjectMetadata> = {};
  await Promise.all(
    projectPaths.map(async (projectPath) => {
      metadataMap[projectPath] = await getProjectMetadata(projectPath);
    }),
  );
  return metadataMap;
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
