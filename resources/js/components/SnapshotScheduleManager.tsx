import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Pause,
    Play,
    Plus,
    RefreshCw,
    Settings2,
    Trash2,
    Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

// ─── Types ──────────────────────────────────────────────────────────

interface Store {
    id: number;
    store_number: string;
    store_name: string;
    is_active: boolean;
}

interface Schedule {
    id: number;
    store_id: number;
    is_active: boolean;
    interval_minutes: number;
    last_run_at: string | null;
    next_run_at: string | null;
    total_runs: number;
    consecutive_failures: number;
    last_error: string | null;
    store: Store | null;
}

interface Props {
    stores: { id: number; store_number: string; store_name: string; sensors_count: number }[];
}

// ─── Interval Options ───────────────────────────────────────────────

const INTERVAL_OPTIONS = [
    { value: 5, label: 'Every 5 minutes' },
    { value: 10, label: 'Every 10 minutes' },
    { value: 15, label: 'Every 15 minutes' },
    { value: 30, label: 'Every 30 minutes' },
    { value: 60, label: 'Every 1 hour' },
    { value: 120, label: 'Every 2 hours' },
    { value: 180, label: 'Every 3 hours' },
    { value: 360, label: 'Every 6 hours' },
    { value: 720, label: 'Every 12 hours' },
    { value: 1440, label: 'Every 24 hours' },
];

