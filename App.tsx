import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Calendar, ClipboardCheck, Settings, History, ChevronRight, Camera, AlertCircle, Trash2, Plus, Save, Upload, Download, Menu } from 'lucide-react';
import { AppState, CheckItem, DailyCheckResult, DayRecord, HealthRecord, RecordResult } from './types';
import { DEFAULT_CHECKLIST } from './constants';
import { compressImage, exportBackupJSON, exportDataToExcel, getFormattedDate, importBackupJSON } from './utils';

// --- Components Definition within App.tsx for single-file structure simplicity requested ---

// 1. Reusable UI Components
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
    const baseStyle = "flex items-center justify-center px-4 py-3 rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm";
    const variants: any = {
        primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200",
        secondary: "bg-white text-emerald-700 border-2 border-emerald-100 hover:bg-emerald-50",
        danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
        ghost: "bg-transparent text-gray-500 hover:bg-gray-100 shadow-none"
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

const Card = ({ children, className = '', onClick }: any) => (
    <div onClick={onClick} className={`bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 ${className}`}>
        {children}
    </div>
);

// 2. Main Logic
const STORAGE_KEY = 'haccp_pro_v1';

export default function App() {
    // State
    const [activeTab, setActiveTab] = useState<'check' | 'health' | 'history' | 'settings'>('check');
    const [currentDate, setCurrentDate] = useState(getFormattedDate().iso);
    
    const [config, setConfig] = useState<CheckItem[]>(DEFAULT_CHECKLIST);
    const [records, setRecords] = useState<Record<string, DayRecord>>({});
    
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

    // Load Data
    useEffect(() => {
        const load = async () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.config) setConfig(parsed.config);
                    if (parsed.records) setRecords(parsed.records);
                }
            } catch (e) {
                console.error("Failed to load data", e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Save Data (Debounced/Async to prevent freezing)
    useEffect(() => {
        if (isLoading) return;
        const timer = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, records }));
            } catch (e) {
                showToast('保存容量が不足しています。古いデータを削除してください。', 'error');
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [config, records, isLoading]);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Helpers
    const getRecordForDate = (date: string): DayRecord => {
        if (records[date]) return records[date];
        return {
            date,
            checks: [],
            health: { temp: '', symptom: 'なし', wound: 'なし' },
            lastUpdated: new Date().toISOString()
        };
    };

    const updateRecord = (date: string, updater: (prev: DayRecord) => DayRecord) => {
        setRecords(prev => {
            const current = prev[date] || getRecordForDate(date);
            const updated = updater({ ...current }); // shallow copy
            updated.lastUpdated = new Date().toISOString();
            return { ...prev, [date]: updated };
        });
    };

    // Views
    const renderContent = () => {
        const todayRecord = getRecordForDate(currentDate);

        switch (activeTab) {
            case 'check':
                return <CheckListView 
                    config={config} 
                    record={todayRecord} 
                    onUpdate={(newRecord) => updateRecord(currentDate, () => newRecord)} 
                    showToast={showToast}
                />;
            case 'health':
                return <HealthView 
                    record={todayRecord}
                    onUpdate={(newRecord) => updateRecord(currentDate, () => newRecord)}
                    showToast={showToast}
                />;
            case 'history':
                return <HistoryView records={records} onSelectDate={(d) => { setCurrentDate(d); setActiveTab('check'); }} />;
            case 'settings':
                return <SettingsView 
                    config={config} 
                    setConfig={setConfig} 
                    records={records}
                    setRecords={setRecords}
                    showToast={showToast} 
                />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 max-w-md mx-auto relative shadow-2xl">
            {/* Header */}
            <header className="bg-emerald-600 text-white sticky top-0 z-30 px-4 py-3 shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-lg font-bold tracking-wider flex items-center gap-2">
                            <ClipboardCheck size={20} />
                            HACCP Pro
                        </h1>
                        <p className="text-emerald-100 text-xs font-mono opacity-90">中華料理版 v1.0</p>
                    </div>
                    <input 
                        type="date" 
                        value={currentDate}
                        onChange={(e) => setCurrentDate(e.target.value)}
                        className="bg-emerald-700/50 border border-emerald-500 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-white/50"
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 animate-fade-in">
                {isLoading ? (
                    <div className="flex justify-center py-20 text-gray-400">Loading...</div>
                ) : renderContent()}
            </main>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-11/12 max-w-sm p-4 rounded-xl text-white text-center shadow-2xl z-50 flex items-center justify-center gap-2 animate-slide-up ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}>
                    {toast.type === 'error' ? <AlertCircle size={18}/> : <ClipboardCheck size={18}/>}
                    <span className="text-sm font-bold">{toast.msg}</span>
                </div>
            )}

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 flex justify-around py-2 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <NavButton icon={<ClipboardCheck />} label="衛生" active={activeTab === 'check'} onClick={() => setActiveTab('check')} />
                <NavButton icon={<Activity />} label="体調" active={activeTab === 'health'} onClick={() => setActiveTab('health')} />
                <NavButton icon={<History />} label="履歴" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                <NavButton icon={<Settings />} label="設定" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </nav>
        </div>
    );
}

