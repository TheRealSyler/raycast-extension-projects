import { LocalStorage } from "@raycast/api";
import { z } from "zod";
import { getStorageKey } from "./constants";

const projectCustomizationSchema = z.object({
  icon: z.string().optional(),
  color: z.string().optional(),
});

export type ProjectCustomization = z.infer<typeof projectCustomizationSchema>;

export async function getProjectCustomization(projectPath: string): Promise<ProjectCustomization | null> {
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

export async function saveProjectCustomization(
  projectPath: string,
  customization: Partial<ProjectCustomization> | null,
): Promise<void> {
  if (customization === null) {
    await LocalStorage.removeItem(getStorageKey("customizations", projectPath));
  } else if (customization.icon === undefined && customization.color === undefined) {
    await LocalStorage.removeItem(getStorageKey("customizations", projectPath));
  } else {
    const currentCustomization = await getProjectCustomization(projectPath);
    const updatedCustomization: ProjectCustomization = {
      ...currentCustomization,
      ...customization,
    };
    await LocalStorage.setItem(getStorageKey("customizations", projectPath), JSON.stringify(updatedCustomization));
  }
}
