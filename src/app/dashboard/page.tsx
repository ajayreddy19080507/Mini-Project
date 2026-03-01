import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Upload, Play, Users, BookOpen, Download } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { GenerateButton } from "@/components/GenerateButton";
import { ResetButton } from "@/components/ResetButton";

export default async function Dashboard() {
    // Fetch real stats
    const facultyCount = await prisma.faculty.count();
    const sectionsCount = await prisma.section.count();
    const timetablesCount = await prisma.timetable.count();

    return (
        <div className="p-6 md:p-12 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Manage your college capabilities.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/upload">
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" /> Import Data
                        </Button>
                    </Link>
                    <GenerateButton />
                    <a href="/api/export" download="timetable.xlsx">
                        <Button variant="secondary">
                            <Download className="mr-2 h-4 w-4" /> Export Excel
                        </Button>
                    </a>
                    <ResetButton />
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Faculty</p>
                            <h3 className="text-2xl font-bold">{facultyCount}</h3>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Active Sections</p>
                            <h3 className="text-2xl font-bold">{sectionsCount}</h3>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl text-green-600">
                            <Play size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Timetable Entries</p>
                            <h3 className="text-2xl font-bold">{timetablesCount}</h3>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Quick Links / Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">View Timetables</h3>
                        <p className="text-gray-500 text-sm mb-4">Check the generated schedules for all sections.</p>
                    </div>
                    <Link href="/dashboard/timetable">
                        <Button variant="secondary" className="w-full">Go to Timetables</Button>
                    </Link>
                </GlassCard>
            </div>
        </div>
    );
}
