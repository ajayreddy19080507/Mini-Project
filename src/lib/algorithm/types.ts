export type Day = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
export const DAYS: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export interface Slot {
    day: Day;
    period: number; // 1 to 7
}

export interface Booking {
    sectionId: string;
    facultyId: string | null;
    subjectId: string;
    roomId: string | null;
    slot: Slot;
}

export interface Schedule {
    bookings: Booking[];
}

export interface ConstraintViolation {
    type: 'HARD' | 'SOFT';
    message: string;
    weight: number;
}
