import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { useGitInfo } from "../hooks/useGitInfo";
import { useIcon } from "../hooks/useIcon";
import type { Project } from "../hooks/useProjects";
import { openInEditor } from "../utils/openInEditor";
import type { ProjectCustomization } from "../utils/projectCustomization";
import { getProjectMetadata, toggleStarred } from "../utils/projectMetadata";
import { CustomizeProjectForm } from "./customizeProjectForm";

type ProjectProps = {
  project: Project;
  onCustomize: (projectPath: string, customization: Partial<ProjectCustomization> | null) => Promise<void>;
  onStarToggle?: () => void;
  onOpen?: () => void;
};

export function Project({ project, onCustomize, onStarToggle, onOpen }: ProjectProps) {
  const { gitInfo, isLoading } = useGitInfo(project.path);
  const iconResult = useIcon(project.path);
  const [isStarred, setIsStarred] = useState(false);
  const [lastOpened, setLastOpened] = useState<number | undefined>(undefined);

  const loadMetadata = useCallback(async () => {
    const metadata = await getProjectMetadata(project.path);
    setIsStarred(metadata.starred ?? false);
    setLastOpened(metadata.lastOpened);
  }, [project.path]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const handleToggleStar = async () => {
    const newStarredStatus = await toggleStarred(project.path);
    setIsStarred(newStarredStatus);
    onStarToggle?.();
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
              onOpen?.();
            }}
          />
          <Action
            title={isStarred ? "Unstar Project" : "Star Project"}
            icon={isStarred ? Icon.StarDisabled : Icon.Star}
            shortcut={{ modifiers: ["cmd"], key: "s" }}
            onAction={handleToggleStar}
          />
          <Action.Push
            title="Customize Project"
            icon={Icon.Brush}
            target={<CustomizeProjectForm project={project} onCustomize={onCustomize} />}
          />
        </ActionPanel>
      }
    />
  );
}
