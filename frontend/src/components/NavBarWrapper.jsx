"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/landing/Navbar";

// Pages where Navbar should NOT appear
const hiddenRoutes = ["/auth/login", "/auth/signup"];

export default function NavbarWrapper({ children }) {
  const pathname = usePathname();
  const hasNavbar = !hiddenRoutes.includes(pathname);

  if (!hasNavbar) {
    return <div className="app-main no-navbar">{children}</div>;
  }

  return (
    <>
      <Navbar />
      <div className="app-main">{children}</div>
    </>
  );
}
