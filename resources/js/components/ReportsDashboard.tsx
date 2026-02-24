import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    BarChart3,
    Calendar,
    Clock,
    Download,
    Droplets,
    RefreshCw,
    Thermometer,
    WifiOff,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

// ─── Types ──────────────────────────────────────────────────────────

interface Store {
    id: number;
    store_number: string;
    store_name: string;
    sensors_count: number;
}

interface TimeSeriesBucket {
    time_bucket: string;
    avg_temp: number | null;
    min_temp: number | null;
    max_temp: number | null;
    avg_humidity: number | null;
    min_humidity: number | null;
    max_humidity: number | null;
    reading_count: number;
}

interface DeviceSummary {
    device_id: string;
    device_name: string;
    avg_temp: number | null;
    min_temp: number | null;
    max_temp: number | null;
    avg_humidity: number | null;
    min_humidity: number | null;
    max_humidity: number | null;
    reading_count: number;
    alarm_count: number;
    offline_count: number;
}

interface Overall {
    avg_temp: number | null;
    min_temp: number | null;
    max_temp: number | null;
    avg_humidity: number | null;
    total_readings: number;
    total_alarms: number;
    total_offline: number;
}

interface ReportData {
    success: boolean;
    period: string;
    range: { from: string; to: string };
    overall: Overall;
    time_series: TimeSeriesBucket[];
    device_summary: DeviceSummary[];
}

type Period = 'daily' | 'weekly' | 'monthly';

