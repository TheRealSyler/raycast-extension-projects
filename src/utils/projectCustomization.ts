import { LocalStorage } from "@raycast/api";
import { z } from "zod";
import { CUSTOMIZATIONS_KEY } from "./constants";

const projectCustomizationSchema = z.object({
  icon: z.string().optional(),
  color: z.string().optional(),
});

const projectCustomizationsSchema = z.record(z.string(), projectCustomizationSchema);

export type ProjectCustomization = z.infer<typeof projectCustomizationSchema>;
export type ProjectCustomizations = z.infer<typeof projectCustomizationsSchema>;

export async function getProjectCustomizations(): Promise<ProjectCustomizations> {
  try {
    const customizationsJson = await LocalStorage.getItem(CUSTOMIZATIONS_KEY);
    if (customizationsJson && typeof customizationsJson === "string") {
      const parsed = JSON.parse(customizationsJson);
      return projectCustomizationsSchema.parse(parsed);
    }
    return {};
  } catch {
    return {};
  }
}

export async function saveProjectCustomization(
  projectPath: string,
  customization: Partial<ProjectCustomization> | null,
): Promise<void> {
  const customizations = await getProjectCustomizations();

  if (customization === null) {
    delete customizations[projectPath];
  } else if (customization.icon === undefined && customization.color === undefined) {
    delete customizations[projectPath];
  } else {
    customizations[projectPath] = {
      ...customizations[projectPath],
      ...customization,
    };
  }
  await LocalStorage.setItem(CUSTOMIZATIONS_KEY, JSON.stringify(customizations));
}

export async function getProjectCustomization(projectPath: string): Promise<ProjectCustomization | null> {
  const customizations = await getProjectCustomizations();
  return customizations[projectPath] || null;
}
