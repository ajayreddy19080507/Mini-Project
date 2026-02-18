"use client";

import { Button } from "@/components/ui/Button";
import { Play, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/generate", { method: "POST" });
            if (res.ok) {
                router.push("/dashboard/timetable");
            } else {
                alert("Generation failed. Check console.");
            }
        } catch (e) {
            console.error(e);
            alert("Error generating timetable");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Generate Timetable
        </Button>
    );
}
