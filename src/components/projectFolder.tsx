import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { Folder } from "../hooks/useFolders";
import { useGitInfo } from "../hooks/useGitInfo";
import { FolderCustomization, FolderCustomizations } from "../utils/folderCustomization";
import { openInEditor } from "../utils/openInEditor";
import { CustomizeFolderForm } from "./customizeFolderForm";

type ProjectFolderProps = {
  folder: Folder;
  customizations: FolderCustomizations;
  onCustomize: (folderPath: string, customization: FolderCustomization) => Promise<void>;
};

export function ProjectFolder({ folder, customizations, onCustomize }: ProjectFolderProps) {
  const { gitInfo, isLoading } = useGitInfo(folder.path);

  const customization = customizations[folder.path];
  const iconSource = customization?.icon || Icon.Code;
  const iconColor = customization?.color || Color.Blue;

  return (
    <List.Item
      key={folder.path}
      title={folder.name}
      icon={{ source: iconSource, tintColor: iconColor }}
      accessories={
        gitInfo?.branch
          ? [
              {
                tag: { value: gitInfo.branch },
              },
            ]
          : [
              {
                text: isLoading ? "Loading..." : undefined,
              },
            ]
      }
      actions={
        <ActionPanel>
          <Action title="Open in Editor" onAction={() => openInEditor(folder.path)} />
          <Action.Push
            title="Customize Folder"
            icon={Icon.Brush}
            target={<CustomizeFolderForm folder={folder} onCustomize={onCustomize} />}
          />
        </ActionPanel>
      }
    />
  );
}
