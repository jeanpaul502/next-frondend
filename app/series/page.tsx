import type { Metadata } from 'next';
import { Series } from "../../src/dashboard/Series";

export const metadata: Metadata = {
    title: 'Séries',
};

export default function SeriesPage() {
    return <Series />;
}
