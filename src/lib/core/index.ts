// TODO: use WebLocks API (for same origin)
// and Message API (for extension) for determining
// tab that can use session for now

import type { ActionSequenceItem } from "./action";
import { initializeContext } from "./context";
import { WithGlobalContext, type GlobalContext } from "./context/with-context";
import type { Handler } from "./handler";
import { PassActionHandler } from "./handler/media-session";
import { LinearHandlerSequence, type HandlerSequence } from "./sequence";
import { Stack } from "./utils";
import { GlobalValue, type CleanupCallback } from "./utils/global-value";

export type State = Readonly<{
    sequenceStack: Stack<HandlerSequence>;
    actionSequence: readonly ActionSequenceItem[];
    activeHandler: Handler | undefined;
    interceptedActions: readonly MediaSessionAction[];
    handleDelay: number;
}>;

function createDefaultState(): State {
    return {
        sequenceStack: new Stack(),
        actionSequence: [],
        activeHandler: undefined,
        interceptedActions: [],
        handleDelay: 0,
    };
}

function createStateFromContext(context: GlobalContext): State {
    return {
        sequenceStack: new Stack(context.sequenceStack.inner.slice()),
        actionSequence: context.actionSequence.slice(),
        activeHandler: context.activeHandler,
        interceptedActions: context.interceptedActions.slice(),
        handleDelay: context.handleDelay,
    };
}

export type EventKey =
    | 'start'
    | 'stop'
    | 'state'
    | 'sequence'
    | 'action'
    | 'handler';

type ExtendedEventKey = EventKey | 'none';


// THINK: is it okay to use WithGlobalContext here?

export class AlternativeMediaSession extends WithGlobalContext {
    private initialized: boolean;
    #state: State;
    private emitter: GlobalValue<ExtendedEventKey>;

    public get started() {
        return this.initialized;
    }
    
    public get state() {
        return this.#state;
    }

    public get interceptActions() {
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
        this.context.trigger('sequenceStack');
    }
    
    constructor() {
        super();

        this.initialized = false;
        this.#state = createDefaultState();
        this.emitter = new GlobalValue('none');
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

        this.#state = createDefaultState();

        this.context.on('sequenceStack', () => {
            this.#state = createStateFromContext(this.context);
            this.emitter.value = 'sequence';
            this.emitter.value = 'state';
        });

        this.context.on('actionSequence', () => {
            this.#state = createStateFromContext(this.context);
            this.emitter.value = 'action';
            this.emitter.value = 'state';
        });

        this.context.on('activeHandler', () => {
            this.#state = createStateFromContext(this.context);
            this.emitter.value = 'handler';
            this.emitter.value = 'state';
        });

        this.context.on('handleDelay', () => {
            this.#state = createStateFromContext(this.context);
            this.emitter.value = 'state';
        });

        this.context.on('interceptedActions', () => {
            this.#state = createStateFromContext(this.context);
            this.emitter.value = 'state';
        });

        this.initialized = true;
        this.emitter.value = 'start';

        console.log('started')
    }

    public stop() {
        this.initialized = false;

        this.context.on('release', () => {
            this.#state = createDefaultState();
            this.emitter.value = 'stop';
        });

        this.context.release();
        this.emitter.release();
    }

    public on<Key extends EventKey>(
        key: Key,
        callback: (key: Key, state: State) => void,
    ): CleanupCallback {
        return this.emitter.on(event => {
            if (event !== key) return;

            callback(key, this.#state);          
        });
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
export { } from './state';
