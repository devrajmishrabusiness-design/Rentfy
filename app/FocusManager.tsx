"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function FocusManager() {
  const pathname = usePathname();

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (main) {
      main.focus();
    }
  }, [pathname]);

  return null;
}