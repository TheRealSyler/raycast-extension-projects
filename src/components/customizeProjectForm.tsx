import { Action, ActionPanel, Color, Form, Icon, popToRoot, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { Project } from "../hooks/useProjects";
import { COMMON_COLORS, COMMON_ICONS } from "../utils/constants";
import { getProjectCustomization, ProjectCustomization } from "../utils/projectCustomization";

interface CustomizeProjectFormProps {
  project: Project;
  onCustomize: (projectPath: string, customization: Partial<ProjectCustomization>) => Promise<void>;
}

export function CustomizeProjectForm({ project, onCustomize }: CustomizeProjectFormProps) {
  const [currentCustomization, setCurrentCustomization] = useState<ProjectCustomization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_currentColor, setCurrentColor] = useState<string>();

  useEffect(() => {
    (async () => {
      const customization = await getProjectCustomization(project.path);
      setCurrentCustomization(customization || null);
      setIsLoading(false);
    })();
  }, [project.path]);

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
              const customization: ProjectCustomization = {
                icon: values.icon || undefined,
                color: values.color || undefined,
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
