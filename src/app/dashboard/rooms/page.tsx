"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, Trash2, MapPin } from "lucide-react";

interface Room {
    id: string;
    name: string;
    type: string;
    capacity: number | null;
}

export default function ManageRoomsPage() {
    const { user, loading: authLoading } = useAuth();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [name, setName] = useState("");
    const [type, setType] = useState("THEORY");
    const [capacity, setCapacity] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/rooms");
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
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
            type,
            capacity: capacity ? parseInt(capacity) : null
        };

        try {
            const res = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setName("");
                setCapacity("");
                fetchRooms();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to save room");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This might break existing timetables assigned to this room.")) return;

        try {
            const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
            if (res.ok) {
                setRooms(rooms.filter(r => r.id !== id));
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
            <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-teal-600" />
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                        Manage Classrooms
                    </h1>
                    <p className="text-gray-500 text-sm">Add or remove physical rooms and specific labs.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form */}
                {canEdit && (
                    <GlassCard className="md:col-span-1 h-fit">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">Add New Room</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name (e.g., LH-101, CP LAB-1)</label>
                                <input
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value.toUpperCase())}
                                    className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                                    placeholder="LH-101"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        required
                                        value={type}
                                        onChange={e => setType(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                                    >
                                        <option value="THEORY">Theory</option>
                                        <option value="LAB">Lab</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                                    <input
                                        type="number"
                                        value={capacity}
                                        onChange={e => setCapacity(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                                        placeholder="60"
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={isSaving} className="w-full justify-center bg-teal-600 hover:bg-teal-700 text-white">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                Add Room
                            </Button>
                        </form>
                    </GlassCard>
                )}

                {/* List */}
                <GlassCard className="md:col-span-2">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">Existing Rooms</h2>
                    {rooms.length === 0 ? (
                        <p className="text-gray-500 py-8 text-center italic">No rooms found.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {rooms.map(room => (
                                <div key={room.id} className="p-4 rounded-xl border border-gray-100 bg-white/50 flex justify-between items-center hover:shadow-md transition-shadow group">
                                    <div>
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                            {room.name}
                                            {room.type === 'LAB' && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase">Lab</span>}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Capacity: {room.capacity || 'N/A'}
                                        </p>
                                    </div>
                                    {canEdit && (
                                        <Button
                                            variant="ghost"
                                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 p-2"
                                            onClick={() => handleDelete(room.id)}
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
