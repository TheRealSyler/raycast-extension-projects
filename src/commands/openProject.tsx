import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { CustomizeFolderForm } from "../components/customizeFolderForm";
import {
  FolderCustomization,
  FolderCustomizations,
  getFolderCustomizations,
  saveFolderCustomization,
} from "../utils/folderCustomization";
import { Folder, loadFolders } from "../utils/loadFolders";
import { openInEditor } from "../utils/openInEditor";

export default function Command() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customizations, setCustomizations] = useState<FolderCustomizations>({});

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const customizationsData = await getFolderCustomizations();
      setCustomizations(customizationsData);
      const { error, folders } = await loadFolders();
      if (error) {
        setError(error);
      } else {
        setFolders(folders);
      }
      setIsLoading(false);
    })();
  }, []);

  const handleCustomize = useCallback(async (folderPath: string, customization: FolderCustomization) => {
    await saveFolderCustomization(folderPath, customization);
    setCustomizations(await getFolderCustomizations());
  }, []);

  if (error) {
    return (
      <List>
        <List.EmptyView icon={Icon.ExclamationMark} title="Error loading folders" description={error} />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search projects...">
      {folders.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Folder}
          title="No folders found"
          description={`No folders found in the specified directories`}
        />
      ) : (
        folders.map((folder) => {
          const customization = customizations[folder.path];
          const iconSource = customization?.icon || Icon.Code;
          const iconColor = customization?.color || Color.Blue;

          return (
            <List.Item
              key={folder.path}
              title={folder.name}
              icon={{ source: iconSource, tintColor: iconColor }}
              actions={
                <ActionPanel>
                  <Action title="Open in Editor" onAction={() => openInEditor(folder.path)} />
                  <Action.Push
                    title="Customize Folder"
                    icon={Icon.Brush}
                    target={<CustomizeFolderForm folder={folder} onCustomize={handleCustomize} />}
                  />
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}
