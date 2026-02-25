import { Head } from '@inertiajs/react';

import { ReportsDashboard } from '@/components/ReportsDashboard';
import { SnapshotScheduleManager } from '@/components/SnapshotScheduleManager';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Reports',
        href: '/reports',
    },
];

interface Store {
    id: number;
    store_number: string;
    store_name: string;
    sensors_count: number;
}

interface Props {
    stores: Store[];
}

export default function Reports({ stores }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sensor Reports" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 md:p-6">
                <ReportsDashboard stores={stores} />
                <SnapshotScheduleManager />
            </div>
        </AppLayout>
    );
}
