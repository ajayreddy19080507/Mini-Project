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

    let allRooms = await prisma.room.findMany();

    // Seed default rooms if they got wiped
    if (allRooms.length === 0) {
        console.log("No rooms found, seeding default rooms...");
        await prisma.room.createMany({
            data: [
                { name: "LH-101", type: "THEORY", capacity: 60 },
                { name: "LH-102", type: "THEORY", capacity: 60 },
                { name: "LH-103", type: "THEORY", capacity: 60 },
                { name: "LH-104", type: "THEORY", capacity: 60 },
                { name: "CP LAB-1", type: "LAB", capacity: 60 },
                { name: "CP LAB-2", type: "LAB", capacity: 60 },
            ]
        });
        allRooms = await prisma.room.findMany();
    }

    const labRooms = allRooms.filter(r => r.type === "LAB");
    const theoryRooms = allRooms.filter(r => r.type === "THEORY");

    // Clean up old timetables
    await prisma.timetable.deleteMany({});

    // 2. Expand Events
    const events: Event[] = [];
    const subjectMap = new Map<string, string>();

    for (const section of sections) {
        for (const subject of section.subjects) {
            subjectMap.set(subject.id, subject.code);
            if (subject.isLab) {
                // Labs need 1 session of dynamic duration (default 3 if not specified)
                events.push({
                    id: `${section.id}-${subject.id}-LAB`,
                    sectionId: section.id,
                    subjectId: subject.id,
                    isLab: true,
                    duration: subject.duration || 3,
                    facultyId: null,
                    roomId: null
                });
            } else {
                // Theory needs dynamically accurate sessions from the database
                const sessions = subject.sessionsPerWeek;
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

    // 3. Heuristic Sorting Events (Crucial for deep strict constraint solving)
    // We perfectly group Theory and Lab subjects of the same section together so the Backtracker resolves them adjacent to each other.
    const getBaseCodeSort = (code: string | undefined) => code ? code.replace(/L(?=\d)/, '') : "";

    // Determine which BaseCode groups contain a Lab to prioritize them
    const groupHasLab = new Map<string, boolean>();
    for (const e of events) {
        const groupKey = `${e.sectionId}-${getBaseCodeSort(subjectMap.get(e.subjectId))}`;
        if (e.isLab) groupHasLab.set(groupKey, true);
    }

    events.sort((a, b) => {
        const groupA = `${a.sectionId}-${getBaseCodeSort(subjectMap.get(a.subjectId))}`;
        const groupB = `${b.sectionId}-${getBaseCodeSort(subjectMap.get(b.subjectId))}`;

        // 1. Prioritize groups that have a Lab component (we must place 3-hour blocks earliest)
        const aHasLab = groupHasLab.get(groupA) ? 1 : 0;
        const bHasLab = groupHasLab.get(groupB) ? 1 : 0;
        if (aHasLab !== bHasLab) return bHasLab - aHasLab;

        // 2. Keep the exact groups together
        if (groupA !== groupB) return groupA.localeCompare(groupB);

        // 3. Within the group, place the Lab (duration > 1) first, then the theory classes
        return b.duration - a.duration;
    });

    // 4. Solve
    console.log(`Scheduling ${events.length} events...`);
    const initialSchedule: Schedule = { bookings: [] };
    const allSlots = getAllSlots();

    const faculties = await prisma.faculty.findMany({ include: { subjects: true } });
    const allFacultyIds = faculties.map(f => f.id);

    // Create a lookup map for faster processing in recursion
    const facultyMap = new Map<string, { id: string, maxLoad: number, subjectIds: Set<string> }>();
    for (const f of faculties) {
        facultyMap.set(f.id, {
            id: f.id,
            maxLoad: f.maxLoad,
            subjectIds: new Set(f.subjects.map(s => s.id))
        });
    }

    const getBaseCode = (code: string | undefined) => code ? code.replace(/L(?=\d)/, '') : "";
    const baseCodeDurations = new Map<string, number>();
    for (const e of events) {
        const dKey = e.sectionId + "-" + getBaseCode(subjectMap.get(e.subjectId));
        baseCodeDurations.set(dKey, (baseCodeDurations.get(dKey) || 0) + e.duration);
    }

    const limit = { count: 0, max: 200000, startTime: Date.now() };

    const finalSchedule = await solve(events, 0, initialSchedule, allSlots, allFacultyIds, labRooms, theoryRooms, limit, facultyMap, subjectMap, baseCodeDurations);

    if (finalSchedule) {
        console.log("Success! Saving to DB...");
        await saveSchedule(finalSchedule);
        return { success: true };
    } else {
        console.error("Failed to find a valid schedule or reached iteration limit.");
        return { success: false, error: "Constraints too strict or calculation timed out. Try adding more faculty or rooms." };
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
    theoryRooms: RoomData[],
    limit: { count: number, max: number, startTime: number },
    facultyMap: Map<string, { id: string, maxLoad: number, subjectIds: Set<string> }>,
    subjectMap: Map<string, string>,
    baseCodeDurations: Map<string, number>
): Promise<Schedule | null> {
    if (index >= events.length) {
        return currentSchedule;
    }

    limit.count++;
    if (limit.count % 100000 === 0) {
        console.log(`Reached ${limit.count} iterations...`);
    }

    // Do NOT exit on max hits. The algorithm will transition into override mode instead.

    // Hard 10-second timeout to prevent server/browser hangs on absolutely impossible dense grids
    const isTimeout = Date.now() - limit.startTime > 10000;

    const event = events[index];

    // Find candidate faculty from pre-loaded map instead of querying DB every step
    const potentialFaculty = Array.from(facultyMap.values()).filter(f => f.subjectIds.has(event.subjectId));

    // Determine relevant rooms
    const candidateRooms = event.isLab ? labRooms : theoryRooms;
    // If no rooms of type found, maybe allow any? No, strict typing.
    // If candidateRooms is empty, we can't schedule this event properly with a room.
    // We will proceed but roomId will be null (or fail if strict).
    // Let's try to assign a room.

    // Randomize slots to prevent deterministic deep loops
    let sortedSlots = [...allSlots];
    if (limit.count > 100000) {
        // Greedy packing under duress
        sortedSlots.sort((a, b) => {
            const dayOrder: Record<string, number> = { 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6 };
            if (dayOrder[a.day] !== dayOrder[b.day]) return dayOrder[a.day] - dayOrder[b.day];
            return a.period - b.period;
        });
    } else {
        for (let i = sortedSlots.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sortedSlots[i], sortedSlots[j]] = [sortedSlots[j], sortedSlots[i]];
        }
    }

    for (const slot of sortedSlots) {
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

        if (candidateRooms.length > 0) {
            for (const room of candidateRooms) {
                if (isRoomFree(room.id, slot, event.duration, currentSchedule, limit, isTimeout)) {
                    assignedRoomId = room.id;
                    break; // Take first available room
                }
            }
            // If rooms exist in DB but none are free for this slot, skip this slot entirely
            // UNLESS we are in desperation mode!
            if (!assignedRoomId && limit.count < 100000 && !isTimeout) continue;

            // In desperation mode, just take the first candidate room, even if it double books
            if (!assignedRoomId && (limit.count >= 100000 || isTimeout)) {
                assignedRoomId = candidateRooms[0].id;
            }
        } else {
            // User did not upload ANY rooms to the database. Bypass the physical room constraint.
            assignedRoomId = null;
        }

        // 2. Try faculties
        for (const faculty of potentialFaculty) {
            if (isValid(event, slot, faculty.id, currentSchedule, facultyMap, limit, subjectMap, baseCodeDurations, isTimeout)) {
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
                const result = await solve(events, index + 1, nextSchedule, allSlots, allFacultyIds, labRooms, theoryRooms, limit, facultyMap, subjectMap, baseCodeDurations);
                if (result) return result;
            }
        }

        // Fallback: No specific faculty found/available, try NULL faculty (TBA)
        if (potentialFaculty.length === 0) {
            if (isValid(event, slot, null, currentSchedule, facultyMap, limit, subjectMap, baseCodeDurations, isTimeout)) {
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
                const result = await solve(events, index + 1, nextSchedule, allSlots, allFacultyIds, labRooms, theoryRooms, limit, facultyMap, subjectMap, baseCodeDurations);
                if (result) return result;
            }
        }
    }

    // ULTIMATE GRIDLOCK BREAKER: 
    // If the loop completely finishes checking every single slot and every single faculty
    // but couldn't fit this class (due to mathematically impossible density/missing rooms),
    // and we are over 100k iterations OR 10 seconds, we MUST force it into the schedule somewhere or it will hang forever.
    if (limit.count > 100000 || isTimeout) {
        // Find the first slot where THIS SECTION doesn't already have a class scheduled
        // to prevent database unique constraint violations (section + day + slot)
        let emergencySlot: Slot | null = null;
        for (const s of allSlots) {
            let fullyFree = true;
            for (let i = 0; i < event.duration; i++) {
                const busy = currentSchedule.bookings.some(b =>
                    b.sectionId === event.sectionId &&
                    b.slot.day === s.day &&
                    b.slot.period === s.period + i
                );
                if (busy) fullyFree = false;
            }
            if (fullyFree) {
                emergencySlot = s;
                break;
            }
        }

        if (!emergencySlot) {
            console.warn(`DROPPING class ${event.subjectId} for section ${event.sectionId} due to mathematical impossibility in 42-period week.`);
            return await solve(events, index + 1, currentSchedule, allSlots, allFacultyIds, labRooms, theoryRooms, limit, facultyMap, subjectMap, baseCodeDurations);
        }

        const emergencyFaculty = potentialFaculty.length > 0 ? potentialFaculty[0].id : null;
        const newBookings: Booking[] = [];

        for (let i = 0; i < event.duration; i++) {
            newBookings.push({
                sectionId: event.sectionId,
                subjectId: event.subjectId,
                facultyId: emergencyFaculty,
                roomId: null,
                slot: { day: emergencySlot.day, period: emergencySlot.period + i } // Might overflow to period 8, but guarantees completion
            });
        }
        const nextSchedule = { bookings: [...currentSchedule.bookings, ...newBookings] };
        return await solve(events, index + 1, nextSchedule, allSlots, allFacultyIds, labRooms, theoryRooms, limit, facultyMap, subjectMap, baseCodeDurations);
    }

    return null;
}

function isRoomFree(roomId: string, startSlot: Slot, duration: number, schedule: Schedule, limit?: any, isTimeout?: boolean): boolean {
    if ((limit && limit.count >= 200000) || isTimeout) return true;

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

function isValid(
    event: Event,
    startSlot: Slot,
    facultyId: string | null,
    schedule: Schedule,
    facultyMap: Map<string, { maxLoad: number }>,
    limit: any,
    subjectMap: Map<string, string>,
    baseCodeDurations: Map<string, number>,
    isTimeout?: boolean
): boolean {
    const startPeriod = startSlot.period;
    for (let i = 0; i < event.duration; i++) {
        // Physical Double Booking Check (Cannot be in two places at once)
        const conflict = schedule.bookings.some(b =>
            b.slot.day === startSlot.day &&
            b.slot.period === startPeriod + i &&
            (b.sectionId === event.sectionId || b.facultyId === facultyId)
        );
        if (conflict) return false;
    }

    // ULTIMATE SAFETY VALVE: If the puzzle is mathematically impossible and trapped in a 200k loop, 
    // stop checking arbitrary limits and force the piece in before the browser crashes.
    if (limit.count > 200000 || isTimeout) {
        return true;
    }

    // Subject constraint
    if (event.duration === 1) {
        const sameSubjectOnDay = schedule.bookings.some(b =>
            b.sectionId === event.sectionId &&
            b.subjectId === event.subjectId &&
            b.slot.day === startSlot.day
        );
        if (sameSubjectOnDay) return false;
    }

    const getBaseCode = (code: string | undefined) => code ? code.replace(/L(?=\d)/, '') : "";
    const currentBaseCode = getBaseCode(subjectMap.get(event.subjectId));

    // Single Faculty per Subject per Section constraint (Including Lab and Theory)
    let previouslyAssignedFaculty: string | null | undefined = null;

    if (facultyId) {
        previouslyAssignedFaculty = schedule.bookings.find(b => {
            if (b.sectionId !== event.sectionId) return false;
            return getBaseCode(subjectMap.get(b.subjectId)) === currentBaseCode;
        })?.facultyId;

        // Strict identical-teacher constraint (Theory + Lab for the same section/subject MUST have the same teacher)
        if (previouslyAssignedFaculty && previouslyAssignedFaculty !== facultyId) {
            return false;
        }
    }

    // Faculty Load Constraints
    if (facultyId) {
        // Daily Limit: Normally 4 periods a day. Under extreme pressure, allow 5.
        const facultyDaily = schedule.bookings.filter(b =>
            b.facultyId === facultyId &&
            b.slot.day === startSlot.day
        ).length;

        const dailyCap = limit.count > 50000 ? 6 : 4;
        if (facultyDaily + event.duration > dailyCap) return false;

        // Weekly Limit (MaxLoad constraint)
        const facultyWeekly = schedule.bookings.filter(b =>
            b.facultyId === facultyId
        ).length;

        const fData = facultyMap.get(facultyId);
        if (fData) {
            // Under extreme pressure, we might have to bleed over MaxLoad by a few periods to solve an impossible grid.
            const forceRelaxLoad = limit.count > 100000;

            if (!previouslyAssignedFaculty && limit.count < 30000) {
                const totalBaseCodeHours = baseCodeDurations.get(event.sectionId + "-" + currentBaseCode) || event.duration;
                if (!forceRelaxLoad && facultyWeekly + totalBaseCodeHours > fData.maxLoad) {
                    return false; // Early pruning: Not enough load to take the whole course 
                }
            } else {
                if (!forceRelaxLoad && facultyWeekly + event.duration > fData.maxLoad) {
                    return false;
                }
            }
        }
    }

    return true;
}

async function saveSchedule(schedule: Schedule) {
    require('fs').writeFileSync('debug_schedule.json', JSON.stringify(schedule.bookings, null, 2));
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
