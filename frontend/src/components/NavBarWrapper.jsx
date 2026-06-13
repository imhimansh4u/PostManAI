"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/landing/Navbar"

// Pages where Navbar should NOT appear
const hiddenRoutes = [
  "/auth/login",
  "/auth/signup",
]

export default function NavbarWrapper() {
  const pathname = usePathname()

  // If current page is in hiddenRoutes → don't show Navbar
  if (hiddenRoutes.includes(pathname)) return null

  return <Navbar />
}