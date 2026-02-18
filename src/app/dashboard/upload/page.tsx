"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { uploadData } from "@/app/actions";

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus("idle");
            setErrorMessage("");
        }
    };

    const handleUpload = () => {
        if (!file) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.append("file", file);

            const result = await uploadData(formData);

            if (result.success) {
                setStatus("success");
            } else {
                setStatus("error");
                setErrorMessage(result.error || "Upload failed");
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Upload Data</h1>
                <p className="text-gray-500">Import your Faculty and Section data via Excel.</p>
            </div>

            <GlassCard className="min-h-[400px] flex flex-col items-center justify-center border-dashed border-2 border-gray-300 bg-white/40">

                {!file ? (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-10 hover:bg-white/40 transition-colors rounded-xl">
                        <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <Upload size={32} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">Click or Drag Excel file here</h3>
                        <p className="text-gray-500 mt-2 text-center max-w-sm">
                            Supported formats: .xlsx, .xls. Ensure your sheet follows the template structure.
                        </p>
                        <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileChange} />
                    </label>
                ) : (
                    <div className="flex flex-col items-center w-full max-w-md">
                        <div className="h-16 w-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <FileSpreadsheet size={28} />
                        </div>
                        <p className="text-lg font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500 mb-6">{(file.size / 1024).toFixed(2)} KB</p>

                        <div className="flex gap-3 w-full">
                            <Button
                                onClick={handleUpload}
                                isLoading={isPending}
                                className="w-full"
                            >
                                {isPending ? "Parsing..." : "Process File"}
                            </Button>
                            <Button variant="ghost" onClick={() => setFile(null)} disabled={isPending}>
                                Cancel
                            </Button>
                        </div>

                        {status === "success" && (
                            <div className="mt-4 flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                <CheckCircle size={16} className="mr-2" />
                                <span>Data imported successfully!</span>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="mt-4 flex items-center text-red-600 bg-red-50 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                <AlertCircle size={16} className="mr-2" />
                                <span>{errorMessage}</span>
                            </div>
                        )}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
