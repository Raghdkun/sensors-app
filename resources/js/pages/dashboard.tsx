import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { YoSmartDeviceList } from '@/components/YoSmartDeviceList';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 md:p-6">
                <YoSmartDeviceList />
            </div>
        </AppLayout>
    );
}
