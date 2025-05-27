import { debounce, defineProperty } from "../utils";
import { SequenceError } from "./initialize";
import type { StoredMediaSessionActionHandler } from "./override-media-session";
import type { GlobalContext } from "./with-context";

export const interceptHandlerSymbol = Symbol('Intercept handler');

export function isInterceptHandler(handler: StoredMediaSessionActionHandler) {
    return interceptHandlerSymbol in handler;
}

export function setupSessionIntercept(
    context: GlobalContext
) {
    const handleSequence = debounce((details: MediaSessionActionDetails) => {
        const sequence = context.sequenceStack.head();
        if (!sequence) {
            throw new SequenceError();
        }

        sequence.handle(details, context.actionSequence);
        context.actionSequence.length = 0;
        context.trigger('actionSequence');
    }, context.handleDelay);

    context.on('handleDelay', (delay) => {
        handleSequence.delay = delay;
    });

    let time = 0;

    const interceptHandler = (details: MediaSessionActionDetails) => {
        const currentTime = Date.now();
        if (!context.actionSequence.length) {
            time = currentTime;
        }

        context.actionSequence.push({
            details: details,
            delta: currentTime - time,
        });
        time = currentTime;
        context.trigger('actionSequence');

        handleSequence(details);

        const playbackState = details.action === 'pause' ? 'playing' : 'paused';
        context.session.playbackState = playbackState;
    };

    defineProperty(interceptHandler, interceptHandlerSymbol, {
        value: true,
    });

    context.on(
        'interceptedActions',
        (current, previous) => {
            for (const action of previous) {
                const callback = context.actionHandleCallbackMap[action];
                delete context.actionHandleCallbackMap[action];

                context.session.setActionHandler(action, callback ?? null);
            }

            for (const action of current) {
                const callback = context.sessionCallbackMap[action];
                if (callback) {
                    context.actionHandleCallbackMap[action] = callback;
                }
                
                context.session.setActionHandler(action, interceptHandler);
            }
        },
    );

    context.on('release', () => {
        for (const action of context.interceptedActions) {
            const callback = context.actionHandleCallbackMap[action];
            delete context.actionHandleCallbackMap[action];
            
            context.session.setActionHandler(action, callback ?? null);
        }
    });
}
