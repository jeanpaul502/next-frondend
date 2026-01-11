import type { Metadata } from 'next';
import Settings from '../../../src/dashboard/Settings';

export const metadata: Metadata = {
    title: 'Paramètres',
};

export default function SettingsPage() {
    return <Settings />;
}
