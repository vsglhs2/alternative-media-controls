import { defineProperty } from "./define-property";
import { GlobalValue, type CleanupCallback } from "./global-value";

const globalValueRecordSymbol = Symbol('Global value record');
const cleanupsSymbol = Symbol('Cleanups');

// THINK: can this abstraction be simplified?

export type Context<
    Input extends Record<string, unknown> = {}
> = {
    [Key in keyof Input]: Input[Key];
} & {
    [globalValueRecordSymbol]: Record<string, GlobalValue>;
    [cleanupsSymbol]: Set<CleanupCallback>;
    on<Key extends keyof Input>(
        key: Key,
        callback: (
            value: Input[Key],
            previous: Input[Key]
        ) => void,
    ): CleanupCallback;
    on(
        key: 'release',
        callback: CleanupCallback,
    ): CleanupCallback;
    trigger(key: keyof Input): void;
    release(): void;
};

export class ContextError extends Error {
    public context: Context;
    public key: string;

    constructor(key: string, context: Context) {
        const message = `Context doesn\'t have key ${key}`;
        super(message);

        this.context = context;
        this.key = key;
    }
}

const contextPrototype = {
    on(
        this: Context,
        key: string,
        callback: (value: unknown, previous: unknown) => void
    ) {
        if (key === 'release') {
            this[cleanupsSymbol].add(callback as CleanupCallback);

            return () => {
                this[cleanupsSymbol].delete(callback as CleanupCallback);
            };
        }

        const globalValue = this[globalValueRecordSymbol][key];
        if (!globalValue) {
            throw new ContextError(key, this);
        }

        const cleanup = globalValue.on((value, previous) => {
            callback(value, previous);
        });
        this[cleanupsSymbol].add(cleanup);

        return () => {
            cleanup();
            
            this[cleanupsSymbol].delete(cleanup);
        };
    },
    trigger(this: Context, key: string) {
        const globalValue = this[globalValueRecordSymbol][key];
        if (!globalValue) {
            throw new ContextError(key, this);
        }

        globalValue.trigger();
    },
    release(this: Context) {
        for (const cleanup of this[cleanupsSymbol]) {
            cleanup();
        }

        this[cleanupsSymbol].clear();
        this[globalValueRecordSymbol] = {};
    }
};

export function createContext<
    Input extends Record<string, unknown>
>(input: Input): Context<Input> {
    const context = Object.create(contextPrototype) as Context<Input>;
    const cleanups: Set<CleanupCallback> = new Set();
    const globalValueRecord: Record<string, GlobalValue> = {};

    for (const [key, value] of Object.entries(input)) {
        const globalValue = new GlobalValue(value);
        globalValueRecord[key] = globalValue;

        defineProperty(context, key, {
            get: () => {
                return globalValue.value;
            },
            set: (value: unknown) => {
                globalValue.value = value;
            },
        });
    }

    defineProperty(context, globalValueRecordSymbol, {
        value: globalValueRecord,
        enumerable: false,
    });

    defineProperty(context, cleanupsSymbol, {
        value: cleanups,
        enumerable: false,
    });

    return context;
}

export type TupleToIntersection<
    Tuple extends unknown[]
> = Tuple extends [infer Head, ...infer Tail]
    ? Head & TupleToIntersection<Tail> : {};

export function mergeContexts<
    Contexts extends Context[]
>(...contexts: Contexts) {
    const merged = createContext({});

    for (const context of contexts) {
        const keys = Object.keys(context);
        const entries = keys.map(
            key => [key, Object.getOwnPropertyDescriptor(context, key)] as const,
        );

        for (const [key, descriptor] of entries) {
            if (!descriptor) continue;

            Object.defineProperty(merged, key, descriptor);
        }

        Object.assign(
            merged[globalValueRecordSymbol],
            context[globalValueRecordSymbol]
        );

        // THINK: This can be problematic as such way cleanup
        // callbacks will be called multiple times
        // But as for now it's okay, as i only clear
        // EventTarget listeners
        for (const cleanup of context[cleanupsSymbol]) {
            merged[cleanupsSymbol].add(cleanup);
        }
    }

    return merged as TupleToIntersection<Contexts>;
}
