import { Color, Icon } from "@raycast/api";

export const STORAGE_KEY = "folder-customizations";

export const COMMON_ICONS = Object.entries(Icon).map(([key, value]) => ({ title: key, value }));
export const COMMON_COLORS: { title: string; value: string }[] = Object.entries(Color).map(([key, value]) => ({
  title: key,
  value: value as string,
}));
