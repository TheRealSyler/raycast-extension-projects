import { Action, ActionPanel, Form, getPreferenceValues, Icon, popToRoot, showToast, Toast } from "@raycast/api";
import { mkdir } from "fs/promises";
import { join } from "path";
import { useState } from "react";
import simpleGit from "simple-git";
import { openInEditor } from "./utils/openInEditor";
import { convertToWslPath, isWslPath } from "./utils/wslUtils";

type InitType = "clone" | "git" | "none";

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const directories = preferences.projectsDirectory
    .split(",")
    .map((dir) => dir.trim())
    .filter((dir) => dir.length > 0);

  const [initType, setInitType] = useState<InitType>("clone");
  const [isLoading, setIsLoading] = useState(false);
  const [repositoryUrl, setRepositoryUrl] = useState("");

  async function handleSubmit(values: {
    directory: string;
    projectName: string;
    repositoryUrl?: string;
    initType: InitType;
  }) {
    const { directory, projectName, repositoryUrl = "", initType } = values;

    setIsLoading(true);

    try {
      if (initType === "clone") {
        if (!repositoryUrl || repositoryUrl.trim().length === 0) {
          await showToast({
            style: Toast.Style.Failure,
            title: "Error",
            message: "Repository URL is required",
          });
          setIsLoading(false);
          return;
        }

        let finalProjectName = projectName.trim();
        if (!finalProjectName || finalProjectName.length === 0) {
          finalProjectName = extractRepoNameFromUrl(repositoryUrl.trim());
        }

        const projectPath = join(directory, finalProjectName);

        await mkdir(projectPath, { recursive: true });

        const git = isWslPath(projectPath)
          ? simpleGit({
              binary: ["wsl", "git"],
            })
          : simpleGit();

        await git.clone(repositoryUrl.trim(), isWslPath(projectPath) ? convertToWslPath(projectPath) : projectPath);

        await showToast({
          style: Toast.Style.Success,
          title: "Project cloned",
          message: `Repository cloned to ${finalProjectName}`,
        });

        await openInEditor(projectPath);
      } else {
        if (!projectName || projectName.length === 0) {
          await showToast({
            style: Toast.Style.Failure,
            title: "Error",
            message: "Project name is required",
          });
          setIsLoading(false);
          return;
        }

        const projectPath = join(directory, projectName.trim());
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

          await openInEditor(projectPath);
        } else {
          await showToast({
            style: Toast.Style.Success,
            title: "Project created",
            message: `Folder created: ${projectName}`,
          });
        }
      }

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
          <Action.SubmitForm
            title={initType === "clone" ? "Clone Project" : "Create Project"}
            onSubmit={handleSubmit}
            icon={initType === "clone" ? Icon.Code : Icon.Plus}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="initType"
        title="Initialization Type"
        value={initType}
        onChange={(value) => setInitType(value as InitType)}
        info="Choose how to initialize the project"
      >
        <Form.Dropdown.Item value="clone" title="Git Clone" icon={Icon.Code} />
        <Form.Dropdown.Item value="git" title="Init Empty Git" icon={Icon.Code} />
        <Form.Dropdown.Item value="none" title="Folder Only (No Git)" icon={Icon.Folder} />
      </Form.Dropdown>
      {initType === "clone" && (
        <Form.TextField
          id="repositoryUrl"
          title="Repository URL"
          value={repositoryUrl}
          onChange={setRepositoryUrl}
          placeholder="https://github.com/user/repo.git"
          info="Git repository URL to clone"
          autoFocus
        />
      )}
      <Form.TextField
        id="projectName"
        title="Project Name"
        placeholder={
          initType === "clone"
            ? extractRepoNameFromUrl(repositoryUrl) || "Optional (defaults to repository name)"
            : "my-project"
        }
        info={
          initType === "clone"
            ? "Optional: Name of the project directory (defaults to repository name)"
            : "Name of the project directory"
        }
        autoFocus={initType !== "clone"}
      />
      <Form.Dropdown id="directory" title="Directory" info="Select the directory where the project will be created">
        {directories.map((dir, index) => (
          <Form.Dropdown.Item key={index} value={dir} title={dir} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}

function extractRepoNameFromUrl(url: string): string {
  const withoutEnd = url.replace(/\.git$|#.*$|\?.*$/, "");
  const parts = withoutEnd.split("/");
  return parts[parts.length - 1] || "";
}
