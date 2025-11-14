import { Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import { DEFAULT_ICON_VALUE, findDefaultIcon, getCachedDefaultIcon } from "../utils/findDefaultIcon";
import { getProjectCustomization } from "../utils/projectCustomization";

type IconResult = {
  source: string | Icon;
  tintColor?: string;
};

export function useIcon(projectPath: string): IconResult {
  const [iconResult, setIconResult] = useState<IconResult>({ source: "" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const customization = await getProjectCustomization(projectPath);

      if (customization && customization.icon !== DEFAULT_ICON_VALUE) {
        if (!cancelled) {
          setIconResult({
            source: customization.icon || "",
            tintColor: customization.color,
          });
        }
        return;
      }

      const cachedDefaultIcon = await getCachedDefaultIcon(projectPath);
      if (cachedDefaultIcon && !cancelled) {
        setIconResult({ source: cachedDefaultIcon });
      }
      const defaultIconPath = await findDefaultIcon(projectPath);
      if (defaultIconPath && !cancelled) {
        setIconResult({ source: defaultIconPath });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectPath]);

  return iconResult;
}
