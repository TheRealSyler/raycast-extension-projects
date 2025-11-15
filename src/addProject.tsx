import { Action, ActionPanel, Form, getPreferenceValues, Icon, popToRoot, showToast, Toast } from "@raycast/api";
import { mkdir } from "fs/promises";
import { join } from "path";
import { useState } from "react";
import simpleGit from "simple-git";
import { openInEditor } from "./utils/openInEditor";
import { isWslPath } from "./utils/wslUtils";

type InitType = "git" | "none";

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const directories = preferences.projectsDirectory
    .split(",")
    .map((dir) => dir.trim())
    .filter((dir) => dir.length > 0);

  const [initType, setInitType] = useState<InitType>("git");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: { directory: string; projectName: string; initType: InitType }) {
    const { directory, projectName, initType } = values;

    if (!projectName || projectName.trim().length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Project name is required",
      });
      return;
    }

    setIsLoading(true);
    const projectPath = join(directory, projectName);

    try {
      await mkdir(projectPath, { recursive: true });

      if (initType === "git") {
        const git = isWslPath(projectPath)
          ? simpleGit({
              baseDir: projectPath,
              binary: ["wsl", "git"],
            })
          : simpleGit(projectPath);

        await git.init();

        await showToast({
          style: Toast.Style.Success,
          title: "Project created",
          message: `Git repository initialized in ${projectName}`,
        });
      } else {
        await showToast({
          style: Toast.Style.Success,
          title: "Project created",
          message: `Folder created: ${projectName}`,
        });
      }

      await openInEditor(projectPath);
      setIsLoading(false);
      popToRoot();
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : "Failed to create project";
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: errorMessage,
      });
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Project" onSubmit={handleSubmit} icon={Icon.Plus} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="projectName"
        title="Project Name"
        placeholder="my-project"
        info="Name of the project directory"
        autoFocus
      />
      <Form.Dropdown id="directory" title="Directory" info="Select the directory where the project will be created">
        {directories.map((dir, index) => (
          <Form.Dropdown.Item key={index} value={dir} title={dir} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown
        id="initType"
        title="Initialization Type"
        value={initType}
        onChange={(value) => setInitType(value as InitType)}
        info="Choose how to initialize the project"
      >
        <Form.Dropdown.Item value="git" title="Git" icon={Icon.Code} />
        <Form.Dropdown.Item value="none" title="Folder Only (No Git)" icon={Icon.Folder} />
      </Form.Dropdown>
    </Form>
  );
}
