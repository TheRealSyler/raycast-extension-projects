import { Icon, List } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { ProjectFolder } from "../components/projectFolder";
import { useFolders } from "../hooks/useFolders";
import {
  FolderCustomization,
  FolderCustomizations,
  getFolderCustomizations,
  saveFolderCustomization,
} from "../utils/folderCustomization";

export default function Command() {
  const { folders, isLoading, error, refresh } = useFolders();
  const [customizations, setCustomizations] = useState<FolderCustomizations>({});

  useEffect(() => {
    (async () => {
      const customizationsData = await getFolderCustomizations();
      setCustomizations(customizationsData);
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
        folders.map((folder) => (
          <ProjectFolder
            key={folder.path}
            folder={folder}
            customizations={customizations}
            onCustomize={handleCustomize}
            onStarToggle={refresh}
            onOpen={refresh}
          />
        ))
      )}
    </List>
  );
}
