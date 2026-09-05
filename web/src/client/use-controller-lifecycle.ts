import { useEffect, useRef } from "react";

export function useControllerLifecycle(controller: {
  destroy(): Promise<void>;
}) {
  const cleanup = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(cleanup.current);
    return () => {
      cleanup.current = setTimeout(() => void controller.destroy(), 0);
    };
  }, [controller]);
}
