import { LocalStorage } from "@raycast/api";
import { useEffect, useState } from "react";
import { z } from "zod";
import { getStorageKey } from "../utils/constants";

const projectCustomizationSchema = z.object({
  icon: z.string().optional(),
  color: z.string().optional(),
});

export type ProjectCustomization = z.infer<typeof projectCustomizationSchema>;

async function getProjectCustomization(projectPath: string): Promise<ProjectCustomization | null> {
  try {
    const customizationJson = await LocalStorage.getItem(getStorageKey("customizations", projectPath));
    if (customizationJson && typeof customizationJson === "string") {
      const parsed = JSON.parse(customizationJson);
      return projectCustomizationSchema.parse(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

const LISTENERS = new Set<{ projectPath: string; callback: (customization: ProjectCustomization | null) => void }>();

export function useProjectCustomization(projectPath: string) {
  const [customization, setCustomization] = useState<ProjectCustomization | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getProjectCustomization(projectPath).then((customization) => {
      setCustomization(customization);
      setLoading(false);
    });
  }, [projectPath]);

  useEffect(() => {
    const listener = { projectPath, callback: setCustomization };
    LISTENERS.add(listener);
    return () => {
      LISTENERS.delete(listener);
    };
  }, [projectPath]);
  return [customization, loading] as const;
}

export async function saveProjectCustomization(
  projectPath: string,
  customization: Partial<ProjectCustomization> | null,
): Promise<void> {
  let updatedCustomization: ProjectCustomization | null;
  if (customization === null || (customization.icon === undefined && customization.color === undefined)) {
    updatedCustomization = null;
    await LocalStorage.removeItem(getStorageKey("customizations", projectPath));
  } else {
    const currentCustomization = await getProjectCustomization(projectPath);
    updatedCustomization = {
      ...currentCustomization,
      ...customization,
    };
    await LocalStorage.setItem(getStorageKey("customizations", projectPath), JSON.stringify(updatedCustomization));
  }
  LISTENERS.forEach((listener) => {
    if (listener.projectPath === projectPath) {
      listener.callback(updatedCustomization);
    }
  });
}
