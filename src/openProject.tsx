import { Icon, List } from "@raycast/api";
import { useMemo } from "react";
import { Project } from "./components/project";
import { useProjects } from "./hooks/useProjects";

export default function Command() {
  const { projects, isLoading, error, refresh } = useProjects();

  const duplicateNames = useMemo(() => {
    const nameCounts = new Map<string, number>();
    projects.forEach((project) => {
      nameCounts.set(project.name, (nameCounts.get(project.name) || 0) + 1);
    });
    return new Set(
      Array.from(nameCounts.entries())
        .filter(([, count]) => count >= 2)
        .map(([name]) => name),
    );
  }, [projects]);

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
          <Project key={project.path} project={project} refresh={refresh} showPath={duplicateNames.has(project.name)} />
        ))
      )}
    </List>
  );
}
