import { Action, ActionPanel, Color, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import {
  saveProjectCustomization,
  useProjectCustomization,
  type ProjectCustomization,
} from "../hooks/useCustomization";
import type { Project } from "../hooks/useProjects";
import { COMMON_COLORS, COMMON_ICONS } from "../utils/constants";
import { DEFAULT_ICON_VALUE, findDefaultIcon, getCachedDefaultIcon } from "../utils/findDefaultIcon";

interface CustomizeProjectFormProps {
  project: Project;
}

export function CustomizeProjectForm({ project }: CustomizeProjectFormProps) {
  const navigation = useNavigation();
  const [currentCustomization] = useProjectCustomization(project.path);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultIconPath, setDefaultIconPath] = useState<string | null>(null);
  const [_currentColor, setCurrentColor] = useState<string>();

  useEffect(() => {
    (async () => {
      const cachedDefaultIcon = await getCachedDefaultIcon(project.path);
      if (cachedDefaultIcon) {
        setDefaultIconPath(cachedDefaultIcon);
      }
      const defaultIcon = await findDefaultIcon(project.path);
      setDefaultIconPath(defaultIcon);
      setIsLoading(false);
    })();
  }, [project.path]);

  if (isLoading) {
    return <Form isLoading={true} />;
  }

  // Determine current icon: use customization if set, otherwise use default icon value or fallback
  const currentIcon = currentCustomization?.icon || (defaultIconPath ? DEFAULT_ICON_VALUE : Icon.Code);
  const currentColor = _currentColor || currentCustomization?.color || Color.Blue;

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save Customization"
            onSubmit={async (values) => {
              const customization: ProjectCustomization | null =
                values.icon === DEFAULT_ICON_VALUE
                  ? null
                  : {
                      icon: values.icon,
                      color: values.color,
                    };
              await saveProjectCustomization(project.path, customization);
              await showToast({
                style: Toast.Style.Success,
                title: "Customization saved",
                message: `Customization saved for ${project.name}`,
              });
              navigation.pop();
            }}
            icon={Icon.Check}
          />

          {currentCustomization && (currentCustomization.icon || currentCustomization.color) && (
            <Action
              title="Reset to Default"
              onAction={async () => {
                await saveProjectCustomization(project.path, null);
                await showToast({
                  style: Toast.Style.Success,
                  title: "Customization reset",
                  message: `Customization reset for ${project.name}`,
                });
                navigation.pop();
              }}
              icon={Icon.ArrowCounterClockwise}
              style={Action.Style.Destructive}
            />
          )}
        </ActionPanel>
      }
    >
      <Form.Description title="Project" text={project.name} />
      <Form.Description title="Path" text={project.path} />
      <Form.Separator />
      <Form.Dropdown id="icon" title="Icon" defaultValue={currentIcon} info="Choose an icon for this project">
        {defaultIconPath && (
          <Form.Dropdown.Item
            key={DEFAULT_ICON_VALUE}
            value={DEFAULT_ICON_VALUE}
            title="Use Default (Project Icon)"
            icon={{ source: defaultIconPath }}
          />
        )}
        {COMMON_ICONS.map((icon, index) => (
          <Form.Dropdown.Item
            key={index}
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
        info="Choose a color for this project's icon"
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
