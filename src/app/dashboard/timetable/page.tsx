import { prisma } from "@/lib/db";
import { GlassCard } from "@/components/ui/GlassCard";
import { DAYS } from "@/lib/algorithm/types";

export default async function TimetableView() {
    const sections = await prisma.section.findMany({
        include: {
            timetables: {
                include: {
                    subject: true,
                    faculty: true,
                    room: true // Optional
                }
            }
        }
    });

    return (
        <div className="p-6 space-y-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Generated Timetables</h1>

            {sections.length === 0 && (
                <p className="text-gray-500">No sections found. Please upload data.</p>
            )}

            {sections.map(section => (
                <div key={section.id} className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-800 border-l-4 border-blue-500 pl-3">
                        {section.department} - {section.year} - {section.name} (Sem {section.semester})
                    </h2>

                    <div className="overflow-x-auto pb-4">
                        <GlassCard className="min-w-[800px] p-0 overflow-hidden">
                            <div className="grid grid-cols-8 text-sm text-center border-b border-gray-200 bg-gray-50/50">
                                <div className="p-4 font-bold text-gray-400 uppercase tracking-wider">Day / Slot</div>
                                {[1, 2, 3, 4, 5, 6, 7].map(slot => (
                                    <div key={slot} className="p-4 font-bold text-gray-600">
                                        Period {slot}
                                    </div>
                                ))}
                            </div>

                            {DAYS.map(day => (
                                <div key={day} className="grid grid-cols-8 border-b border-gray-100 last:border-0 hover:bg-white/40 transition-colors">
                                    <div className="p-4 font-bold text-gray-500 flex items-center justify-center bg-gray-50/30">
                                        {day}
                                    </div>

                                    {[1, 2, 3, 4, 5, 6, 7].map(slotNum => {
                                        const entry = section.timetables.find(t => t.day === day && t.slot === slotNum);

                                        return (
                                            <div key={slotNum} className="p-2 min-h-[100px] border-l border-gray-100 flex flex-col items-center justify-center text-center relative group">
                                                {entry ? (
                                                    <>
                                                        <div className="font-bold text-gray-800 text-base mb-1">
                                                            {entry.subject?.code || "???"}
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-medium line-clamp-2 px-1">
                                                            {entry.subject?.name}
                                                        </div>
                                                        {entry.faculty && (
                                                            <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100">
                                                                {entry.faculty.name}
                                                            </div>
                                                        )}
                                                        {entry.room && (
                                                            <div className="absolute top-1 right-1 text-[10px] text-gray-400">
                                                                {entry.room.name}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </GlassCard>
                    </div>
                </div>
            ))}
        </div>
    );
}
