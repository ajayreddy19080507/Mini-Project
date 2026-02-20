"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

interface LiveClass {
    id: string;
    section: { name: string; department: string };
    subject: { name: string; code: string; isLab: boolean };
    faculty: { name: string } | null;
    room: { name: string } | null;
}

export default function LiveViewPage() {
    const { user, loading: authLoading } = useAuth();
    const [liveData, setLiveData] = useState<{ active: boolean; day?: string; slot?: number; classes?: LiveClass[]; message?: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchLiveStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/timetable/live");
            if (res.ok) {
                const data = await res.json();
                setLiveData(data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveStatus();
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchLiveStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    if (authLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                        Live Classroom View
                    </h1>
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Real-time status of ongoing classes
                    </p>
                </div>
                <Button onClick={fetchLiveStatus} disabled={loading} variant="outline" className="gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <GlassCard className="p-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                            {liveData?.day ? `${liveData.day} • Period ${liveData.slot}` : "Current Status"}
                        </h2>
                        <p className="text-xs text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                    </div>
                    {liveData?.active && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                            ● Live Now
                        </span>
                    )}
                </div>

                {!liveData?.active ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg font-medium">{liveData?.message || "Loading..."}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3 text-gray-600 font-medium">Department</th>
                                    <th className="p-3 text-gray-600 font-medium">Class / Section</th>
                                    <th className="p-3 text-gray-600 font-medium">Subject</th>
                                    <th className="p-3 text-gray-600 font-medium">Faculty</th>
                                    <th className="p-3 text-gray-600 font-medium">Room</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {liveData.classes?.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-3 font-medium text-gray-800">{item.section.department}</td>
                                        <td className="p-3 text-blue-600 font-semibold">{item.section.name}</td>
                                        <td className="p-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{item.subject.name}</span>
                                                <span className="text-xs text-gray-500">{item.subject.code}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            {item.faculty ? (
                                                <span className="text-gray-700">{item.faculty.name}</span>
                                            ) : (
                                                <span className="text-red-400 italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {item.room ? (
                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs border">
                                                    {item.room.name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
