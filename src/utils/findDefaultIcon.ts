import { LocalStorage } from "@raycast/api";
import { access, readFile } from "fs/promises";
import { join } from "path";
import { getStorageKey } from "./constants";

const FILE_ENDINGS = [".svg", ".png"];

const directoryPaths = ["assets", "public", "src/assets"];

function createVariations(iconPath: string): string[] {
  const paths = [];
  for (const directoryPath of directoryPaths) {
    paths.push(...FILE_ENDINGS.map((ending) => `${directoryPath}/${iconPath}${ending}`));
  }
  return paths;
}

const COMMON_ICON_PATHS = [
  ...createVariations("icon"),
  ...createVariations("favicon"),
  ...createVariations("logo"),
  ...createVariations("app-icon"),
  ...createVariations("appIcon"),
];

export const DEFAULT_ICON_VALUE = "__default__";

async function getCachedIconForProject(projectPath: string): Promise<string | null | undefined> {
  try {
    const cacheJson = await LocalStorage.getItem(getStorageKey("project-icon", projectPath));
    if (cacheJson && typeof cacheJson === "string") {
      const cached = JSON.parse(cacheJson) as string | null;
      return cached;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

async function setCachedIconForProject(projectPath: string, iconPath: string | null): Promise<void> {
  try {
    await LocalStorage.setItem(getStorageKey("project-icon", projectPath), JSON.stringify(iconPath));
  } catch (err) {
    console.error(`Failed to cache icon for ${projectPath}:`, err);
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
