import { useCallback, useEffect, useState } from 'react';

/**
 * React state synced to `localStorage`. Gracefully tolerates SSR and
 * disabled storage (e.g. private mode) by falling back to in-memory
 * state.
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
    const readValue = useCallback((): T => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const raw = window.localStorage.getItem(key);
            if (raw === null) return initialValue;
            return JSON.parse(raw) as T;
        } catch {
            return initialValue;
        }
    }, [key, initialValue]);

    const [stored, setStored] = useState<T>(readValue);

    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            setStored((prev) => {
                const next =
                    typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
                try {
                    if (typeof window !== 'undefined') {
                        window.localStorage.setItem(key, JSON.stringify(next));
                    }
                } catch {
                    // Storage quota / disabled — ignore.
                }
                return next;
            });
        },
        [key],
    );

    // Keep tabs in sync.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const onStorage = (e: StorageEvent) => {
            if (e.key !== key) return;
            setStored(readValue());
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [key, readValue]);

    return [stored, setValue];
}
