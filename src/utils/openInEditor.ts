import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import { recordProjectOpened } from "./projectMetadata";
import { convertToWslPath, getDefaultWslDistro, isWslPath } from "./wslUtils";

const execAsync = promisify(exec);

async function getCommand(projectPath: string): Promise<string> {
  const preferences = getPreferenceValues<Preferences>();
  if (isWslPath(projectPath)) {
    const defaultDistro = await getDefaultWslDistro();
    if (!defaultDistro) {
      throw new Error("Could not find default WSL distro");
    }
    return `${preferences.editor} -n --remote=wsl+${defaultDistro} ${convertToWslPath(projectPath)}`;
  }
  return `${preferences.editor} ${projectPath}`;
}

export async function openInEditor(projectPath: string) {
  try {
    const command = await getCommand(projectPath);
    await execAsync(command);

    await recordProjectOpened(projectPath);

    await showToast({
      style: Toast.Style.Success,
      title: "Opening project",
      message: `Opening ${projectPath}`,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to open project";
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: errorMessage,
    });
  }
}
