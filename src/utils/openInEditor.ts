import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import { recordFolderOpened } from "./folderMetadata";
import { convertToWslPath, getDefaultWslDistro, isWslPath } from "./wslUtils";

const execAsync = promisify(exec);

async function getCommand(folderPath: string): Promise<string> {
  const preferences = getPreferenceValues<Preferences>();
  if (isWslPath(folderPath)) {
    console.log(preferences);
    const defaultDistro = await getDefaultWslDistro();
    if (!defaultDistro) {
      throw new Error("Could not find default WSL distro");
    }
    return `${preferences.editor} -n --remote=wsl+${defaultDistro} ${convertToWslPath(folderPath)}`;
  }
  return `${preferences.editor} ${folderPath}`;
}

export async function openInEditor(folderPath: string) {
  try {
    const command = await getCommand(folderPath);
    await execAsync(command);

    await recordFolderOpened(folderPath);

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
