import { trackEvent } from "@/lib/posthog";

export function useTrack() {
  return (event: string, props?: Record<string, unknown>) => {
    trackEvent(event, props);
  };
}
