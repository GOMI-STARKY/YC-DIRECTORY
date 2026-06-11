import { useCallback } from "react";

export function useToast() {
  const toast = useCallback(
    ({
      title,
      description,
      variant = "default",
    }: {
      title?: string;
      description?: string;
      variant?: "default" | "destructive";
    }) => {
      // Simple toast notification using browser's native alert for visibility
      const msg = `${title ? title + ": " : ""}${description || ""}`;
      if (variant === "destructive") {
        // show visible alert for errors
        if (typeof window !== "undefined") alert(msg || "Error");
        // log as a warning (avoid throwing console-level errors for validation)
        console.warn(msg || "Error");
      } else {
        if (typeof window !== "undefined") alert(msg || "Success");
        console.log(msg || "Success");
      }
    },
    []
  );

  return { toast };
}
