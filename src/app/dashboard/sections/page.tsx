"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Section {
    id: string;
    name: string;
    department: string;
    year: number;
    semester: number;
}

export default function ManageSectionsPage() {
    const { user, loading: authLoading } = useAuth();
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [name, setName] = useState("");
    const [department, setDepartment] = useState("");
    const [year, setYear] = useState("1");
    const [semester, setSemester] = useState("1");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            // If HOD, pre-fill department
            if (user.role === "HOD" && user.department) {
                setDepartment(user.department);
            }
            fetchSections();
        }
    }, [user]);

    const fetchSections = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/sections");
            if (res.ok) {
                const data = await res.json();
                // Filter if HOD
                if (user?.role === "HOD" && user.department) {
                    setSections(data.filter((s: Section) => s.department === user.department));
                } else {
                    setSections(data);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload = {
            name,
            department: user?.role === "HOD" ? user.department : department,
            year: parseInt(year),
            semester: parseInt(semester)
        };

        try {
            const res = await fetch("/api/sections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setName("");
                fetchSections();
            } else {
                alert("Failed to save section");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This might delete associated timetables.")) return;

        try {
            const res = await fetch(`/api/sections/${id}`, { method: "DELETE" });
            if (res.ok) {
                setSections(sections.filter(s => s.id !== id));
            } else {
                alert("Failed to delete");
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (authLoading || loading) return <Loader2 className="animate-spin" />;

    const canEdit = user?.role === "PRINCIPAL" || user?.role === "HOD";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                    Manage Sections
                </h1>
                <p className="text-gray-500 text-sm">Add or remove student groups (sections).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form */}
                {canEdit && (
                    <GlassCard className="md:col-span-1 h-fit">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">Add New Section</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section Name (e.g., CSE-A)</label>
                                <input
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="CSE-A"
                                />
                            </div>

                            {user?.role === "PRINCIPAL" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <input
                                        required
                                        value={department}
                                        onChange={e => setDepartment(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="CSE"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                    <select
                                        required
                                        value={year}
                                        onChange={e => setYear(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                    <select
                                        required
                                        value={semester}
                                        onChange={e => setSemester(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="1">Sem 1</option>
                                        <option value="2">Sem 2</option>
                                    </select>
                                </div>
                            </div>

                            <Button type="submit" disabled={isSaving} className="w-full justify-center">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                Add Section
                            </Button>
                        </form>
                    </GlassCard>
                )}

                {/* List */}
                <GlassCard className="md:col-span-2">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">Existing Sections</h2>
                    {sections.length === 0 ? (
                        <p className="text-gray-500 py-8 text-center italic">No sections found.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {sections.map(section => (
                                <div key={section.id} className="p-4 rounded-xl border border-gray-100 bg-white/50 flex justify-between items-center hover:shadow-md transition-shadow group">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{section.name}</h3>
                                        <p className="text-xs text-gray-500">
                                            {section.department} • Year {section.year} • Sem {section.semester}
                                        </p>
                                    </div>
                                    {canEdit && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                            onClick={() => handleDelete(section.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
}
