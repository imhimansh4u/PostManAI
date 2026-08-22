import HeroSection from "@/components/landing/HeroSection";
import { Heart } from "lucide-react";

export default function Home() {
  return (
    <main className="landing-page-shell">
      <HeroSection />
      <footer className="landing-footer">
        <span>Made with</span>
        <Heart className="landing-footer-heart" size={14} fill="currentColor" />
        <span>for developers, by developers</span>
      </footer>
    </main>
  );
}
