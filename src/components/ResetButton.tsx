"use client";

import { Button } from "@/components/ui/Button";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResetButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleReset = async () => {
        if (!confirm("Are you sure you want to clear ALL data from the database? This includes Faculties, Subjects, Sections, Rooms, and Timetables! This action CANNOT be undone.")) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/system/reset", { method: "POST" });
            if (res.ok) {
                alert("Database reset successfully!");
                router.refresh();
            } else {
                const data = await res.json();
                alert(`Failed to reset database: ${data.error}`);
            }
        } catch (error) {
            console.error("Failed to reset:", error);
            alert("An error occurred while resetting the database.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleReset}
            disabled={loading}
            variant="outline"
            className="text-red-500 border-red-200 hover:bg-red-50"
        >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Reset Database
        </Button>
    );
}
