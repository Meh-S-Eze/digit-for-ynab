export class Cache {
    static instance;
    storage = new Map();
    constructor() { }
    static getInstance() {
        if (!Cache.instance) {
            Cache.instance = new Cache();
        }
        return Cache.instance;
    }
    set(key, data, ttlMinutes = 5) {
        const expiry = Date.now() + (ttlMinutes * 60 * 1000);
        this.storage.set(key, { data, expiry });
    }
    get(key) {
        const entry = this.storage.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiry) {
            this.storage.delete(key);
            return null;
        }
        return entry.data;
    }
    clear() {
        this.storage.clear();
    }
}
