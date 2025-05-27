let globalIgnoring = false;

export function withIgnore(callback: () => void) {
    globalIgnoring = true;

    callback();

    globalIgnoring = false;
}

export type CleanupCallback = () => void;

/**
 * Global value is simple store that provide a way
 * to listen when value assign occurs (without checking if it has changed)
 */
export class GlobalValue<T = unknown> {
    private target: EventTarget;
    private _value: T;
    private previousValue: T;
    private ignoring: boolean;
    private cleanups: CleanupCallback[];

    constructor(initial: T) {
        this.target = new EventTarget();
        this.cleanups = [];
        this.ignoring = false;

        this._value = initial;
        this.previousValue = initial;

        this.value = initial;
    }

    get value() {
        return this._value;
    }

    set value(value: T) {
        this.previousValue = this._value;
        this._value = value;

        if (!this.ignoring && !globalIgnoring) {
            this.trigger();
        }
    }

    trigger() {
        const event = new Event('value');
        this.target.dispatchEvent(event);        
    }

    /**
     * @param callback Callback must be synchronous
     */
    on(callback: (value: T, previousValue: T) => void): CleanupCallback {
        const controller = new AbortController();

        this.target.addEventListener('value', () => {   
            try {
                this.ignoring = true;
                callback(this.value, this.previousValue);
            } catch (error) {
                console.error(
                    'Error during calling value callback:', error
                );

                throw error;
            } finally {
                this.ignoring = false;
            }
        }, { signal: controller.signal });

        const cleanup = () => controller.abort();
        this.cleanups.push(cleanup);

        return cleanup;
    }

    public release() {
        for (const cleanup of this.cleanups) {
            cleanup();
        }
    }
}
