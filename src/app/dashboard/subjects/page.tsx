"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2, Plus, Trash2, Edit, BookOpen } from "lucide-react";

interface Subject {
    id: string;
    code: string;
    name: string;
    isLab: boolean;
    duration: number;
    sessionsPerWeek: number;
}

export default function SubjectsPage() {
    const { user, loading: authLoading } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [isLab, setIsLab] = useState(false);
    const [duration, setDuration] = useState(1);
    const [sessions, setSessions] = useState(4);

    const fetchSubjects = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            const res = await fetch("/api/subjects", {
                headers: { "x-user-email": user.email },
            });
            if (res.ok) {
                const data = await res.json();
                setSubjects(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchSubjects();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.email) return;

        try {
            const url = "/api/subjects";
            const method = editingId ? "PUT" : "POST";
            const payload = { id: editingId, code, name, isLab, duration, sessionsPerWeek: sessions };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", "x-user-email": user.email },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setCode(""); setName(""); setIsLab(false); setDuration(1);
                fetchSubjects();
            }
        } catch (e) { console.error(e); }
    };

    const startEdit = (s: Subject) => {
        setEditingId(s.id);
        setCode(s.code);
        setName(s.name);
        setIsLab(s.isLab);
        setDuration(s.duration);
        setSessions(s.sessionsPerWeek || (s.isLab ? 1 : 4));
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this subject?")) return;
        if (!user?.email) return;
        await fetch(`/api/subjects?id=${id}`, { method: "DELETE", headers: { "x-user-email": user.email } });
        fetchSubjects();
    };

    if (authLoading) return <Loader2 className="animate-spin" />;
    const canEdit = user?.role === "PRINCIPAL" || user?.role === "HOD";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Manage Subjects
                    </h1>
                    <p className="text-gray-500 text-sm">Course Curriculum</p>
                </div>
                {canEdit && (
                    <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setCode(""); setName(""); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Subject
                    </Button>
                )}
            </div>

            {showForm && (
                <GlassCard className="p-6">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject Code</label>
                                <input placeholder="e.g. CS101" value={code} onChange={e => setCode(e.target.value)} className="w-full border p-2 rounded" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject Name</label>
                                <input placeholder="e.g. Programming in C" value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" required />
                            </div>
                            <div className="flex items-center gap-2 border p-2 rounded bg-white/50 h-[42px] mt-auto">
                                <input type="checkbox" id="isLab" checked={isLab} onChange={e => {
                                    const checked = e.target.checked;
                                    setIsLab(checked);
                                    setDuration(checked ? 3 : 1);
                                    setSessions(checked ? 1 : 4);
                                }} />
                                <label htmlFor="isLab" className="cursor-pointer">Is Lab Session?</label>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Duration per Session (Hours)</label>
                                <input type="number" min="1" max="6" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full border p-2 rounded" />
                                <p className="text-xs text-gray-500">Usually 1 for Theory, 3 for Labs.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Sessions per Week</label>
                                <input type="number" min="1" max="10" value={sessions} onChange={e => setSessions(Number(e.target.value))} className="w-full border p-2 rounded" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button type="submit">{editingId ? "Update" : "Save"}</Button>
                        </div>
                    </form>
                </GlassCard>
            )}

            <div className="grid gap-4">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : subjects.map(s => (
                    <GlassCard key={s.id} className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${s.isLab ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{s.name} <span className="text-gray-400 text-sm">({s.code})</span></h3>
                                <p className="text-xs text-gray-500">{s.isLab ? "Laboratory" : "Theory"} • {s.duration}h/session • {s.sessionsPerWeek || (s.isLab ? 1 : 4)} sessions/week</p>
                            </div>
                        </div>
                        {canEdit && (
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => startEdit(s)} className="p-2"><Edit className="h-4 w-4 text-blue-500" /></Button>
                                <Button variant="ghost" onClick={() => handleDelete(s.id)} className="p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        )}
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
