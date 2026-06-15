import { Geist_Mono, Syne } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext.jsx";
import NavbarWrapper from "@/components/NavBarWrapper";
import { Toaster } from "sonner";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "PostmanAI — Test APIs in Plain English",
  description:
    "Describe your API test in English. AI writes it, runs it, and tells you in plain English why it failed.",
  keywords: ["API testing", "AI", "LangChain", "developer tools", "QA"],
  authors: [{ name: "Himanshu" }],
  openGraph: {
    title: "PostmanAI — Test APIs in Plain English",
    description:
      "Describe your API test in English. AI writes it, runs it, and tells you why it failed.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${syne.variable} ${geistMono.variable}`}>
      <body>
        <AuthProvider>
          <NavbarWrapper />
          <main style={{paddingTop : "72px"}}>
            {children}
            <Toaster richColors position="top-right" />
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
