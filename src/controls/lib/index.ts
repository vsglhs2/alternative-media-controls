

// TODO: use WebLocks API (for same origin)
// and Message API (for extension) for determining
// tab that can use session for now

import { initializeContext } from "./context";
import { WithGlobalContext } from "./context/with-context";
import { PassActionHandler } from "./handler/media-session";
import { LinearHandlerSequence, type HandlerSequence } from "./sequence";

// is it okay to use WithGlobalContext here?

export class AlternativeMediaSession extends WithGlobalContext {
    #initialized: boolean;

    public get initialized() {
        return this.#initialized;
    }

    constructor() {
        super();

        this.#initialized = false;
    }

    public get interceptActions(): readonly MediaSessionAction[] {
        return this.context.interceptedActions;
    }

    public set interceptActions(actions: MediaSessionAction[]) {
        this.context.interceptedActions = actions;
    }

    public get handleDelay() {
        return this.context.handleDelay;
    }

    public set handleDelay(delay: number) {
        this.context.handleDelay = delay;
    }

    public get handlerSequence() {
        const sequence = this.context.sequenceStack.tail();
        if (!sequence) {
            throw new Error('There is no sequence in stack');
        }

        return sequence;
    }

    public set handlerSequence(sequence: HandlerSequence) {
        this.context.sequenceStack.reset();
        this.context.sequenceStack.push(sequence);
    }

    public initialize() {
        if (this.#initialized) {
            throw new Error('Context already created');
        }
        this.#initialized = true;

        initializeContext();
        
        this.interceptActions = [];

        const sequence = new LinearHandlerSequence([
            new PassActionHandler(),
        ]);
        this.handlerSequence = sequence;
    }

    public release() {
        this.#initialized = false;

        this.context.release();
    }
}

export const alternativeMediaSession = new AlternativeMediaSession();

export { GlobalValue } from './utils';
export {
    CallbackHandler,
    GroupHandler,
    InputHandler,
    MediaSessionHandler,
    PassActionHandler,
    PlayOrPauseHandler
} from './handler';
export { HandlerSequence, LinearHandlerSequence } from './sequence';
export { requestNotificationPermission } from './notification';
export {} from './state';
