import { createActionContext } from "./action";
import { createConfigContext } from "./config";
import { createMediaSessionOverride } from "./override/media-session";
import type { HandlerSequence } from "./sequence";
import { createContext, mergeContexts, Stack } from "./utils";
import type { Context } from "./utils/context";

// TODO: make all classes that depends on instanced context subclass
// of this class
// maybe redesign initialization logic?
// like not new LinearSequence(...), but 'linear': ...handlers

abstract class WithContext {
    static context: Context;
    
    protected get context() {
        return WithContext.context;
    }

    constructor() {}
}

export function createSequenceContext() {
    type Input = {
        sequenceStack: Stack<HandlerSequence>
    };

    return createContext<Input>({
        sequenceStack: new Stack<HandlerSequence>(),
    });
}

export function createNotificationContext() {
    type Input = {
        notificationId: string;
    };

    return createContext<Input>({
        notificationId: 'notification-1',
    });
}

export function initializeContext() {
    const sequenceContext = createSequenceContext();
    const actionContext = createActionContext();
    const configContext = createConfigContext();
    const notificationContext = createNotificationContext();
    
    const mergedContext = mergeContexts(
        sequenceContext,
        actionContext,
        configContext,
        notificationContext,
    );
    const sessionContext = createMediaSessionOverride(mergedContext);

    return {
        sequence: sequenceContext,
        action: actionContext,
        config: configContext,
        notification: notificationContext,
        session: sessionContext,
    };
}

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