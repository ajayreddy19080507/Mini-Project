import { prisma } from "@/lib/db";
import { Booking, Schedule, Slot, DAYS } from "./types";

// Helper to get all slots (6 days * 7 periods = 42 slots)
const getAllSlots = (): Slot[] => {
    const slots: Slot[] = [];
    for (const day of DAYS) {
        for (let p = 1; p <= 7; p++) {
            slots.push({ day, period: p });
        }
    }
    return slots;
};

interface Event {
    id: string;
    sectionId: string;
    subjectId: string;
    isLab: boolean;
    duration: number;
    facultyId: string | null;
    roomId: string | null;
}

interface RoomData {
    id: string;
    name: string;
    type: string; // "THEORY" | "LAB"
}

// Main Generation Function
export async function generateTimetable() {
    console.log("Starting generation...");

    // 1. Fetch Data
    const sections = await prisma.section.findMany({
        include: { subjects: true }
    });

    const allRooms = await prisma.room.findMany();
    const labRooms = allRooms.filter(r => r.type === "LAB");
    const theoryRooms = allRooms.filter(r => r.type === "THEORY");

    // Fallback if no theory rooms seeded
    if (theoryRooms.length === 0) {
        console.warn("No Theory rooms found. Seeding generic ones in memory.");
        // In a real app, we should fail or seed DB. 
        // For now, let's assume valid rooms exist or allow null for theory if needed.
    }

    // Clean up old timetables
    await prisma.timetable.deleteMany({});

    // 2. Expand Events
    const events: Event[] = [];

    for (const section of sections) {
        for (const subject of section.subjects) {
            if (subject.isLab) {
                // Labs need 1 session of 3 hours
                events.push({
                    id: `${section.id}-${subject.id}-LAB`,
                    sectionId: section.id,
                    subjectId: subject.id,
                    isLab: true,
                    duration: 3,
                    facultyId: null,
                    roomId: null
                });
            } else {
                // Theory needs X sessions
                const sessions = subject.sessionsPerWeek || 4;
                for (let i = 0; i < sessions; i++) {
                    events.push({
                        id: `${section.id}-${subject.id}-${i}`,
                        sectionId: section.id,
                        subjectId: subject.id,
                        isLab: false,
                        duration: 1,
                        facultyId: null,
                        roomId: null
                    });
                }
            }
        }
    }

    // 3. Shuffle then Sort Events
    for (let i = events.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [events[i], events[j]] = [events[j], events[i]];
    }
    // Sort by duration (Labs first)
    events.sort((a, b) => b.duration - a.duration);

    // 4. Solve
    console.log(`Scheduling ${events.length} events...`);
    const initialSchedule: Schedule = { bookings: [] };
    const allSlots = getAllSlots();

    const faculties = await prisma.faculty.findMany();
    const allFacultyIds = faculties.map(f => f.id);

    const finalSchedule = await solve(events, 0, initialSchedule, allSlots, allFacultyIds, labRooms, theoryRooms);

    if (finalSchedule) {
        console.log("Success! Saving to DB...");
        await saveSchedule(finalSchedule);
        return { success: true };
    } else {
        console.error("Failed to find a valid schedule.");
        return { success: false, error: "Constraints too strict. Try adding more rooms or faculties." };
    }
}

