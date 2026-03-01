"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, LogOut, LayoutDashboard, Users, BookOpen, Calendar, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) return null; // Will redirect

    return (
        <div className="flex h-screen bg-transparent">
            {/* Sidebar */}
            <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Timetable<span className="text-gray-900">Gen</span>
                    </h2>
                    <div className="mt-2 text-xs font-medium px-2 py-1 bg-blue-100/50 text-blue-700 rounded-lg inline-block">
                        {user.role || "GUEST"} {user.department ? ` - ${user.department}` : ""}
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <NavItem href="/dashboard" icon={<LayoutDashboard />} label="Overview" />

                    {(user.role === "PRINCIPAL" || user.role === "HOD") && (
                        <NavItem href="/dashboard/faculty" icon={<Users />} label="Manage Faculty" />
                    )}

                    <NavItem href="/dashboard/timetable" icon={<Calendar />} label="View Timetables" />
                    <NavItem href="/dashboard/subjects" icon={<BookOpen />} label="Subjects" />
                    <NavItem href="/dashboard/sections" icon={<Users />} label="Sections" />
                    <NavItem href="/dashboard/rooms" icon={<BookOpen />} label="Rooms" />
                    <div className="pt-2 mt-2 border-t border-gray-100">
                        <NavItem href="/dashboard/workload" icon={<Users className="w-4 h-4" />} label="Faculty Workload" />
                        <NavItem href="/dashboard/live" icon={<span className="text-red-500 animate-pulse">●</span>} label="Live Status" />
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs uppercase">
                            {user.email?.substring(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user.email}</p>
                            <p className="text-xs text-gray-500 truncate">Online</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => logout()} className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="mb-8 w-full bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    <img
                        src="/header.png"
                        alt="Santhiram Engineering College Banner"
                        className="w-full h-auto max-h-32 object-contain hidden"
                        onLoad={(e) => {
                            (e.target as HTMLImageElement).classList.remove('hidden');
                            const fallback = document.getElementById('banner-fallback');
                            if (fallback) fallback.style.display = 'none';
                        }}
                    />
                    <div id="banner-fallback" className="w-full h-32 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl" style={{ display: 'flex' }}>
                        <span className="text-gray-500 font-medium text-lg">College Banner Placement</span>
                        <span className="text-gray-400 text-sm mt-1">Please save your image as <b>public/header.png</b> to display it here.</span>
                    </div>
                </div>
                {children}
            </main>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link href={href}>
            <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-blue-50 hover:text-blue-600 mb-1">
                <span className="mr-3 h-4 w-4">{icon}</span>
                {label}
            </Button>
        </Link>
    )
}
