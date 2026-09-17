"use client";

import { useEffect } from "react";
import { startFlapGame } from "@/features/flap/game";

/** Mounts the canvas game onto the Flap page markup and tears it down on unmount. */
export function FlapGameClient() {
  useEffect(() => startFlapGame(), []);
  return null;
}
