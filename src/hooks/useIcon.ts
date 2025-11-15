import { Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import { DEFAULT_ICON_VALUE, findDefaultIcon, getCachedDefaultIcon } from "../utils/findDefaultIcon";
import { useProjectCustomization } from "./useCustomization";

type IconResult = {
  source: string | Icon;
  tintColor?: string;
};

export function useIcon(projectPath: string): IconResult {
  const [iconResult, setIconResult] = useState<IconResult>({ source: "" });
  const [customization, loading] = useProjectCustomization(projectPath);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cachedDefaultIcon = await getCachedDefaultIcon(projectPath);
      if (cachedDefaultIcon && !cancelled) {
        setIconResult({ source: cachedDefaultIcon });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectPath]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    void (async () => {
      if (customization && customization.icon !== DEFAULT_ICON_VALUE) {
        if (!cancelled) {
          setIconResult({
            source: customization.icon || "",
            tintColor: customization.color,
          });
        }
        return;
      }

      const defaultIconPath = await findDefaultIcon(projectPath);
      if (defaultIconPath && !cancelled) {
        setIconResult({ source: defaultIconPath });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectPath, loading, customization]);

  return iconResult;
}
