

// TODO: use WebLocks API (for same origin)
// and Message API (for extension) for determining
// tab that can use session for now

export class AlternativeMediaSession {
    static #instance: AlternativeMediaSession;
    public static get initialized() {
        return this.#instance.initialized;
    }

    public static get instance() {
        if (this.#instance) {
            return this.#instance;
        }

        this.#instance = new AlternativeMediaSession();
        return this.#instance;
    }

    private initialized: boolean;

    private constructor() {
        this.initialized = false;
    }

    public create() {
        this.initialized = true;
    }

    public release() {
        this.initialized = true;
    }
}

if (!AlternativeMediaSession.initialized) {
    AlternativeMediaSession.instance.create();
}

AlternativeMediaSession