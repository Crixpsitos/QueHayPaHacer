export interface DaySchedule {
    open: string;
    close: string;
    closed: boolean;
}

export class Schedule {
    constructor(
        public readonly monday: DaySchedule,
        public readonly tuesday: DaySchedule,
        public readonly wednesday: DaySchedule,
        public readonly thursday: DaySchedule,
        public readonly friday: DaySchedule,
        public readonly saturday: DaySchedule,
        public readonly sunday: DaySchedule,
    ) {}
}