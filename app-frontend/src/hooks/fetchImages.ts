import { useState, useEffect } from 'react';
import { useQueryClient, UseQueryOptions, QueryFunction } from 'react-query';
import { getImages } from '../services/imageService';
import { GetImagesDTO } from '../types/Box';

interface UseFetchImagesParams {
    limit: number;
    concurrentFetches: number;
    updateState: (data: { message: string; numberOfEntries: number; data: GetImagesDTO }) => void;
    totalEntries: number;
    delay: number;
}

interface ImageResponse {
    message: string;
    numberOfEntries: number;
    data: GetImagesDTO;
}

const useFetchImages = ({
    limit,
    concurrentFetches,
    updateState,
    totalEntries,
    delay
}: UseFetchImagesParams) => {
    const [currentBatch, setCurrentBatch] = useState(0);
    const queryClient = useQueryClient();

    useEffect(() => {
        const fetchBatch = async () => {
            if (currentBatch * concurrentFetches * limit < totalEntries) {
                const offsets = Array.from({ length: concurrentFetches }, (_, i) => (currentBatch * concurrentFetches + i) * limit);
                const newQueries: UseQueryOptions<ImageResponse, unknown, ImageResponse, [string, number]>[] = offsets.map(offset => ({
                    queryKey: ['data', offset],
                    queryFn: ({ queryKey }) => {
                        const [, offset] = queryKey as [string, number];
                        return getImages({ offset, limit }).then(axiosResponse => {
                            const { message, numberOfEntries, data } = axiosResponse.data;
                            return { message, numberOfEntries, data };
                        });
                    },
                    onSuccess: (res: ImageResponse) => {
                        const dataWithIndex = { ...res, index: offset / limit };
                        updateState(dataWithIndex);
                    },
                    retry: 3,
                    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
                }));

                // Execute the queries for the current batch
                await Promise.all(newQueries.map(query =>
                    queryClient.fetchQuery(query.queryKey as [string, number], query.queryFn as QueryFunction<ImageResponse, [string, number]>)
                        .then(data => {
                            if (query.queryKey) {
                                queryClient.setQueryData(query.queryKey, data);
                                if (query.onSuccess) {
                                    query.onSuccess(data);
                                }
                            }
                        })
                ));
                // Set a delay before fetching the next batch
                setTimeout(() => {
                    setCurrentBatch(currentBatch + 1);
                }, delay * 1000); // 5 seconds delay
            }
        };

        fetchBatch();
    }, [currentBatch, limit, concurrentFetches, totalEntries, updateState, queryClient, delay]);
};

export { useFetchImages };