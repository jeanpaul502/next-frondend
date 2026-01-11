import type { Metadata } from 'next';
import { Movies } from "../../src/dashboard/Movies";

export const metadata: Metadata = {
    title: 'Films',
};

export default function MoviesPage() {
    return <Movies />;
}