const NavButton = ({ icon, label, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full py-1 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
    >
        <div className={`mb-1 transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
            {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
        </div>
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);

// --- Sub Views ---

const CheckListView = ({ config, record, onUpdate, showToast }: any) => {
    const [modalItem, setModalItem] = useState<CheckItem | null>(null);

    // Calculate Progress
    const completedCount = config.filter((item: CheckItem) => {
        const res = record.checks.find((r: DailyCheckResult) => r.itemId === item.id);
        return res && res.result;
    }).length;
    const progress = Math.round((completedCount / config.length) * 100);

    const handleCheck = (item: CheckItem) => {
        setModalItem(item);
    };

    const saveCheck = (result: DailyCheckResult) => {
        const newChecks = record.checks.filter((c: DailyCheckResult) => c.itemId !== result.itemId);
        newChecks.push(result);
        onUpdate({ ...record, checks: newChecks });
        setModalItem(null);
        showToast('記録しました');
    };

    // Group by category
    const categories = Array.from(new Set(config.map((c: CheckItem) => c.category)));

    return (
        <div className="space-y-6">
            {/* Progress Card */}
            <Card className="bg-gradient-to-br from-emerald-50 to-white !border-emerald-100">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-emerald-900 font-bold">進捗状況</span>
                    <span className="text-emerald-600 font-mono font-bold text-2xl">{progress}%</span>
                </div>
                <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                </div>
            </Card>

            {/* List */}
            <div className="space-y-6">
                {categories.map((cat: any) => (
                    <div key={cat}>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">{cat}</h3>
                        <div className="space-y-3">
                            {config.filter((c: CheckItem) => c.category === cat).sort((a: CheckItem, b: CheckItem) => a.displayOrder - b.displayOrder).map((item: CheckItem) => {
                                const check = record.checks.find((c: DailyCheckResult) => c.itemId === item.id);
                                const status = check?.result;
                                
                                return (
                                    <div 
                                        key={item.id}
                                        onClick={() => handleCheck(item)}
                                        className={`bg-white p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99] 
                                            ${status === 'YES' ? 'border-l-4 border-l-emerald-500 shadow-sm' : 
                                              status === 'NO' ? 'border-l-4 border-l-red-500 bg-red-50/30' : 'border-l-4 border-l-gray-200'}`}
                                    >
                                        <div className="flex-1 pr-4">
                                            <p className="text-sm font-medium text-gray-800 leading-snug">{item.text}</p>
                                            {(check?.value || check?.comment || check?.photo) && (
                                                <div className="mt-2 flex gap-2 text-xs text-gray-500">
                                                    {check.value && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono">{check.value}{item.unit}</span>}
                                                    {check.photo && <span className="flex items-center gap-0.5 text-blue-500"><Camera size={12}/>写真</span>}
                                                    {check.comment && <span className="truncate max-w-[120px]">📝 {check.comment}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div className="shrink-0">
                                            {status === 'YES' ? <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">OK</div> :
                                             status === 'NO' ? <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">NG</div> :
                                             <ChevronRight className="text-gray-300 group-hover:text-gray-400" size={20} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {modalItem && (
                <CheckModal 
                    item={modalItem} 
                    currentResult={record.checks.find((c: DailyCheckResult) => c.itemId === modalItem.id)} 
                    onClose={() => setModalItem(null)} 
                    onSave={saveCheck} 
                />
            )}
        </div>
    );
};

const HealthView = ({ record, onUpdate, showToast }: any) => {
    const handleChange = (field: keyof HealthRecord, value: any) => {
        const newHealth = { ...record.health, [field]: value };
        onUpdate({ ...record, health: newHealth });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Activity className="text-emerald-500" />
                    スタッフの体調記録
                </h2>

                <div className="space-y-6">
                    {/* Temperature */}
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">体温 (℃)</label>
                        <input 
                            type="number" 
                            placeholder="36.5" 
                            step="0.1"
                            value={record.health.temp || ''}
                            onChange={(e) => handleChange('temp', e.target.value)}
                            className="w-full p-4 text-2xl font-mono text-center border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    {/* Symptoms */}
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">下痢・嘔吐・発熱</label>
                        <div className="grid grid-cols-2 gap-3">
                            <SelectBtn 
                                active={record.health.symptom === 'なし'} 
                                onClick={() => handleChange('symptom', 'なし')}
                                type="good"
                            >なし (良好)</SelectBtn>
                            <SelectBtn 
                                active={record.health.symptom === 'あり'} 
                                onClick={() => handleChange('symptom', 'あり')}
                                type="bad"
                            >あり (不良)</SelectBtn>
                        </div>
                    </div>

                    {/* Wounds */}
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">手指の傷</label>
                        <div className="grid grid-cols-2 gap-3">
                            <SelectBtn 
                                active={record.health.wound === 'なし'} 
                                onClick={() => handleChange('wound', 'なし')}
                                type="good"
                            >なし</SelectBtn>
                            <SelectBtn 
                                active={record.health.wound === 'あり'} 
                                onClick={() => handleChange('wound', 'あり')}
                                type="bad"
                            >あり</SelectBtn>
                        </div>
                    </div>

                    {/* Details */}
                    {(record.health.symptom === 'あり' || record.health.wound === 'あり') && (
                        <div className="animate-fade-in">
                            <label className="block text-sm font-bold text-gray-600 mb-2">症状・処置の詳細</label>
                            <textarea 
                                rows={3}
                                value={record.health.details || ''}
                                onChange={(e) => handleChange('details', e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                placeholder="具体的な症状や、業務制限の有無などを記入してください"
                            />
                        </div>
                    )}
                </div>
            </div>
            
            <Button className="w-full" onClick={() => showToast('体調を記録しました')}>
                記録を保存
            </Button>
        </div>
    );
};

const HistoryView = ({ records, onSelectDate }: any) => {
    const sortedDates = Object.keys(records).sort((a, b) => b.localeCompare(a));

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 px-2">記録履歴</h2>
            {sortedDates.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <History size={48} className="mx-auto mb-3 opacity-20" />
                    <p>まだ記録がありません</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedDates.map(date => {
                        const rec = records[date];
                        const checkCount = rec.checks.filter((c: any) => c.result).length;
                        const isTempOk = !!rec.health.temp;
                        
                        return (
                            <div 
                                key={date} 
                                onClick={() => onSelectDate(date)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between active:bg-gray-50 transition"
                            >
                                <div>
                                    <div className="font-bold text-gray-800">{getFormattedDate(date).display}</div>
                                    <div className="text-xs text-gray-500 mt-1 flex gap-3">
                                        <span className={checkCount > 0 ? 'text-emerald-600' : 'text-gray-400'}>
                                            チェック: {checkCount}項目
                                        </span>
                                        <span className={isTempOk ? 'text-blue-600' : 'text-gray-400'}>
                                            体温: {rec.health.temp || '-'}℃
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-300" />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const SettingsView = ({ config, setConfig, records, setRecords, showToast }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    
    const handleAddItem = () => {
        const newItem: CheckItem = {
            id: `custom_${Date.now()}`,
            category: 'その他',
            text: '新しいチェック項目',
            type: 'boolean',
            displayOrder: config.length + 1
        };
        setConfig([...config, newItem]);
        showToast('項目を追加しました', 'success');
    };

    const handleDeleteItem = (id: string) => {
        if(window.confirm('この項目を削除しますか？')) {
            setConfig(config.filter((c: CheckItem) => c.id !== id));
        }
    };

    const handleExcelExport = async () => {
        try {
            showToast('Excelを作成中...', 'success');
            // Wait a tick to let UI render
            await new Promise(r => setTimeout(r, 100));
            await exportDataToExcel(records, config);
            showToast('ダウンロードを開始しました', 'success');
        } catch (e) {
            console.error(e);
            showToast('Excel出力に失敗しました', 'error');
        }
    };

    const handleBackup = () => {
        exportBackupJSON({ config, records });
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        try {
            const data: any = await importBackupJSON(file);
            if(data.config && data.records) {
                if(window.confirm('現在のデータを上書きして復元しますか？この操作は取り消せません。')) {
                    setConfig(data.config);
                    setRecords(data.records);
                    showToast('復元しました', 'success');
                }
            } else {
                showToast('無効なバックアップファイルです', 'error');
            }
        } catch(err) {
            showToast('読み込みに失敗しました', 'error');
        }
        e.target.value = ''; // Reset input
    };

    return (
        <div className="space-y-8 pb-10">
            
            <section>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Settings size={18} />
                    チェック項目の編集
                </h3>
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="max-h-60 overflow-y-auto no-scrollbar">
                        {config.map((item: CheckItem, idx: number) => (
                            <div key={item.id} className="p-3 border-b last:border-none flex gap-3 items-center">
                                <span className="text-xs font-mono text-gray-300 w-6 text-center">{idx+1}</span>
                                <input 
                                    className="flex-1 text-sm border-none outline-none bg-transparent"
                                    value={item.text}
                                    onChange={(e) => {
                                        const newConfig = [...config];
                                        newConfig[idx].text = e.target.value;
                                        setConfig(newConfig);
                                    }}
                                />
                                <button onClick={() => handleDeleteItem(item.id)} className="text-gray-300 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddItem} className="w-full py-3 text-sm text-emerald-600 font-bold hover:bg-emerald-50 flex items-center justify-center gap-2">
                        <Plus size={16} /> 項目を追加
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">テキストをタップして直接編集できます</p>
            </section>

            <section>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Download size={18} />
                    データ管理
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="primary" onClick={handleExcelExport} className="flex flex-col gap-1 py-4 h-auto">
                        <Download size={24} />
                        <span className="text-xs">Excel出力</span>
                    </Button>
                    <label className="cursor-pointer">
                        <div className="bg-white text-emerald-700 border-2 border-emerald-100 hover:bg-emerald-50 flex flex-col items-center justify-center px-4 py-4 rounded-xl font-bold h-full transition-all active:scale-95 shadow-sm gap-1">
                            <Upload size={24} />
                            <span className="text-xs">復元 (Import)</span>
                        </div>
                        <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
                    </label>
                    <Button variant="secondary" onClick={handleBackup} className="col-span-2 flex gap-2">
                        <Save size={18} />
                        <span className="text-sm">バックアップを保存 (JSON)</span>
                    </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Excel出力は数秒かかる場合があります</p>
            </section>
        </div>
    );
};

// --- Helper UI ---

const SelectBtn = ({ active, onClick, children, type }: any) => {
    const base = "py-3 rounded-lg text-sm font-bold border transition-all duration-200 active:scale-95";
    let style = "bg-white text-gray-500 border-gray-200 hover:bg-gray-50";
    
    if (active) {
        if (type === 'good') style = "bg-emerald-100 text-emerald-700 border-emerald-500";
        if (type === 'bad') style = "bg-red-100 text-red-700 border-red-500";
    }

    return <button onClick={onClick} className={`${base} ${style}`}>{children}</button>;
};

const CheckModal = ({ item, currentResult, onClose, onSave }: any) => {
    const [result, setResult] = useState<RecordResult | null>(currentResult?.result || null);
    const [value, setValue] = useState(currentResult?.value || '');
    const [comment, setComment] = useState(currentResult?.comment || '');
    const [photo, setPhoto] = useState(currentResult?.photo || null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSave = () => {
        if (!result) return;
        const res: DailyCheckResult = {
            itemId: item.id,
            result,
            value: item.type === 'record' ? value : undefined,
            comment,
            photo
        };
        onSave(res);
    };

    const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessing(true);
            try {
                const compressed = await compressImage(file);
                setPhoto(compressed);
            } catch(err) {
                alert('画像の処理に失敗しました');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 truncate pr-4">{item.text}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><span className="text-2xl">&times;</span></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Result Toggle */}
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setResult(RecordResult.YES)}
                            className={`flex-1 py-4 rounded-xl border-2 font-bold text-lg flex items-center justify-center gap-2 transition-all ${result === 'YES' ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'border-gray-200 text-gray-400'}`}
                        >
                            良 (OK)
                        </button>
                        <button 
                            onClick={() => setResult(RecordResult.NO)}
                            className={`flex-1 py-4 rounded-xl border-2 font-bold text-lg flex items-center justify-center gap-2 transition-all ${result === 'NO' ? 'bg-red-100 border-red-500 text-red-700' : 'border-gray-200 text-gray-400'}`}
                        >
                            否 (NG)
                        </button>
                    </div>

                    {/* Numeric Input */}
                    {item.type === 'record' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">測定値 ({item.unit})</label>
                            <input 
                                type="number" 
                                className="w-full p-3 text-right text-xl font-mono border border-gray-300 rounded-lg outline-none focus:border-emerald-500"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="0.0"
                            />
                        </div>
                    )}

                    {/* Photo & Comment */}
                    <div className="space-y-3">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-600 mb-2">
                                <Camera size={16} /> 写真 (任意)
                            </label>
                            {!photo ? (
                                <label className="block w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-center text-gray-400 cursor-pointer hover:bg-gray-50 hover:border-emerald-300 hover:text-emerald-500 transition">
                                    {isProcessing ? '処理中...' : 'タップして撮影'}
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                                </label>
                            ) : (
                                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                                    <img src={photo} alt="preview" className="w-full h-32 object-cover" />
                                    <button onClick={() => setPhoto(null)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md"><Trash2 size={14}/></button>
                                </div>
                            )}
                        </div>
                        <textarea 
                            placeholder="備考・メモ" 
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-emerald-500"
                            rows={2}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex gap-3">
                    <Button variant="ghost" className="flex-1" onClick={onClose}>キャンセル</Button>
                    <Button variant="primary" className="flex-[2]" onClick={handleSave} disabled={!result || isProcessing}>
                        決定
                    </Button>
                </div>
            </div>
        </div>
    );
};
