"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Loader2, Calendar, User, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

interface WorkloadItem {
    id: string;
    name: string;
    designation: string;
    department: string | null;
    maxLoad: number;
    currentLoad: number;
    remainingLoad: number;
    schedule: Record<string, any[]>;
}

export default function WorkloadPage() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<WorkloadItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState<WorkloadItem | null>(null);

    const fetchWorkload = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/faculty/workload");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchWorkload();
    }, [user]);

    if (authLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-600">
                        Faculty Workload
                    </h1>
                    <p className="text-gray-500 text-sm">Monitor teaching hours and schedules</p>
                </div>
                <Button onClick={fetchWorkload} variant="outline" disabled={loading}>
                    <RefreshIcon loading={loading} /> Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List of Faculty */}
                <div className="lg:col-span-1 space-y-4">
                    {stats.map(fac => (
                        <GlassCard
                            key={fac.id}
                            className={`p-4 cursor-pointer transition-all hover:bg-blue-50/50 ${selectedFaculty?.id === fac.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                            onClick={() => setSelectedFaculty(fac)}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{fac.name}</h3>
                                    <p className="text-xs text-gray-500">{fac.designation} • {fac.department || "GEN"}</p>
                                </div>
                                <div className={`text-xs font-bold px-2 py-1 rounded ${getLoadColor(fac.currentLoad, fac.maxLoad)}`}>
                                    {fac.currentLoad} / {fac.maxLoad} Hrs
                                </div>
                            </div>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{ width: `${Math.min((fac.currentLoad / fac.maxLoad) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* Detailed Schedule View */}
                <div className="lg:col-span-2">
                    {selectedFaculty ? (
                        <GlassCard className="p-6 h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{selectedFaculty.name}</h2>
                                    <p className="text-sm text-gray-500">Weekly Schedule</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                    <div key={day} className="flex gap-4 border-b pb-4 last:border-0">
                                        <div className="w-12 pt-2 font-bold text-gray-400">{day}</div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {selectedFaculty.schedule[day]?.length > 0 ? (
                                                selectedFaculty.schedule[day].map((cls: any) => (
                                                    <div key={cls.id} className="bg-white border rounded p-3 text-sm shadow-sm relative group">
                                                        <div className="absolute top-2 right-2 text-xs font-mono text-gray-400">
                                                            P{cls.slot}
                                                        </div>
                                                        <div className="font-semibold text-blue-700">{cls.subject.name}</div>
                                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                            <span>{cls.section.name}</span>
                                                            {cls.room && <span className="bg-gray-100 px-1 rounded border">{cls.room.name}</span>}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-gray-300 text-sm italic py-2">No active classes</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed rounded-xl">
                            <p>Select a faculty member to view their schedule</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function RefreshIcon({ loading }: { loading: boolean }) {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin mr-2" />;
    return <Clock className="w-4 h-4 mr-2" />;
}

function getLoadColor(current: number, max: number) {
    const ratio = current / max;
    if (ratio >= 1) return "bg-red-100 text-red-700";
    if (ratio >= 0.8) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
}
