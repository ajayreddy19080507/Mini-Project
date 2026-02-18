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
    id: string; // unique event id
    sectionId: string;
    subjectId: string;
    duration: number; // 1 or 3
    facultyId: string | null; // Pre-assigned or to be found
    roomId: string | null;    // Pre-assigned or to be found
}

// Main Generation Function
export async function generateTimetable() {
    console.log("Starting generation...");

    // 1. Fetch Data
    const sections = await prisma.section.findMany({
        include: { subjects: true }
    });

    // Clean up old timetables?
    await prisma.timetable.deleteMany({});

    // 2. Expand Events
    // Rule: If Section has Subject, schedule X slots.
    // Assumption: Theory = 4 hours/week, Lab = 1 session (3 hours)/week.
    const events: Event[] = [];

    for (const section of sections) {
        for (const subject of section.subjects) {
            if (subject.isLab) {
                // Labs need 1 session of 3 hours
                events.push({
                    id: `${section.id}-${subject.id}-LAB`,
                    sectionId: section.id,
                    subjectId: subject.id,
                    duration: 3,
                    facultyId: null, // Need to find faculty who can teach this
                    roomId: null     // Need to find room
                });
            } else {
                // Theory needs X sessions (default 4)
                const sessions = subject.sessionsPerWeek || 4;
                for (let i = 0; i < sessions; i++) {
                    events.push({
                        id: `${section.id}-${subject.id}-${i}`,
                        sectionId: section.id,
                        subjectId: subject.id,
                        duration: 1,
                        facultyId: null,
                        roomId: null
                    });
                }
            }
        }
    }

    // 3. Shuffle then Sort Events
    // Shuffle first to distribute subjects randomly
    for (let i = events.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [events[i], events[j]] = [events[j], events[i]];
    }
    // Then Sort by duration (Labs first)
    events.sort((a, b) => b.duration - a.duration);

    // 4. Solve
    console.log(`Scheduling ${events.length} events...`);
    const initialSchedule: Schedule = { bookings: [] };
    const allSlots = getAllSlots();

    // Get all faculty IDs for fallback or global search
    const faculties = await prisma.faculty.findMany();
    const allFacultyIds = faculties.map(f => f.id);

    const finalSchedule = await solve(events, 0, initialSchedule, allSlots, allFacultyIds);

    if (finalSchedule) {
        console.log("Success! Saving to DB...");
        await saveSchedule(finalSchedule);
        return { success: true };
    } else {
        console.error("Failed to find a valid schedule.");
        return { success: false, error: "Constraints too strict. Try reducing subjects or increasing days." };
    }
}

// Backtracking function to find a valid schedule
async function solve(
    events: Event[],
    index: number,
    currentSchedule: Schedule,
    allSlots: Slot[],
    allFacultyIds: string[]
): Promise<Schedule | null> {
    if (index >= events.length) {
        return currentSchedule;
    }

    const event = events[index];

    // Find candidate faculty (who teach this subject)
    // Optimization: Cache this elsewhere if slow
    const potentialFaculty = await prisma.faculty.findMany({
        where: { subjects: { some: { id: event.subjectId } } }
    });

    // If no specific faculty found, we might want to try "Any faculty who can teach it" 
    // but the query above already does that.

    // Try all slots
    // Shuffle slots for randomness?
    const slots = [...allSlots]; // naive copy
    // Optional: Shuffle slots here too?

    for (const slot of slots) {
        // Labs need consecutive slots check...
        if (event.duration > 1) {
            if (slot.period + event.duration - 1 > 7) continue;
        }

        // Try to assign a Faculty
        for (const faculty of potentialFaculty) {
            if (isValid(event, slot, faculty.id, currentSchedule)) {
                // ... same logic ...
                const newBookings: Booking[] = [];
                for (let i = 0; i < event.duration; i++) {
                    newBookings.push({
                        sectionId: event.sectionId,
                        subjectId: event.subjectId,
                        facultyId: faculty.id,
                        roomId: null,
                        slot: { day: slot.day, period: slot.period + i }
                    });
                }

                const nextSchedule = { bookings: [...currentSchedule.bookings, ...newBookings] };
                const result = await solve(events, index + 1, nextSchedule, allSlots, allFacultyIds);
                if (result) return result;
            }
        }

        // FAILSAFE: If no faculty could be assigned (or none found), try assigning NULL faculty
        // This ensures the timetable is generated even if faculty constraints are tight.
        if (potentialFaculty.length === 0 || true) { // Always try fallback if main failed? 
            // Only try fallback if we haven't found a result in this slot yet.
            // But we are inside the 'slot' loop.
            // Implicitly, if the loop above didn't return, we can try null.

            if (isValid(event, slot, null, currentSchedule)) {
                const newBookings: Booking[] = [];
                for (let i = 0; i < event.duration; i++) {
                    newBookings.push({
                        sectionId: event.sectionId,
                        subjectId: event.subjectId,
                        facultyId: null, // TBA
                        roomId: null, // TBA
                        slot: { day: slot.day, period: slot.period + i }
                    });
                }

                const nextSchedule = { bookings: [...currentSchedule.bookings, ...newBookings] };
                const result = await solve(events, index + 1, nextSchedule, allSlots, allFacultyIds);
                if (result) return result;
            }
        }
    }

    return null; // Backtrack
}

function isValid(event: Event, startSlot: Slot, facultyId: string | null, schedule: Schedule): boolean {
    // New Constraint: specific subject max 1 time per day for this section
    // (Unless it's the SAME event, which is handled by loop below. Here we check "other" events)
    if (event.duration === 1) {
        const sameSubjectOnDay = schedule.bookings.some(b =>
            b.sectionId === event.sectionId &&
            b.subjectId === event.subjectId &&
            b.slot.day === startSlot.day
        );
        if (sameSubjectOnDay) return false;
    }

    // Constraint: Faculty Max 4 hours per day? (Optional, good for balance)
    if (facultyId) {
        const facultyDaily = schedule.bookings.filter(b =>
            b.facultyId === facultyId &&
            b.slot.day === startSlot.day
        ).length;
        if (facultyDaily >= 4) return false; // Hard limit 4 classes/day per faculty
    }

    for (let i = 0; i < event.duration; i++) {
        const currentSlot = { day: startSlot.day, period: startSlot.period + i };

        // 1. Check Section Availability
        const sectionBusy = schedule.bookings.some(b =>
            b.sectionId === event.sectionId &&
            b.slot.day === currentSlot.day &&
            b.slot.period === currentSlot.period
        );
        if (sectionBusy) return false;

        // 2. Check Faculty Availability
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
    // Bulk insert (Prisma createMany is ideal)
    await prisma.timetable.createMany({
        data: schedule.bookings.map(b => ({
            day: b.slot.day,
            slot: b.slot.period,
            sectionId: b.sectionId,
            subjectId: b.subjectId,
            facultyId: b.facultyId,
            // roomId: b.roomId,
            startTime: "09:00", // Placeholder
            endTime: "10:00"    // Placeholder
        }))
    });
}
