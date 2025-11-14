import { LocalStorage } from "@raycast/api";
import { access, readFile } from "fs/promises";
import { globby } from "globby";
import { join } from "path";
import { getStorageKey } from "./constants";

export const DEFAULT_ICON_VALUE = "__default__";
const FILE_NAMES = ["icon", "logo", "favicon"];
const EXTENSIONS = ["svg", "png", "ico", "gif"];

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

    const patterns = FILE_NAMES.flatMap((fileName) => EXTENSIONS.map((extension) => `**/${fileName}.${extension}`));

    const files = await globby(patterns, {
      cwd: projectPath,
      onlyFiles: true,
      caseSensitiveMatch: false,
      absolute: true,
      gitignore: true,
    });

    const iconPath = getIconFromResults(files);

    if (iconPath) {
      await setCachedIconForProject(projectPath, iconPath);
      return iconPath;
    }

    await setCachedIconForProject(projectPath, null);
    return null;
  } catch (error) {
    console.error(`Failed to search for icon in ${projectPath}:`, error);
    await setCachedIconForProject(projectPath, null);
    return null;
  }
}

function getIconFromResults(results: string[]): string | null {
  const sortedFiles = results.sort((a, b) => {
    const aDepth = a.split(/[/\\]/).length;
    const bDepth = b.split(/[/\\]/).length;
    if (aDepth !== bDepth) {
      return aDepth - bDepth;
    }
    const aExt = a.split(".").pop()?.toLowerCase() || "";
    const bExt = b.split(".").pop()?.toLowerCase() || "";
    const aExtIndex = EXTENSIONS.indexOf(aExt);
    const bExtIndex = EXTENSIONS.indexOf(bExt);
    if (aExtIndex !== bExtIndex) {
      const aPriority = aExtIndex === -1 ? EXTENSIONS.length : aExtIndex;
      const bPriority = bExtIndex === -1 ? EXTENSIONS.length : bExtIndex;
      return aPriority - bPriority;
    }
    return a.localeCompare(b);
  });
  return sortedFiles[0] || null;
}
