"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";

interface Faculty {
    id: string;
    name: string;
    designation: string;
    department: string | null;
    maxLoad: number;
}

export default function FacultyPage() {
    const { user, loading: authLoading } = useAuth();
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [newDesg, setNewDesg] = useState("Assistant Professor");
    const [newDept, setNewDept] = useState("CSE");
    const [newLoad, setNewLoad] = useState(12);

    const fetchFaculty = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            const res = await fetch("/api/faculty", {
                headers: { "x-user-email": user.email },
            });
            if (res.ok) {
                const data = await res.json();
                if (user.role === "HOD" && user.department) {
                    setFaculty(data.filter((f: Faculty) => f.department === user.department));
                } else {
                    setFaculty(data);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchFaculty();
    }, [user]);

    const startEdit = (f: Faculty) => {
        setEditingId(f.id);
        setNewName(f.name);
        setNewDesg(f.designation);
        setNewDept(f.department || "");
        setNewLoad(f.maxLoad);
        setShowAddForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.email) return;

        try {
            const url = "/api/faculty";
            const method = editingId ? "PUT" : "POST";
            const payload = {
                id: editingId, // backend should ignore if POST
                name: newName,
                designation: newDesg,
                maxLoad: newLoad,
                department: user.role === "HOD" ? user.department : newDept,
            };

            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "x-user-email": user.email
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setShowAddForm(false);
                setEditingId(null);
                setNewName("");
                fetchFaculty();
            } else {
                alert("Failed to save");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will remove all associated constraints.")) return;
        if (!user?.email) return;
        try {
            const res = await fetch(`/api/faculty?id=${id}`, {
                method: "DELETE",
                headers: { "x-user-email": user.email }
            });

            if (res.ok) {
                fetchFaculty();
            } else {
                alert("Failed to delete faculty");
            }
        } catch (e) { console.error(e); }
    };

    if (authLoading) return <Loader2 className="animate-spin" />;

    const canEdit = user?.role === "PRINCIPAL" || user?.role === "HOD";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Manage Faculty
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {user?.role === "HOD" ? `Department: ${user.department}` : "All Departments"}
                    </p>
                </div>
                {canEdit && (
                    <Button onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setNewName(""); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Faculty
                    </Button>
                )}
            </div>

            {showAddForm && (
                <GlassCard className="p-6 transition-all duration-300">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} className="border p-2 rounded" required />
                            <select value={newDesg} onChange={e => setNewDesg(e.target.value)} className="border p-2 rounded">
                                <option>Assistant Professor</option>
                                <option>Associate Professor</option>
                                <option>Professor</option>
                            </select>
                            {(user?.role === "PRINCIPAL") && (
                                <input placeholder="Department" value={newDept} onChange={e => setNewDept(e.target.value)} className="border p-2 rounded" />
                            )}
                            <input type="number" placeholder="Max Load" value={newLoad} onChange={e => setNewLoad(Number(e.target.value))} className="border p-2 rounded" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                            <Button type="submit">{editingId ? "Update" : "Save"}</Button>
                        </div>
                    </form>
                </GlassCard>
            )}

            <div className="grid gap-4">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : faculty.map((f) => (
                    <GlassCard key={f.id} className="p-4 flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold">{f.name}</h3>
                            <p className="text-xs text-gray-500">{f.designation} • {f.department || "General"} • Max: {f.maxLoad}</p>
                        </div>
                        {canEdit && (
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => startEdit(f)}>
                                    <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(f.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </GlassCard>
                ))}
                {!loading && faculty.length === 0 && <p className="text-center text-gray-500">No faculty found.</p>}
            </div>
        </div>
    );
}
