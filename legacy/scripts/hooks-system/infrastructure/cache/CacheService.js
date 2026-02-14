/**
 * Cache Service - Performance Caching Layer
 * Enterprise-grade caching for AST Intelligence Hooks
 */

/**
 * In-Memory Cache Service
 * Fast, TTL-based caching for performance optimization
 */
class CacheService {
    constructor(options = {}, logger = console) {
        this.cache = new Map();
        this.defaultTtl = options.ttl ?? 300000;
        this.maxSize = options.maxSize ?? 1000;
        this.logger = logger;
    }

    get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    set(key, value, ttl) {
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        const entry = {
            value,
            timestamp: Date.now(),
            ttl: ttl ?? this.defaultTtl
        };

        this.cache.set(key, entry);
        if (this.logger && this.logger.debug) {
            this.logger.debug(`[CacheService] Set key: ${key}`);
        }
    }

    has(key) {
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

    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted && this.logger && this.logger.debug) {
            this.logger.debug(`[CacheService] Deleted key: ${key}`);
        }
        return deleted;
    }

    clear() {
        this.cache.clear();
        if (this.logger && this.logger.info) {
            this.logger.info('[CacheService] Cleared cache');
        }
    }

    size() {
        this.cleanExpired();
        return this.cache.size;
    }

    keys() {
        this.cleanExpired();
        return Array.from(this.cache.keys());
    }

    isExpired(entry) {
        return Date.now() - entry.timestamp > entry.ttl;
    }

    evictOldest() {
        let oldestKey = null;
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

    cleanExpired() {
        const keysToDelete = [];

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

    getStats() {
        return {
            size: this.cache.size,
            hits: 0,
            misses: 0
        };
    }
}

/**
 * Create a cached version of an async function
 * @param {Function} fn 
 * @param {CacheService} cache 
 * @param {Function} keyGenerator 
 * @param {number} [ttl] 
 */
function withCache(fn, cache, keyGenerator, ttl) {
    return async (...args) => {
        const key = keyGenerator(...args);
        const cached = cache.get(key);

        if (cached !== null) {
            return cached;
        }

        const result = await fn(...args);
        cache.set(key, result, ttl);
        return result;
    };
}

module.exports = {
    CacheService,
    withCache
};