function intervalLabel(minutes: number): string {
    const opt = INTERVAL_OPTIONS.find((o) => o.value === minutes);
    if (opt) return opt.label;
    if (minutes < 60) return `Every ${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `Every ${h}h ${m}m` : `Every ${h}h`;
}

function timeAgo(iso: string | null): string {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function timeUntil(iso: string | null): string {
    if (!iso) return '—';
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return 'Now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hours = Math.floor(mins / 60);
    return `in ${hours}h ${mins % 60}m`;
}

// ─── CSRF Helper ────────────────────────────────────────────────────

function getCsrfCookie(): string {
    const name = 'XSRF-TOKEN';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop()?.split(';').shift() ?? '');
    }
    return '';
}

async function apiRequest(url: string, options: RequestInit = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': getCsrfCookie(),
            ...(options.headers || {}),
        },
        credentials: 'include',
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || body?.error || `Request failed (${res.status})`);
    }

    return res.json();
}

// ─── Main Component ─────────────────────────────────────────────────

export function SnapshotScheduleManager({ stores }: Props) {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // New schedule form state
    const [showForm, setShowForm] = useState(false);
    const [formStoreId, setFormStoreId] = useState<string>('');
    const [formInterval, setFormInterval] = useState<string>('60');
    const [formSaving, setFormSaving] = useState(false);

    // Edit mode
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editInterval, setEditInterval] = useState<string>('60');

    const fetchSchedules = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiRequest('/api/reports/schedules');
            if (data.success) {
                setSchedules(data.schedules);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load schedules');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    // Stores without schedules (for the "add" form)
    const scheduledStoreIds = new Set(schedules.map((s) => s.store_id));
    const availableStores = stores.filter((s) => !scheduledStoreIds.has(s.id));

    const handleCreate = async () => {
        if (!formStoreId || !formInterval) return;
        setFormSaving(true);
        setError(null);

        try {
            await apiRequest('/api/reports/schedules', {
                method: 'POST',
                body: JSON.stringify({
                    store_id: Number(formStoreId),
                    is_active: true,
                    interval_minutes: Number(formInterval),
                }),
            });
            setShowForm(false);
            setFormStoreId('');
            setFormInterval('60');
            await fetchSchedules();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create schedule');
        } finally {
            setFormSaving(false);
        }
    };

    const handleToggle = async (schedule: Schedule) => {
        setActionLoading(schedule.id);
        setError(null);
        try {
            await apiRequest(`/api/reports/schedules/${schedule.id}/toggle`, {
                method: 'PATCH',
            });
            await fetchSchedules();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle schedule');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (schedule: Schedule) => {
        if (!confirm(`Remove schedule for "${schedule.store?.store_name}"?`)) return;
        setActionLoading(schedule.id);
        setError(null);
        try {
            await apiRequest(`/api/reports/schedules/${schedule.id}`, {
                method: 'DELETE',
            });
            await fetchSchedules();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete schedule');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRunNow = async (schedule: Schedule) => {
        setActionLoading(schedule.id);
        setError(null);
        try {
            const data = await apiRequest(`/api/reports/schedules/${schedule.id}/run-now`, {
                method: 'POST',
            });
            if (data.success) {
                await fetchSchedules();
            } else {
                setError(data.error || 'Run failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Run failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateInterval = async (schedule: Schedule) => {
        setActionLoading(schedule.id);
        setError(null);
        try {
            await apiRequest('/api/reports/schedules', {
                method: 'POST',
                body: JSON.stringify({
                    store_id: schedule.store_id,
                    is_active: schedule.is_active,
                    interval_minutes: Number(editInterval),
                }),
            });
            setEditingId(null);
            await fetchSchedules();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Settings2 className="size-5" />
                            Automated Snapshot Schedules
                        </CardTitle>
                        <CardDescription>
                            Configure automatic sensor data capture intervals for each store.
                            The scheduler runs via cron and captures snapshots at the configured frequency.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={fetchSchedules} disabled={loading}>
                            {loading ? <Spinner className="size-3.5" /> : <RefreshCw className="size-3.5" />}
                        </Button>
                        {availableStores.length > 0 && (
                            <Button size="sm" onClick={() => setShowForm(!showForm)}>
                                <Plus className="size-3.5" />
                                Add Schedule
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
                        <AlertTriangle className="size-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Add Form */}
                {showForm && (
                    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Store</label>
                            <Select value={formStoreId} onValueChange={setFormStoreId}>
                                <SelectTrigger className="w-52">
                                    <SelectValue placeholder="Select store" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableStores.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.store_name} ({s.store_number})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Interval</label>
                            <Select value={formInterval} onValueChange={setFormInterval}>
                                <SelectTrigger className="w-44">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {INTERVAL_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={String(opt.value)}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button size="sm" onClick={handleCreate} disabled={!formStoreId || formSaving}>
                            {formSaving ? <Spinner className="size-3.5" /> : <Plus className="size-3.5" />}
                            Create
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                            Cancel
                        </Button>
                    </div>
                )}

                {/* Loading */}
                {loading && schedules.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                        <Spinner className="size-6" />
                    </div>
                )}

                {/* Empty */}
                {!loading && schedules.length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <Clock className="text-muted-foreground size-10 opacity-40" />
                        <div>
                            <p className="font-medium">No schedules configured</p>
                            <p className="text-muted-foreground text-sm">
                                Add a schedule to automatically capture sensor snapshots at regular intervals.
                            </p>
                        </div>
                    </div>
                )}

                {/* Schedule Cards */}
                {schedules.length > 0 && (
                    <div className="space-y-3">
                        {schedules.map((schedule) => (
                            <div
                                key={schedule.id}
                                className={`flex flex-wrap items-center gap-4 rounded-lg border p-4 transition-colors ${
                                    schedule.is_active
                                        ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20'
                                        : 'border-muted bg-muted/20'
                                }`}
                            >
                                {/* Store Info */}
                                <div className="min-w-40 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">
                                            {schedule.store?.store_name ?? 'Unknown Store'}
                                        </span>
                                        <Badge
                                            variant={schedule.is_active ? 'default' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {schedule.is_active ? 'Active' : 'Paused'}
                                        </Badge>
                                        {schedule.consecutive_failures > 0 && (
                                            <Badge variant="destructive" className="text-xs">
                                                {schedule.consecutive_failures} failures
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                                        {schedule.store?.store_number}
                                    </p>
                                </div>

                                {/* Interval */}
                                <div className="text-center">
                                    {editingId === schedule.id ? (
                                        <div className="flex items-center gap-2">
                                            <Select value={editInterval} onValueChange={setEditInterval}>
                                                <SelectTrigger className="h-8 w-40 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {INTERVAL_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={String(opt.value)}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => handleUpdateInterval(schedule)}
                                                disabled={actionLoading === schedule.id}
                                            >
                                                {actionLoading === schedule.id ? (
                                                    <Spinner className="size-3" />
                                                ) : (
                                                    <CheckCircle2 className="size-3" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => setEditingId(null)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <button
                                            className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors"
                                            onClick={() => {
                                                setEditingId(schedule.id);
                                                setEditInterval(String(schedule.interval_minutes));
                                            }}
                                            title="Click to change interval"
                                        >
                                            <Clock className="mr-1 inline size-3.5" />
                                            {intervalLabel(schedule.interval_minutes)}
                                        </button>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="flex gap-4 text-xs">
                                    <div className="text-center">
                                        <p className="text-muted-foreground">Last Run</p>
                                        <p className="font-medium">{timeAgo(schedule.last_run_at)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-muted-foreground">Next Run</p>
                                        <p className="font-medium">
                                            {schedule.is_active ? timeUntil(schedule.next_run_at) : '—'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-muted-foreground">Total Runs</p>
                                        <p className="font-medium">{schedule.total_runs}</p>
                                    </div>
                                </div>

                                {/* Last Error */}
                                {schedule.last_error && (
                                    <div className="w-full">
                                        <p className="mt-1 truncate text-xs text-red-600 dark:text-red-400" title={schedule.last_error}>
                                            <AlertTriangle className="mr-1 inline size-3" />
                                            {schedule.last_error}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="ml-auto flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => handleRunNow(schedule)}
                                        disabled={actionLoading === schedule.id}
                                        title="Run snapshot now"
                                    >
                                        {actionLoading === schedule.id ? (
                                            <Spinner className="size-3.5" />
                                        ) : (
                                            <Zap className="size-3.5" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8"
                                        onClick={() => handleToggle(schedule)}
                                        disabled={actionLoading === schedule.id}
                                        title={schedule.is_active ? 'Pause schedule' : 'Resume schedule'}
                                    >
                                        {schedule.is_active ? (
                                            <Pause className="size-3.5" />
                                        ) : (
                                            <Play className="size-3.5" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-red-500 hover:text-red-600"
                                        onClick={() => handleDelete(schedule)}
                                        disabled={actionLoading === schedule.id}
                                        title="Remove schedule"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer hint */}
                {schedules.length > 0 && (
                    <p className="text-muted-foreground text-center text-xs">
                        The scheduler requires a cron job running{' '}
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">php artisan schedule:run</code>{' '}
                        every minute on your server.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
