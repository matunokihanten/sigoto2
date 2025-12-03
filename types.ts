export enum RecordResult {
    YES = 'YES',
    NO = 'NO'
}

export interface CheckItem {
    id: string;
    category: string;
    text: string;
    type: 'boolean' | 'record';
    unit?: string;
    displayOrder: number;
}

export interface DailyCheckResult {
    itemId: string;
    result: RecordResult | null;
    value?: string; // For temperature/numeric records
    comment?: string;
    photo?: string; // Base64 string
}

export interface HealthRecord {
    temp: string;
    symptom: 'なし' | 'あり';
    wound: 'なし' | 'あり';
    details?: string;
}

export interface DayRecord {
    date: string; // YYYY-MM-DD
    checks: DailyCheckResult[];
    health: HealthRecord;
    lastUpdated: string;
}

export interface AppState {
    checklistConfig: CheckItem[];
    records: Record<string, DayRecord>; // Keyed by date
}
