import { useState, useEffect } from 'react';
import { UseQueryOptions, useQueries } from 'react-query';
import { getImages } from '../services/imageService';

const useFetchImages = ({
    limit,
    batchCount,
    odDataDone,
    updateState,
    totalEntries
}: {
    limit: number,
    batchCount: number,
    odDataDone: boolean,
    updateState: (data: { message: string, numberOfEntries: number, index: number }) => void,
    totalEntries: number
}) => {
    const [currentBatch, setCurrentBatch] = useState(0);
    const [queries, setQueries] = useState<UseQueryOptions[]>([]);


    useEffect(() => {
        if ((currentBatch * batchCount * limit < totalEntries) && !odDataDone) {
            const offsets = Array.from({ length: batchCount }, (_, i) => (currentBatch * batchCount + i) * limit);

            const newQueries = offsets.map((offset, index) => {
                return {
                    queryKey: ['data', offset],
                    queryFn: () => getImages({ offset, limit }).then((res) => ({ ...res.data, index })),
                    onSuccess: (data: { message: string, numberOfEntries: number, index: number, offset: number, limit: number }) => updateState(data),
                    // Adding retry logic with a maximum of 3 attempts
                    retry: 3,
                    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
                }
            }) as UseQueryOptions[];

            setQueries(newQueries);
            setCurrentBatch(currentBatch + 1);
        }
    }, [currentBatch, limit, batchCount, updateState, totalEntries, odDataDone]);

    useQueries(queries);
};

export { useFetchImages }