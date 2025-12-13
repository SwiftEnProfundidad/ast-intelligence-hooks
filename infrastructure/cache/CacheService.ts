/**
 * Cache Service - Performance Caching Layer
 * Enterprise-grade caching for AST Intelligence Hooks
 */

export interface CacheEntry<T> {
    value: T;
    timestamp: number;
    ttl: number;
}

export interface CacheOptions {
    ttl?: number;
    maxSize?: number;
}

export interface ICacheService {
    get<T>(key: string): T | null;
    set<T>(key: string, value: T, ttl?: number): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    size(): number;
    keys(): string[];
}

/**
 * In-Memory Cache Service
 * Fast, TTL-based caching for performance optimization
 */
export class CacheService implements ICacheService {
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private defaultTtl: number;
    private maxSize: number;

    constructor(options: CacheOptions = {}) {
        this.defaultTtl = options.ttl ?? 300000; // 5 minutes default
        this.maxSize = options.maxSize ?? 1000;
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return null;
        }

        return entry.value as T;
    }

    set<T>(key: string, value: T, ttl?: number): void {
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        const entry: CacheEntry<T> = {
            value,
            timestamp: Date.now(),
            ttl: ttl ?? this.defaultTtl
        };

        this.cache.set(key, entry);
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);

        if (!entry) {
            return false;
        }

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        this.cleanExpired();
        return this.cache.size;
    }

    keys(): string[] {
        this.cleanExpired();
        return Array.from(this.cache.keys());
    }

    private isExpired(entry: CacheEntry<unknown>): boolean {
        return Date.now() - entry.timestamp > entry.ttl;
    }

    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        const entries = Array.from(this.cache.entries());
        for (const [key, entry] of entries) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    private cleanExpired(): void {
        const keysToDelete: string[] = [];

        const entries = Array.from(this.cache.entries());
        for (const [key, entry] of entries) {
            if (this.isExpired(entry)) {
                keysToDelete.push(key);
            }
        }

        for (const key of keysToDelete) {
            this.cache.delete(key);
        }
    }

    getStats(): { size: number; hits: number; misses: number } {
        return {
            size: this.cache.size,
            hits: 0,
            misses: 0
        };
    }
}

/**
 * Create a cached version of an async function
 */
export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    cache: ICacheService,
    keyGenerator: (...args: Parameters<T>) => string,
    ttl?: number
): T {
    return (async (...args: Parameters<T>) => {
        const key = keyGenerator(...args);
        const cached = cache.get(key);

        if (cached !== null) {
            return cached;
        }

        const result = await fn(...args);
        cache.set(key, result, ttl);
        return result;
    }) as T;
}

export default CacheService;
