import { Action, ActionPanel, Color, Form, Icon, popToRoot, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import type { Project } from "../hooks/useProjects";
import { COMMON_COLORS, COMMON_ICONS } from "../utils/constants";
import { DEFAULT_ICON_VALUE, findDefaultIcon, getCachedDefaultIcon } from "../utils/findDefaultIcon";
import { getProjectCustomization, type ProjectCustomization } from "../utils/projectCustomization";

interface CustomizeProjectFormProps {
  project: Project;
  onCustomize: (projectPath: string, customization: Partial<ProjectCustomization> | null) => Promise<void>;
}

export function CustomizeProjectForm({ project, onCustomize }: CustomizeProjectFormProps) {
  const [currentCustomization, setCurrentCustomization] = useState<ProjectCustomization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultIconPath, setDefaultIconPath] = useState<string | null>(null);
  const [_currentColor, setCurrentColor] = useState<string>();

  useEffect(() => {
    (async () => {
      const customization = await getProjectCustomization(project.path);
      setCurrentCustomization(customization || null);
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

              await onCustomize(project.path, customization);
              await showToast({
                style: Toast.Style.Success,
                title: "Customization saved",
                message: `Customization saved for ${project.name}`,
              });
              popToRoot();
            }}
            icon={Icon.Check}
          />

          {currentCustomization && (currentCustomization.icon || currentCustomization.color) && (
            <Action
              title="Reset to Default"
              onAction={async () => {
                await onCustomize(project.path, { icon: undefined, color: undefined });
                await showToast({
                  style: Toast.Style.Success,
                  title: "Customization reset",
                  message: `Customization reset for ${project.name}`,
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
