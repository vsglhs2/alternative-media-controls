

// TODO: use WebLocks API (for same origin)
// and Message API (for extension) for determining
// tab that can use session for now

import { initializeContext } from "./context";
import { WithGlobalContext } from "./context/with-context";
import { PassActionHandler } from "./handler/media-session";
import { LinearHandlerSequence, type HandlerSequence } from "./sequence";

// is it okay to use WithGlobalContext here?

export class AlternativeMediaSession extends WithGlobalContext {
    private initialized: boolean;

    public get started() {
        return this.initialized;
    }

    constructor() {
        super();

        this.initialized = false;
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

    public start() {
        if (this.initialized) {
            throw new Error('Context already created');
        }

        initializeContext();
        this.interceptActions = [];

        const handler = new PassActionHandler();
        const sequence = new LinearHandlerSequence([handler]);
        this.handlerSequence = sequence;

        this.initialized = true;
    }

    public stop() {
        this.initialized = false;

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
