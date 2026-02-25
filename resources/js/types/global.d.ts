import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            temperatureUnit: 'C' | 'F';
            [key: string]: unknown;
        };
    }
}