interface Props {
    stores: Store[];
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatNum(value: number | null | undefined, decimals = 1): string {
    if (value == null) return '—';
    return Number(value).toFixed(decimals);
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function periodLabel(period: Period): string {
    return { daily: 'Today', weekly: 'This Week', monthly: 'This Month' }[period];
}

function tempColor(value: number | null): string {
    if (value == null) return 'text-muted-foreground';
    if (value <= 32) return 'text-blue-600 dark:text-blue-400';
    if (value <= 60) return 'text-teal-600 dark:text-teal-400';
    if (value <= 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
}

function humidityColor(value: number | null): string {
    if (value == null) return 'text-muted-foreground';
    if (value <= 30) return 'text-amber-600 dark:text-amber-400';
    if (value <= 60) return 'text-emerald-600 dark:text-emerald-400';
    return 'text-blue-600 dark:text-blue-400';
}

// ─── Sub-Components ─────────────────────────────────────────────────

function StatCard({
    label,
    value,
    subtitle,
    icon: Icon,
    colorClass,
}: {
    label: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    colorClass?: string;
}) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-muted-foreground text-sm font-medium">{label}</p>
                        <p className={`text-2xl font-bold ${colorClass ?? ''}`}>{value}</p>
                        {subtitle && (
                            <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
                        )}
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                        <Icon className="text-muted-foreground size-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function MiniBar({
    value,
    max,
    colorClass,
}: {
    value: number;
    max: number;
    colorClass: string;
}) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="bg-muted h-2 w-full rounded-full">
            <div
                className={`h-2 rounded-full ${colorClass}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

function TimeSeriesTable({ data }: { data: TimeSeriesBucket[] }) {
    if (data.length === 0) {
        return (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-sm">
                <BarChart3 className="size-8 opacity-40" />
                <p>No time-series data available for this period.</p>
                <p className="text-xs">Try capturing a snapshot first.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-muted-foreground border-b text-left text-xs">
                        <th className="px-3 py-2 font-medium">Time</th>
                        <th className="px-3 py-2 font-medium">Avg Temp</th>
                        <th className="px-3 py-2 font-medium">Min / Max</th>
                        <th className="px-3 py-2 font-medium">Avg Humidity</th>
                        <th className="px-3 py-2 font-medium">Min / Max</th>
                        <th className="px-3 py-2 font-medium text-right">Readings</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.time_bucket} className="hover:bg-muted/50 border-b transition-colors">
                            <td className="px-3 py-2 font-mono text-xs">{row.time_bucket}</td>
                            <td className={`px-3 py-2 font-semibold ${tempColor(row.avg_temp)}`}>
                                {formatNum(row.avg_temp)}°
                            </td>
                            <td className="text-muted-foreground px-3 py-2 text-xs">
                                <span className="text-blue-500">{formatNum(row.min_temp)}°</span>
                                {' / '}
                                <span className="text-red-500">{formatNum(row.max_temp)}°</span>
                            </td>
                            <td className={`px-3 py-2 font-semibold ${humidityColor(row.avg_humidity)}`}>
                                {formatNum(row.avg_humidity)}%
                            </td>
                            <td className="text-muted-foreground px-3 py-2 text-xs">
                                {formatNum(row.min_humidity)}% / {formatNum(row.max_humidity)}%
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-xs">
                                {row.reading_count}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function DeviceSummaryCards({ devices }: { devices: DeviceSummary[] }) {
    if (devices.length === 0) {
        return (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-sm">
                <Thermometer className="size-8 opacity-40" />
                <p>No device data available.</p>
            </div>
        );
    }

    const maxReadings = Math.max(...devices.map((d) => d.reading_count));

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
                <Card key={device.device_id} className="gap-3 py-4">
                    <CardHeader className="pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{device.device_name}</CardTitle>
                            <Badge variant="outline" className="text-xs font-mono">
                                {device.reading_count} readings
                            </Badge>
                        </div>
                        <CardDescription className="font-mono text-xs">{device.device_id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Temperature */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <Thermometer className="text-muted-foreground size-3.5" />
                                <span className="text-muted-foreground text-xs">Temperature</span>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className={`text-lg font-bold ${tempColor(device.avg_temp)}`}>
                                    {formatNum(device.avg_temp)}°
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    <ArrowDown className="inline size-3 text-blue-500" />
                                    {formatNum(device.min_temp)}°
                                    {' '}
                                    <ArrowUp className="inline size-3 text-red-500" />
                                    {formatNum(device.max_temp)}°
                                </span>
                            </div>
                        </div>

                        {/* Humidity */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <Droplets className="text-muted-foreground size-3.5" />
                                <span className="text-muted-foreground text-xs">Humidity</span>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className={`text-lg font-bold ${humidityColor(device.avg_humidity)}`}>
                                    {formatNum(device.avg_humidity)}%
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {formatNum(device.min_humidity)}% – {formatNum(device.max_humidity)}%
                                </span>
                            </div>
                        </div>

                        {/* Readings bar */}
                        <MiniBar
                            value={device.reading_count}
                            max={maxReadings}
                            colorClass="bg-primary"
                        />

                        {/* Alerts row */}
                        {(device.alarm_count > 0 || device.offline_count > 0) && (
                            <div className="flex gap-3 pt-1">
                                {device.alarm_count > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                        <AlertTriangle className="mr-1 size-3" />
                                        {device.alarm_count} alarms
                                    </Badge>
                                )}
                                {device.offline_count > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        <WifiOff className="mr-1 size-3" />
                                        {device.offline_count} offline
                                    </Badge>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────

export function ReportsDashboard({ stores }: Props) {
    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(
        stores.length > 0 ? stores[0].id : null,
    );
    const [period, setPeriod] = useState<Period>('daily');
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [snapshotting, setSnapshotting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetch, setLastFetch] = useState<Date | null>(null);

    const fetchReport = useCallback(async () => {
        if (!selectedStoreId) return;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                store_id: String(selectedStoreId),
                period,
            });

            const response = await fetch(`/api/reports/data?${params}`, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(
                    errorBody?.message || errorBody?.error || `Server error (${response.status})`,
                );
            }

            const data = await response.json();

            if (data.success) {
                setReportData(data);
                setLastFetch(new Date());
            } else {
                setError(data.error || 'Failed to load report data');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load report');
        } finally {
            setLoading(false);
        }
    }, [selectedStoreId, period]);

    const captureSnapshot = async () => {
        if (!selectedStoreId) return;

        setSnapshotting(true);
        setError(null);

        try {
            const response = await fetch('/api/reports/snapshot', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfCookie(),
                },
                credentials: 'include',
                body: JSON.stringify({ store_id: selectedStoreId }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(
                    errorBody?.message || errorBody?.error || `Snapshot failed (${response.status})`,
                );
            }

            const data = await response.json();

            if (data.success) {
                // Refresh report after snapshot
                await fetchReport();
            } else {
                setError(data.error || 'Snapshot failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Snapshot failed');
        } finally {
            setSnapshotting(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const selectedStore = stores.find((s) => s.id === selectedStoreId);

    if (stores.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12">
                    <BarChart3 className="text-muted-foreground size-12 opacity-40" />
                    <div className="text-center">
                        <h3 className="text-lg font-semibold">No Stores Found</h3>
                        <p className="text-muted-foreground text-sm">
                            Create a store and link devices to start generating reports.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Controls Bar ──────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Store selector */}
                <Select
                    value={String(selectedStoreId ?? '')}
                    onValueChange={(v) => setSelectedStoreId(Number(v))}
                >
                    <SelectTrigger className="w-55">
                        <SelectValue placeholder="Select a store" />
                    </SelectTrigger>
                    <SelectContent>
                        {stores.map((store) => (
                            <SelectItem key={store.id} value={String(store.id)}>
                                {store.store_name} ({store.store_number})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Period selector */}
                <div className="flex rounded-lg border">
                    {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                                period === p
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted text-muted-foreground'
                            } ${p === 'daily' ? 'rounded-l-lg' : ''} ${p === 'monthly' ? 'rounded-r-lg' : ''}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="ml-auto flex items-center gap-2">
                    {lastFetch && (
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Clock className="size-3" />
                            {lastFetch.toLocaleTimeString()}
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={captureSnapshot}
                        disabled={snapshotting || !selectedStoreId}
                    >
                        {snapshotting ? (
                            <>
                                <Spinner className="size-3.5" />
                                Capturing…
                            </>
                        ) : (
                            <>
                                <Download className="size-3.5" />
                                Capture Snapshot
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchReport}
                        disabled={loading || !selectedStoreId}
                    >
                        {loading ? (
                            <Spinner className="size-3.5" />
                        ) : (
                            <RefreshCw className="size-3.5" />
                        )}
                        Refresh
                    </Button>
                </div>
            </div>

            {/* ── Error Banner ──────────────────────────────────────── */}
            {error && (
                <Card className="border-destructive bg-destructive/5">
                    <CardContent className="flex items-center gap-3 py-4">
                        <AlertTriangle className="size-5 text-red-500" />
                        <div>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                            <p className="text-muted-foreground text-xs">
                                Try capturing a snapshot or check your YoSmart credentials.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Loading Skeleton ──────────────────────────────────── */}
            {loading && !reportData && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <Skeleton className="mb-2 h-4 w-24" />
                                <Skeleton className="mb-1 h-8 w-20" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Report Content ────────────────────────────────────── */}
            {reportData && (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">
                                {periodLabel(period)} Report
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {selectedStore?.store_name} •{' '}
                                {formatDate(reportData.range.from)} – {formatDate(reportData.range.to)}
                            </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                            <Calendar className="mr-1 size-3" />
                            {reportData.overall.total_readings} total readings
                        </Badge>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label="Avg Temperature"
                            value={`${formatNum(reportData.overall.avg_temp)}°`}
                            subtitle={`${formatNum(reportData.overall.min_temp)}° – ${formatNum(reportData.overall.max_temp)}°`}
                            icon={Thermometer}
                            colorClass={tempColor(reportData.overall.avg_temp)}
                        />
                        <StatCard
                            label="Avg Humidity"
                            value={`${formatNum(reportData.overall.avg_humidity)}%`}
                            icon={Droplets}
                            colorClass={humidityColor(reportData.overall.avg_humidity)}
                        />
                        <StatCard
                            label="Alarms"
                            value={String(reportData.overall.total_alarms ?? 0)}
                            subtitle={reportData.overall.total_alarms > 0 ? 'Events detected' : 'No alarms'}
                            icon={AlertTriangle}
                            colorClass={
                                reportData.overall.total_alarms > 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                            }
                        />
                        <StatCard
                            label="Offline Events"
                            value={String(reportData.overall.total_offline ?? 0)}
                            subtitle={reportData.overall.total_offline > 0 ? 'Connectivity issues' : 'All online'}
                            icon={WifiOff}
                            colorClass={
                                reportData.overall.total_offline > 0
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                            }
                        />
                    </div>

                    {/* Time-Series Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="size-5" />
                                Time Series — {periodLabel(period)}
                            </CardTitle>
                            <CardDescription>
                                Temperature and humidity aggregated by{' '}
                                {period === 'daily' ? 'hour' : 'day'}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TimeSeriesTable data={reportData.time_series} />
                        </CardContent>
                    </Card>

                    {/* Device Summary */}
                    <div>
                        <h3 className="mb-3 text-lg font-semibold">Per-Device Summary</h3>
                        <DeviceSummaryCards devices={reportData.device_summary} />
                    </div>
                </>
            )}

            {/* ── Empty State ───────────────────────────────────────── */}
            {!loading && !reportData && !error && (
                <Card>
                    <CardContent className="flex flex-col items-center gap-4 py-12">
                        <BarChart3 className="text-muted-foreground size-12 opacity-40" />
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">No Report Data Yet</h3>
                            <p className="text-muted-foreground text-sm">
                                Select a store and capture a snapshot to start generating reports.
                            </p>
                        </div>
                        <Button onClick={captureSnapshot} disabled={snapshotting || !selectedStoreId}>
                            {snapshotting ? <Spinner className="size-4" /> : <Download className="size-4" />}
                            Capture First Snapshot
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
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
