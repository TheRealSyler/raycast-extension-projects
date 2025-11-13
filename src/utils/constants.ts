import { Color, Icon } from "@raycast/api";

export const CUSTOMIZATIONS_KEY = "project-customizations";
export const GIT_INFO_CACHE_KEY = "git-info-cache";
export const PROJECTS_CACHE_KEY = "projects-cache";
export const PROJECT_METADATA_KEY = "project-metadata";

export const COMMON_ICONS = Object.entries(Icon).map(([key, value]) => ({ title: key, value }));
export const COMMON_COLORS: { title: string; value: string }[] = Object.entries(Color).map(([key, value]) => ({
  title: key,
  value: value as string,
}));
