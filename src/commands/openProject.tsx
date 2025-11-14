import { Icon, List } from "@raycast/api";
import { useCallback } from "react";
import { Project } from "../components/project";
import { useProjects } from "../hooks/useProjects";
import { ProjectCustomization, saveProjectCustomization } from "../utils/projectCustomization";

export default function Command() {
  const { projects, isLoading, error, refresh } = useProjects();

  const handleCustomize = useCallback(
    async (projectPath: string, customization: Partial<ProjectCustomization> | null) => {
      await saveProjectCustomization(projectPath, customization);
    },
    [],
  );

  if (error) {
    return (
      <List>
        <List.EmptyView icon={Icon.ExclamationMark} title="Error loading projects" description={error} />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search projects...">
      {projects.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Folder}
          title="No projects found"
          description={`No projects found in the specified directories`}
        />
      ) : (
        projects.map((project) => (
          <Project
            key={project.path}
            project={project}
            onCustomize={handleCustomize}
            onStarToggle={refresh}
            onOpen={refresh}
          />
        ))
      )}
    </List>
  );
}
