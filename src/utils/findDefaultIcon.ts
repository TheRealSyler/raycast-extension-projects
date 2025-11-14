import { LocalStorage } from "@raycast/api";
import { access, readFile } from "fs/promises";
import { join } from "path";
import { DEFAULT_ICON_CACHE_KEY } from "./constants";

const COMMON_ICON_PATHS = [
  "favicon.svg",
  "favicon.ico",
  "favicon.png",
  "icon.png",
  "icon.svg",
  "icon.jpg",
  "icon.jpeg",
  "logo.png",
  "logo.svg",
  "logo.jpg",
  "logo.jpeg",
  "app-icon.png",
  "appIcon.png",
  "assets/icon.png",
  "assets/logo.png",
  "public/icon.png",
  "public/logo.png",
  "public/favicon.svg",
  "public/favicon.png",
  "public/favicon.ico",
  "src/assets/icon.png",
  "src/assets/logo.png",
];

export const DEFAULT_ICON_VALUE = "__default__";

async function getCachedIconForProject(projectPath: string): Promise<string | null | undefined> {
  try {
    const cacheJson = await LocalStorage.getItem(DEFAULT_ICON_CACHE_KEY);
    if (cacheJson && typeof cacheJson === "string") {
      const cache = JSON.parse(cacheJson) as Record<string, string | null>;
      return cache[projectPath];
    }
    return undefined;
  } catch {
    return undefined;
  }
}

async function setCachedIconForProject(projectPath: string, iconPath: string | null): Promise<void> {
  try {
    const cacheJson = await LocalStorage.getItem(DEFAULT_ICON_CACHE_KEY);
    const cache: Record<string, string | null> =
      cacheJson && typeof cacheJson === "string" ? JSON.parse(cacheJson) : {};
    cache[projectPath] = iconPath;
    await LocalStorage.setItem(DEFAULT_ICON_CACHE_KEY, JSON.stringify(cache));
  } catch {
    const cache: Record<string, string | null> = { [projectPath]: iconPath };
    await LocalStorage.setItem(DEFAULT_ICON_CACHE_KEY, JSON.stringify(cache));
  }
}

export async function getCachedDefaultIcon(projectPath: string): Promise<string | null | undefined> {
  return getCachedIconForProject(projectPath);
}

export async function findDefaultIcon(projectPath: string): Promise<string | null> {
  try {
    const packageJsonPath = join(projectPath, "package.json");
    try {
      const packageJsonContent = await readFile(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(packageJsonContent);
      if (packageJson.icon) {
        const iconPath = join(projectPath, packageJson.icon);
        try {
          await access(iconPath);
          await setCachedIconForProject(projectPath, iconPath);
          return iconPath;
        } catch {
          /* empty */
        }
        const iconPath2 = join(projectPath, `assets/${packageJson.icon}`);
        try {
          await access(iconPath2);
          await setCachedIconForProject(projectPath, iconPath2);
          return iconPath2;
        } catch {
          /* empty */
        }
      }
    } catch {
      /* empty */
    }

    for (const iconPath of COMMON_ICON_PATHS) {
      const fullPath = join(projectPath, iconPath);
      try {
        await access(fullPath);
        await setCachedIconForProject(projectPath, fullPath);
        return fullPath;
      } catch {
        /* empty */
      }
    }

    await setCachedIconForProject(projectPath, null);
    return null;
  } catch (error) {
    console.error(`Failed to search for icon in ${projectPath}:`, error);
    await setCachedIconForProject(projectPath, null);
    return null;
  }
}