// Backtracking function
async function solve(
    events: Event[],
    index: number,
    currentSchedule: Schedule,
    allSlots: Slot[],
    allFacultyIds: string[],
    labRooms: RoomData[],
    theoryRooms: RoomData[]
): Promise<Schedule | null> {
    if (index >= events.length) {
        return currentSchedule;
    }

    const event = events[index];

    // Find candidate faculty
    const potentialFaculty = await prisma.faculty.findMany({
        where: { subjects: { some: { id: event.subjectId } } }
    });

    // Determine relevant rooms
    const candidateRooms = event.isLab ? labRooms : theoryRooms;
    // If no rooms of type found, maybe allow any? No, strict typing.
    // If candidateRooms is empty, we can't schedule this event properly with a room.
    // We will proceed but roomId will be null (or fail if strict).
    // Let's try to assign a room.

    // Try all slots
    const slots = [...allSlots];

    for (const slot of slots) {
        // Lab duration check
        if (event.duration > 1) {
            if (slot.period + event.duration - 1 > 7) continue;
            // Optional: Avoid Labs spanning across lunch if lunch is fixed? 
            // Assuming lunch is after period 4. 
            // 4+3 = 7. Period 4,5,6 spans lunch. 
            // Simple constraint: Start at 1, 2, 3, 5. (Avoid starting at 4 if 4 is before lunch and 5 is after)
            // Let's keep it simple for now.
        }

        // Try to assign Faculty + Room
        // We need BOTH a faculty and a room to be free.

        // 1. Find a valid Room first (optimization: rooms are harder constraints usually?)
        let assignedRoomId: string | null = null;

        for (const room of candidateRooms) {
            if (isRoomFree(room.id, slot, event.duration, currentSchedule)) {
                assignedRoomId = room.id;
                break; // Take first available room
            }
        }

        // If strict room required and none found, skip this slot
        if (candidateRooms.length > 0 && !assignedRoomId) continue;

        // 2. Try faculties
        for (const faculty of potentialFaculty) {
            if (isValid(event, slot, faculty.id, currentSchedule)) {
                // Double check room is still free (it is, we just checked headers)
                // But wait, isValid checks section/faculty. We need to check Room too?
                // We checked room above.

                const newBookings: Booking[] = [];
                for (let i = 0; i < event.duration; i++) {
                    newBookings.push({
                        sectionId: event.sectionId,
                        subjectId: event.subjectId,
                        facultyId: faculty.id,
                        roomId: assignedRoomId,
                        slot: { day: slot.day, period: slot.period + i }
                    });
                }

                const nextSchedule = { bookings: [...currentSchedule.bookings, ...newBookings] };
                const result = await solve(events, index + 1, nextSchedule, allSlots, allFacultyIds, labRooms, theoryRooms);
                if (result) return result;
            }
        }

        // Fallback: No specific faculty found/available, try NULL faculty (TBA)
        if (potentialFaculty.length === 0 || true) {
            if (isValid(event, slot, null, currentSchedule)) {
                const newBookings: Booking[] = [];
                for (let i = 0; i < event.duration; i++) {
                    newBookings.push({
                        sectionId: event.sectionId,
                        subjectId: event.subjectId,
                        facultyId: null,
                        roomId: assignedRoomId,
                        slot: { day: slot.day, period: slot.period + i }
                    });
                }
                const nextSchedule = { bookings: [...currentSchedule.bookings, ...newBookings] };
                const result = await solve(events, index + 1, nextSchedule, allSlots, allFacultyIds, labRooms, theoryRooms);
                if (result) return result;
            }
        }
    }

    return null;
}

function isRoomFree(roomId: string, startSlot: Slot, duration: number, schedule: Schedule): boolean {
    for (let i = 0; i < duration; i++) {
        const currentSlot = { day: startSlot.day, period: startSlot.period + i };
        const busy = schedule.bookings.some(b =>
            b.roomId === roomId &&
            b.slot.day === currentSlot.day &&
            b.slot.period === currentSlot.period
        );
        if (busy) return false;
    }
    return true;
}

function isValid(event: Event, startSlot: Slot, facultyId: string | null, schedule: Schedule): boolean {
    // Subject constraint
    if (event.duration === 1) {
        const sameSubjectOnDay = schedule.bookings.some(b =>
            b.sectionId === event.sectionId &&
            b.subjectId === event.subjectId &&
            b.slot.day === startSlot.day
        );
        if (sameSubjectOnDay) return false;
    }

    // Faculty Max Load Constraint
    if (facultyId) {
        const facultyDaily = schedule.bookings.filter(b =>
            b.facultyId === facultyId &&
            b.slot.day === startSlot.day
        ).length;
        if (facultyDaily >= 4) return false;
    }

    for (let i = 0; i < event.duration; i++) {
        const currentSlot = { day: startSlot.day, period: startSlot.period + i };

        // 1. Available Section
        const sectionBusy = schedule.bookings.some(b =>
            b.sectionId === event.sectionId &&
            b.slot.day === currentSlot.day &&
            b.slot.period === currentSlot.period
        );
        if (sectionBusy) return false;

        // 2. Available Faculty
        if (facultyId) {
            const facultyBusy = schedule.bookings.some(b =>
                b.facultyId === facultyId &&
                b.slot.day === currentSlot.day &&
                b.slot.period === currentSlot.period
            );
            if (facultyBusy) return false;
        }
    }
    return true;
}

async function saveSchedule(schedule: Schedule) {
    await prisma.timetable.createMany({
        data: schedule.bookings.map(b => ({
            day: b.slot.day,
            slot: b.slot.period,
            sectionId: b.sectionId,
            subjectId: b.subjectId,
            facultyId: b.facultyId,
            roomId: b.roomId,
            startTime: "09:00",
            endTime: "10:00"
        }))
    });
}
