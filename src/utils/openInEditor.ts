import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

function isWslPath(folderPath: string): boolean {
  return folderPath.includes("wsl");
}

async function getDefaultWslDistro(): Promise<string | null> {
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

async function getCommand(folderPath: string): Promise<string> {
  const preferences = getPreferenceValues<Preferences>();
  if (isWslPath(folderPath)) {
    console.log(preferences);
    const defaultDistro = await getDefaultWslDistro();
    if (!defaultDistro) {
      throw new Error("Could not find default WSL distro");
    }
    return `${preferences.editor} -n --remote=wsl+${defaultDistro} ${folderPath
      .replaceAll("\\", "/")
      .replace(/\/\/wsl\.localhost\/.*?\//, "/")}`;
  }
  return `${preferences.editor} ${folderPath}`;
}

export async function openInEditor(folderPath: string) {
  try {
    const command = await getCommand(folderPath);
    await execAsync(command);
    await showToast({
      style: Toast.Style.Success,
      title: "Opening project",
      message: `Opening ${folderPath}`,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to open folder";
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: errorMessage,
    });
  }
}

