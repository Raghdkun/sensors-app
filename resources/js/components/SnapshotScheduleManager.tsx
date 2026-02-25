import {
    AlertTriangle,
    CheckCircle2,
    Layers,
    Pause,
    Play,
    RefreshCw,
    Settings2,
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

interface Schedule {
    id: number;
    is_active: boolean;
    interval_minutes: number;
    last_run_at: string | null;
    next_run_at: string | null;
    total_runs: number;
    consecutive_failures: number;
    last_error: string | null;
}

// ─── Interval Options ───────────────────────────────────────────────

const INTERVAL_OPTIONS = [
    { value: 5,    label: 'Every 5 minutes' },
    { value: 10,   label: 'Every 10 minutes' },
    { value: 15,   label: 'Every 15 minutes' },
    { value: 30,   label: 'Every 30 minutes' },
    { value: 60,   label: 'Every 1 hour' },
    { value: 120,  label: 'Every 2 hours' },
    { value: 180,  label: 'Every 3 hours' },
    { value: 360,  label: 'Every 6 hours' },
    { value: 720,  label: 'Every 12 hours' },
    { value: 1440, label: 'Every 24 hours' },
];

function timeAgo(iso: string | null): string {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function timeUntil(iso: string | null): string {
    if (!iso) return '—';
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return 'Now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const h = Math.floor(mins / 60);
    return `in ${h}h ${mins % 60}m`;
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

export function SnapshotScheduleManager() {
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [activeStores, setActiveStores] = useState(0);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [running, setRunning]     = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const [success, setSuccess]     = useState<string | null>(null);

    // Local edit state
    const [editInterval, setEditInterval] = useState('60');
    const [dirty, setDirty]               = useState(false);

    const fetchSchedule = useCallback(async () => {
        try {
            setLoading(true);
            const data = await apiRequest('/api/reports/schedules');
            if (data.success) {
                setSchedule(data.schedule);
                setActiveStores(data.active_stores);
                setEditInterval(String(data.schedule.interval_minutes));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load schedule');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const flash = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 3500);
    };

    const handleToggle = async () => {
        setSaving(true);
        setError(null);
        try {
            const data = await apiRequest('/api/reports/schedules/toggle', { method: 'PATCH' });
            if (data.success) {
                setSchedule(data.schedule);
                setEditInterval(String(data.schedule.interval_minutes));
                flash(data.schedule.is_active ? 'Schedule activated.' : 'Schedule paused.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle schedule');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveInterval = async () => {
        if (!schedule) return;
        setSaving(true);
        setError(null);
        try {
            const data = await apiRequest('/api/reports/schedules', {
                method: 'POST',
                body: JSON.stringify({
                    is_active: schedule.is_active,
                    interval_minutes: Number(editInterval),
                }),
            });
            if (data.success) {
                setSchedule(data.schedule);
                setDirty(false);
                flash('Interval updated.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleRunNow = async () => {
        setRunning(true);
        setError(null);
        try {
            const data = await apiRequest('/api/reports/schedules/run-now', { method: 'POST' });
            if (data.success) {
                await fetchSchedule();
                flash(data.message || 'Snapshot captured.');
            } else {
                setError(data.error || 'Run failed.');
                await fetchSchedule();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Run failed');
        } finally {
            setRunning(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Settings2 className="size-5" />
                            Automated Snapshot Schedule
                        </CardTitle>
                        <CardDescription>
                            One global schedule that captures sensor data from{' '}
                            <span className="font-medium text-foreground">
                                all {activeStores} active store{activeStores !== 1 ? 's' : ''}
                            </span>{' '}
                            simultaneously at the configured interval.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchSchedule} disabled={loading}>
                        {loading ? <Spinner className="size-3.5" /> : <RefreshCw className="size-3.5" />}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Feedback banners */}
                {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
                        <AlertTriangle className="size-4 shrink-0" />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <CheckCircle2 className="size-4 shrink-0" />
                        {success}
                    </div>
                )}

                {loading && !schedule && (
                    <div className="flex justify-center py-8">
                        <Spinner className="size-6" />
                    </div>
                )}

                {schedule && (
                    <div className={`rounded-xl border p-5 transition-colors ${
                        schedule.is_active
                            ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20'
                            : 'border-muted bg-muted/20'
                    }`}>
                        {/* Top row: status + toggle + run-now */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={schedule.is_active ? 'default' : 'secondary'}
                                    className="text-sm px-3 py-1"
                                >
                                    {schedule.is_active ? '● Active' : '○ Paused'}
                                </Badge>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Layers className="size-3.5" />
                                    {activeStores} store{activeStores !== 1 ? 's' : ''}
                                </div>
                            </div>

                            <div className="ml-auto flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRunNow}
                                    disabled={running || saving || activeStores === 0}
                                    title="Capture a snapshot for all stores right now"
                                >
                                    {running ? (
                                        <><Spinner className="size-3.5" /> Running…</>
                                    ) : (
                                        <><Zap className="size-3.5" /> Run Now</>
                                    )}
                                </Button>
                                <Button
                                    variant={schedule.is_active ? 'secondary' : 'default'}
                                    size="sm"
                                    onClick={handleToggle}
                                    disabled={saving || running}
                                >
                                    {saving ? (
                                        <Spinner className="size-3.5" />
                                    ) : schedule.is_active ? (
                                        <><Pause className="size-3.5" /> Pause</>
                                    ) : (
                                        <><Play className="size-3.5" /> Activate</>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Interval selector */}
                        <div className="mt-4 flex flex-wrap items-end gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Capture Interval
                                </label>
                                <Select
                                    value={editInterval}
                                    onValueChange={(v) => {
                                        setEditInterval(v);
                                        setDirty(v !== String(schedule.interval_minutes));
                                    }}
                                >
                                    <SelectTrigger className="w-48">
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
                            {dirty && (
                                <Button size="sm" onClick={handleSaveInterval} disabled={saving}>
                                    {saving ? <Spinner className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                                    Save
                                </Button>
                            )}
                        </div>

                        {/* Stats row */}
                        <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Last Run</p>
                                <p className="mt-0.5 font-semibold">{timeAgo(schedule.last_run_at)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Next Run</p>
                                <p className="mt-0.5 font-semibold">
                                    {schedule.is_active ? timeUntil(schedule.next_run_at) : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total Runs</p>
                                <p className="mt-0.5 font-semibold">{schedule.total_runs}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Consecutive Failures</p>
                                <p className={`mt-0.5 font-semibold ${schedule.consecutive_failures > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                                    {schedule.consecutive_failures > 0 ? schedule.consecutive_failures : '—'}
                                </p>
                            </div>
                        </div>

                        {/* Last error */}
                        {schedule.last_error && (
                            <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
                                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                                <span>{schedule.last_error}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer hint */}
                <p className="text-center text-xs text-muted-foreground">
                    Requires{' '}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        php artisan schedule:run
                    </code>{' '}
                    running every minute via cron.
                </p>
            </CardContent>
        </Card>
    );
}
