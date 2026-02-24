import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { StoreManagement } from '@/components/StoreManagement';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Stores',
        href: '/stores',
    },
];

export default function Stores() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Store Management" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 md:p-6">
                <StoreManagement />
            </div>
        </AppLayout>
    );
}
