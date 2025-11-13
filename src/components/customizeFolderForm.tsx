import { Action, ActionPanel, Color, Form, Icon, popToRoot, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { Folder } from "../hooks/useFolders";
import { COMMON_COLORS, COMMON_ICONS } from "../utils/constants";
import { FolderCustomization, getFolderCustomization } from "../utils/folderCustomization";

interface CustomizeFolderFormProps {
  folder: Folder;
  onCustomize: (folderPath: string, customization: FolderCustomization) => Promise<void>;
}

export function CustomizeFolderForm({ folder, onCustomize }: CustomizeFolderFormProps) {
  const [currentCustomization, setCurrentCustomization] = useState<FolderCustomization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_currentColor, setCurrentColor] = useState<string>();

  useEffect(() => {
    (async () => {
      const customization = await getFolderCustomization(folder.path);
      setCurrentCustomization(customization || {});
      setIsLoading(false);
    })();
  }, [folder.path]);

  if (isLoading) {
    return <Form isLoading={true} />;
  }

  const currentIcon = currentCustomization?.icon || Icon.Code;
  const currentColor = _currentColor || currentCustomization?.color || Color.Blue;

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save Customization"
            onSubmit={async (values) => {
              const customization: FolderCustomization = {
                icon: values.icon || undefined,
                color: values.color || undefined,
              };
              await onCustomize(folder.path, customization);
              await showToast({
                style: Toast.Style.Success,
                title: "Customization saved",
                message: `Customization saved for ${folder.name}`,
              });
              popToRoot();
            }}
            icon={Icon.Check}
          />

          {currentCustomization && (currentCustomization.icon || currentCustomization.color) && (
            <Action
              title="Reset to Default"
              onAction={async () => {
                await onCustomize(folder.path, {});
                await showToast({
                  style: Toast.Style.Success,
                  title: "Customization reset",
                  message: `Customization reset for ${folder.name}`,
                });
                popToRoot();
              }}
              icon={Icon.ArrowCounterClockwise}
              style={Action.Style.Destructive}
            />
          )}
        </ActionPanel>
      }
    >
      <Form.Description title="Folder" text={folder.name} />
      <Form.Description title="Path" text={folder.path} />
      <Form.Separator />
      <Form.Dropdown id="icon" title="Icon" defaultValue={currentIcon} info="Choose an icon for this folder">
        {COMMON_ICONS.map((icon) => (
          <Form.Dropdown.Item
            key={icon.value}
            value={icon.value}
            title={icon.title}
            icon={{ source: icon.value, tintColor: currentColor }}
          />
        ))}
      </Form.Dropdown>
      <Form.Dropdown
        id="color"
        title="Color"
        onChange={(value) => setCurrentColor(value)}
        defaultValue={currentColor}
        info="Choose a color for this folder's icon"
      >
        {COMMON_COLORS.map((color) => (
          <Form.Dropdown.Item
            key={color.value}
            value={color.value}
            title={color.title}
            icon={{ source: Icon.Circle, tintColor: color.value }}
          />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
