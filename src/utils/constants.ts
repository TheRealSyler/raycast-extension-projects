import { Color, Icon } from "@raycast/api";

export const PROJECTS_CACHE_KEY = "projects-cache";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const STORAGE_KEYS = ["customizations", "git-info", "project-metadata", "project-icon"] as const;

type StorageKey = (typeof STORAGE_KEYS)[number];

export function getStorageKey(storage: StorageKey, projectPath: string): string {
  return `${storage}:${projectPath}`;
}

export const COMMON_ICONS = Object.entries(Icon).map(([key, value]) => ({ title: key, value }));
export const COMMON_COLORS: { title: string; value: string }[] = Object.entries(Color).map(([key, value]) => ({
  title: key,
  value: value as string,
}));
