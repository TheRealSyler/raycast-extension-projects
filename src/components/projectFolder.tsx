import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { Folder } from "../hooks/useFolders";
import { useGitInfo } from "../hooks/useGitInfo";
import { FolderCustomization, FolderCustomizations } from "../utils/folderCustomization";
import { getFolderMetadata, toggleStarred } from "../utils/folderMetadata";
import { openInEditor } from "../utils/openInEditor";
import { CustomizeFolderForm } from "./customizeFolderForm";

type ProjectFolderProps = {
  folder: Folder;
  customizations: FolderCustomizations;
  onCustomize: (folderPath: string, customization: FolderCustomization) => Promise<void>;
  onStarToggle?: () => void;
  onOpen?: () => void;
};

export function ProjectFolder({ folder, customizations, onCustomize, onStarToggle, onOpen }: ProjectFolderProps) {
  const { gitInfo, isLoading } = useGitInfo(folder.path);
  const [isStarred, setIsStarred] = useState(false);
  const [lastOpened, setLastOpened] = useState<number | undefined>(undefined);

  const loadMetadata = useCallback(async () => {
    const metadata = await getFolderMetadata(folder.path);
    setIsStarred(metadata.starred ?? false);
    setLastOpened(metadata.lastOpened);
  }, [folder.path]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const handleToggleStar = async () => {
    const newStarredStatus = await toggleStarred(folder.path);
    setIsStarred(newStarredStatus);
    onStarToggle?.();
  };

  const customization = customizations[folder.path];

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
      key={folder.path}
      title={folder.name}
      icon={customization ? { source: customization.icon, tintColor: customization.color } : { source: "" }}
      accessories={accessories}
      actions={
        <ActionPanel>
          <Action
            title="Open in Editor"
            onAction={async () => {
              await openInEditor(folder.path);
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
            target={<CustomizeFolderForm folder={folder} onCustomize={onCustomize} />}
          />
        </ActionPanel>
      }
    />
  );
}
