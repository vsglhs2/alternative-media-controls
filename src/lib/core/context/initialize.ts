import { setupSessionIntercept } from "./setup-session-intercept";
import { setupGlobalContext, type GlobalContext } from "./with-context";
import { overrideMediaSession, overrideMediaSessionPrototype } from "./override-media-session";
import { createInitialContext } from "./create-initial-context";
import { mergeContexts } from "../utils";
import { withIgnore } from "../utils/global-value";

export class SequenceError extends Error {
    constructor() {
        super('There is no sequence in stack');
    }
}

const prototypeContext = overrideMediaSessionPrototype();

export function initializeContext() {
    const initialContext = createInitialContext();
    const sessionContext = overrideMediaSession();

    const context: GlobalContext = mergeContexts(
        prototypeContext,
        initialContext,
        sessionContext
    );

    setupSessionIntercept(context);
    const cleanupGlobalContext = setupGlobalContext(context);

    // TODO: ensure, that this will be called after all other cleanups
    // TODO: move to corresponding context creation places
    context.on('release', () => {
        // TODO (THINK): can this be done more nicely?
        // aim is to not to trigger state and other events
        withIgnore(() => {
            context.actionHandleCallbackMap = {};
            context.actionSequence = [];
            context.activeHandler = undefined;
            context.globalMetadata = null;
            context.interceptedActions = [];
            context.sequenceStack.reset();
            context.handleDelay = 0;
            context.notificationId = '';            
        });

        cleanupGlobalContext();
    });

    return context;
}