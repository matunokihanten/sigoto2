import { CheckItem, DayRecord, RecordResult } from './types';

// Define the global XLSX type since we are loading it via script tag
declare global {
    interface Window {
        XLSX: any;
    }
}

/**
 * Compress an image file to a smaller Base64 string.
 * Helps prevent LocalStorage freezing by reducing data size.
 */
export const compressImage = (file: File, maxWidth = 800, quality = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const elem = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                elem.width = width;
                elem.height = height;
                const ctx = elem.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(elem.toDataURL('image/jpeg', quality));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const getFormattedDate = (dateStr?: string) => {
    const date = dateStr ? new Date(dateStr) : new Date();
    return {
        iso: date.toISOString().split('T')[0], // YYYY-MM-DD
        display: date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' })
    };
};

/**
 * Export data to Excel
 */
export const exportDataToExcel = async (records: Record<string, DayRecord>, checklistConfig: CheckItem[]) => {
    const XLSX = window.XLSX;
    if (!XLSX) throw new Error('Excel library not loaded');

    // 1. Flatten data for the sheet
    const rows = Object.values(records).sort((a, b) => b.date.localeCompare(a.date)).map(record => {
        const row: any = {
            '日付': record.date,
            'スタッフ体温': record.health.temp || '',
            'スタッフ症状': record.health.symptom,
            'スタッフ傷': record.health.wound,
            'スタッフ備考': record.health.details || '',
            '最終更新': new Date(record.lastUpdated).toLocaleString('ja-JP')
        };

        checklistConfig.forEach(item => {
            const check = record.checks.find(c => c.itemId === item.id);
            const resultKey = `[${item.category}] ${item.text}`;
            
            let valueStr = '';
            if (check?.result === RecordResult.YES) valueStr = '良';
            else if (check?.result === RecordResult.NO) valueStr = '否';
            
            if (check?.value) valueStr += ` (${check.value}${item.unit || ''})`;
            if (check?.comment) valueStr += ` [メモ: ${check.comment}]`;

            row[resultKey] = valueStr;
        });

        return row;
    });

    // 2. Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HACCP記録");

    // 3. Write File
    XLSX.writeFile(workbook, `HACCP_記録_${getFormattedDate().iso}.xlsx`);
};

/**
 * Import data from Excel (Simple Backup Restore)
 * Expects a JSON structure in a specific sheet or basic restore.
 * implementing a basic JSON dump restore for 100% fidelity
 */
export const exportBackupJSON = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haccp_backup_${getFormattedDate().iso}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export const importBackupJSON = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                resolve(json);
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsText(file);
    });
};
