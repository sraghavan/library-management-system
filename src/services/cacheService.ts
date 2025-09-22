interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiryTime?: number;
}

class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultExpiryTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Set cache with optional expiry time
  set<T>(key: string, data: T, expiryTime?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiryTime: expiryTime || this.defaultExpiryTime,
    };

    this.cache.set(key, item);
    this.persistToLocalStorage();
  }

  // Get cache item
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.persistToLocalStorage();
      return null;
    }

    return item.data as T;
  }

  // Check if cache item exists and is valid
  has(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.persistToLocalStorage();
      return false;
    }

    return true;
  }

  // Remove specific cache item
  remove(key: string): void {
    this.cache.delete(key);
    this.persistToLocalStorage();
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.persistToLocalStorage();
  }

  // Clean expired items
  cleanExpired(): number {
    let removedCount = 0;

    Array.from(this.cache.entries()).forEach(([key, item]) => {
      if (this.isExpired(item)) {
        this.cache.delete(key);
        removedCount++;
      }
    });

    if (removedCount > 0) {
      this.persistToLocalStorage();
    }

    return removedCount;
  }

  // Get cache statistics
  getStats(): {
    totalItems: number;
    expiredItems: number;
    cacheSize: string;
    oldestItem?: Date;
    newestItem?: Date;
  } {
    const totalItems = this.cache.size;
    let expiredItems = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    Array.from(this.cache.values()).forEach(item => {
      if (this.isExpired(item)) {
        expiredItems++;
      }

      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
      }

      if (item.timestamp > newestTimestamp) {
        newestTimestamp = item.timestamp;
      }
    });

    return {
      totalItems,
      expiredItems,
      cacheSize: this.getCacheSize(),
      oldestItem: oldestTimestamp !== Infinity ? new Date(oldestTimestamp) : undefined,
      newestItem: newestTimestamp !== 0 ? new Date(newestTimestamp) : undefined,
    };
  }

  // Initialize cache from localStorage
  loadFromLocalStorage(): void {
    try {
      const cacheData = localStorage.getItem('libraryCache');
      if (cacheData) {
        const parsedCache = JSON.parse(cacheData);
        this.cache = new Map(parsedCache);

        // Clean expired items on load
        this.cleanExpired();
      }
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error);
      this.cache.clear();
    }
  }

  // Persist cache to localStorage
  private persistToLocalStorage(): void {
    try {
      const cacheArray = Array.from(this.cache.entries());
      localStorage.setItem('libraryCache', JSON.stringify(cacheArray));
    } catch (error) {
      console.error('Failed to persist cache to localStorage:', error);
    }
  }

  // Check if cache item is expired
  private isExpired(item: CacheItem<any>): boolean {
    if (!item.expiryTime) {
      return false;
    }

    return Date.now() - item.timestamp > item.expiryTime;
  }

  // Get approximate cache size
  private getCacheSize(): string {
    try {
      const cacheString = JSON.stringify(Array.from(this.cache.entries()));
      const sizeInBytes = new Blob([cacheString]).size;

      if (sizeInBytes < 1024) {
        return `${sizeInBytes} B`;
      } else if (sizeInBytes < 1024 * 1024) {
        return `${(sizeInBytes / 1024).toFixed(2)} KB`;
      } else {
        return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
      }
    } catch (error) {
      return 'Unknown';
    }
  }

  // Cache book metadata with longer expiry
  cacheBookMetadata(url: string, metadata: any): void {
    const key = `book_metadata_${url}`;
    const weekInMs = 7 * 24 * 60 * 60 * 1000; // 1 week
    this.set(key, metadata, weekInMs);
  }

  // Get cached book metadata
  getCachedBookMetadata(url: string): any | null {
    const key = `book_metadata_${url}`;
    return this.get(key);
  }

  // Cache OCR results
  cacheOCRResult(imageHash: string, result: any): void {
    const key = `ocr_result_${imageHash}`;
    const dayInMs = 24 * 60 * 60 * 1000; // 1 day
    this.set(key, result, dayInMs);
  }

  // Get cached OCR result
  getCachedOCRResult(imageHash: string): any | null {
    const key = `ocr_result_${imageHash}`;
    return this.get(key);
  }

  // Cache user search results
  cacheUserSearch(query: string, results: any): void {
    const key = `user_search_${query.toLowerCase()}`;
    const hourInMs = 60 * 60 * 1000; // 1 hour
    this.set(key, results, hourInMs);
  }

  // Get cached user search
  getCachedUserSearch(query: string): any | null {
    const key = `user_search_${query.toLowerCase()}`;
    return this.get(key);
  }
}

// Create singleton instance
export const cacheService = new CacheService();

// Initialize cache on module load
cacheService.loadFromLocalStorage();

// Clean expired items periodically (every hour)
setInterval(() => {
  const removedCount = cacheService.cleanExpired();
  if (removedCount > 0) {
    console.log(`Cache cleanup: removed ${removedCount} expired items`);
  }
}, 60 * 60 * 1000);

export default cacheService;