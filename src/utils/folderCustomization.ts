import { LocalStorage } from "@raycast/api";
import { z } from "zod";
import { STORAGE_KEY } from "./constants";

const folderCustomizationSchema = z.object({
  icon: z.string().optional(),
  color: z.string().optional(),
});

const folderCustomizationsSchema = z.record(z.string(), folderCustomizationSchema);

export type FolderCustomization = z.infer<typeof folderCustomizationSchema>;
export type FolderCustomizations = z.infer<typeof folderCustomizationsSchema>;

export async function getFolderCustomizations(): Promise<FolderCustomizations> {
  try {
    const customizationsJson = await LocalStorage.getItem(STORAGE_KEY);
    if (customizationsJson && typeof customizationsJson === "string") {
      const parsed = JSON.parse(customizationsJson);
      return folderCustomizationsSchema.parse(parsed);
    }
    return {};
  } catch {
    return {};
  }
}

export async function saveFolderCustomization(folderPath: string, customization: FolderCustomization): Promise<void> {
  const customizations = await getFolderCustomizations();
  customizations[folderPath] = customization;
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(customizations));
}

export async function getFolderCustomization(folderPath: string): Promise<FolderCustomization | null> {
  const customizations = await getFolderCustomizations();
  return customizations[folderPath] || null;
}
