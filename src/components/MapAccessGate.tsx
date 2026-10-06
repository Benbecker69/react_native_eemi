import type { ReactNode } from "react";
import { Skeleton } from "@/components/Skeleton";
import { LockedMap } from "@/components/LockedMap";
import { useLocationPermission } from "@/features/location/useLocationPermission";

type MapAccessGateProps = { height: number; children: ReactNode };

// The map is shown only when the location is on. Until the first silent
// check has answered, a skeleton of the same size holds the place — showing
// the locked map for a moment and then swapping it would flash. The real
// map is not even mounted while locked.
export function MapAccessGate({ height, children }: MapAccessGateProps) {
  const access = useLocationPermission();

  if (access.permission === "unknown") return <Skeleton height={height} radius={14} />;
  if (access.permission !== "granted") return <LockedMap height={height} access={access} />;
  return <>{children}</>;
}
