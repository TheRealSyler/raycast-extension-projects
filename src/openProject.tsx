import { Icon, List } from "@raycast/api";
import { Project } from "./components/project";
import { useProjects } from "./hooks/useProjects";

export default function Command() {
  const { projects, isLoading, error } = useProjects();

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
        projects.map((project) => <Project key={project.path} project={project} />)
      )}
    </List>
  );
}
