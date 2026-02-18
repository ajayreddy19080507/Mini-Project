import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Timetable Generator",
  description: "Advanced College Timetable Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={clsx(inter.className, "bg-[#F5F5F7] text-gray-900 antialiased min-h-screen flex flex-col")} suppressHydrationWarning={true}>
        <AuthProvider>
          <div className="flex-grow relative overflow-hidden">
            {/* Background Gradients for that 'Apple' feel */}
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none -z-10" />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
