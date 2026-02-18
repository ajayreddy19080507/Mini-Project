'use server';

import { parseAndImportExcel } from "@/lib/excel";
import { revalidatePath } from "next/cache";

export async function uploadData(formData: FormData) {
    const file = formData.get('file') as File;

    if (!file) {
        throw new Error('No file uploaded');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
        await parseAndImportExcel(buffer);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Import failed:', error);
        return { success: false, error: 'Failed to parse Excel file. Ensure strict format.' };
    }
}
