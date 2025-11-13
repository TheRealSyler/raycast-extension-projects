import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export function isWslPath(projectPath: string): boolean {
  return projectPath.includes("wsl");
}

export async function getDefaultWslDistro(): Promise<string | null> {
  try {
    const { stdout } = await execAsync("wsl --status");

    const match = stdout.replaceAll("\x00", "").match(/Default Distribution:\s*(.+)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  } catch (err) {
    console.error("Failed to get default WSL distro:", err);
    return null;
  }
}

export function convertToWslPath(projectPath: string): string {
  return projectPath.replaceAll("\\", "/").replace(/\/\/wsl\.localhost\/.*?\//, "/");
}
