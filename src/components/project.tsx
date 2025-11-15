import { Action, ActionPanel, Alert, Color, confirmAlert, Icon, List, popToRoot, showToast, Toast } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { useGitInfo } from "../hooks/useGitInfo";
import { useIcon } from "../hooks/useIcon";
import type { Project } from "../hooks/useProjects";
import { deleteProject } from "../utils/deleteProject";
import { openInEditor } from "../utils/openInEditor";
import { getProjectMetadata, toggleStarred } from "../utils/projectMetadata";
import { CustomizeProjectForm } from "./customizeProjectForm";

type ProjectProps = {
  project: Project;
  refresh: () => void;
};

export function Project({ project, refresh }: ProjectProps) {
  const { gitInfo, isLoading } = useGitInfo(project.path);
  const [isDeleting, setIsDeleting] = useState(false);
  const iconResult = useIcon(project.path);
  const [isStarred, setIsStarred] = useState(false);
  const [lastOpened, setLastOpened] = useState<number | undefined>(undefined);

  const loadMetadata = useCallback(async () => {
    const metadata = await getProjectMetadata(project.path);
    setIsStarred(metadata.starred ?? false);
    setLastOpened(metadata.lastOpened);
  }, [project.path]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => void loadMetadata(), [loadMetadata]);

  const handleToggleStar = async () => {
    const newStarredStatus = await toggleStarred(project.path);
    setIsStarred(newStarredStatus);
  };

  const handleDelete = async () => {
    const confirmed = await confirmAlert({
      title: "Delete Project",
      message: `Are you sure you want to delete "${project.name}"? \n\nThis will permanently delete the folder at: ${project.path}`,
      icon: { source: Icon.Trash, tintColor: Color.Red },
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
      dismissAction: {
        title: "Cancel",
      },
    });

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await showToast({
        style: Toast.Style.Animated,
        title: "Deleting project...",
      });

      await deleteProject(project.path);

      await showToast({
        style: Toast.Style.Success,
        title: "Project deleted",
        message: `${project.name} has been deleted`,
      });

      refresh();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to delete project",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
    setIsDeleting(false);
  };

  const accessories: List.Item.Accessory[] = [];
  if (isStarred) {
    accessories.push({
      icon: { source: Icon.Star, tintColor: Color.Yellow },
    });
  }
  if (lastOpened) {
    accessories.push({
      date: new Date(lastOpened),
    });
  }
  if (gitInfo?.branch) {
    accessories.push({
      tag: { value: gitInfo.branch },
    });
  } else if (!isStarred && !lastOpened) {
    accessories.push({
      text: isLoading ? "Loading..." : undefined,
    });
  }

  if (isDeleting) {
    return (
      <List.Item
        key={project.path}
        title={project.name}
        icon={
          iconResult.tintColor
            ? { source: iconResult.source, tintColor: iconResult.tintColor }
            : { source: iconResult.source }
        }
        accessories={[{ text: "Deleting project..." }]}
      />
    );
  }

  return (
    <List.Item
      key={project.path}
      title={project.name}
      icon={
        iconResult.tintColor
          ? { source: iconResult.source, tintColor: iconResult.tintColor }
          : { source: iconResult.source }
      }
      accessories={accessories}
      actions={
        <ActionPanel>
          <Action
            title="Open in Editor"
            onAction={async () => {
              await openInEditor(project.path);
              await loadMetadata();
              popToRoot();
            }}
          />
          <Action
            title={isStarred ? "Unstar Project" : "Star Project"}
            icon={isStarred ? Icon.StarDisabled : Icon.Star}
            onAction={handleToggleStar}
          />
          <Action.Push
            title="Customize Project"
            icon={Icon.Brush}
            target={<CustomizeProjectForm project={project} />}
          />
          <Action title="Delete Project" icon={Icon.Trash} style={Action.Style.Destructive} onAction={handleDelete} />
        </ActionPanel>
      }
    />
  );
}
