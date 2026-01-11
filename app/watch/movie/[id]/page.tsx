import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import WatchClient from './WatchClient';
import { API_BASE_URL } from '@/utils/config';

type Props = {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getMovie(id: string) {
    try {
        // Try UUID fetch
        let response = await fetch(`${API_BASE_URL}/movies/${id}`, { cache: 'no-store' });

        if (!response.ok) {
            // Try TMDB fetch fallback
            const responseTmdb = await fetch(`${API_BASE_URL}/movies/tmdb/${id}`, { cache: 'no-store' });
            if (responseTmdb.ok) {
                return await responseTmdb.json();
            }
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching movie for metadata", error);
        return null;
    }
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = (await params).id;
    const movie = await getMovie(id);

    if (!movie) {
        return {
            title: 'Film introuvable - Netfix',
            description: 'Le film que vous cherchez est introuvable.',
        };
    }

    const title = movie.title || 'Film';
    // Truncate description for meta tags if too long (standard practice is around 160-200 chars, but OG supports more)
    const description = movie.overview
        ? (movie.overview.length > 200 ? movie.overview.substring(0, 197) + '...' : movie.overview)
        : 'Regardez ce film sur Netfix.';

    // Choose the best image available
    const imageUrl = movie.backdropPath || movie.posterPath || movie.image || '/default-share-image.jpg';

    return {
        title: `${title} - Regarder sur Netfix`,
        description: description,
        openGraph: {
            title: title,
            description: description,
            url: `/watch/movie/${id}`,
            siteName: 'Netfix',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            locale: 'fr_FR',
            type: 'video.movie',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: [imageUrl],
        },
    };
}

export default async function WatchMoviePage({ params, searchParams }: Props) {
    const id = (await params).id;
    const movie = await getMovie(id);

    // Pass the initial data to client to avoid double fetch
    return <WatchClient id={id} movieData={movie} />;
}
