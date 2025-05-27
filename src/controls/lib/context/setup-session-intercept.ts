
import type { ActionSequence } from "../action";
import type { Config } from "../config";
import type { HandlerSequence } from "../sequence";
import { debounce, Stack } from "../utils";
import type { Context } from "../utils/context";
import type { MediaSessionInput } from "./override-media-session";

type Input = {
    notificationId: string;
    sequenceStack: Stack<HandlerSequence>;
    config: Config;
    actionSequence: ActionSequence;
};

export function setupSessionIntercept(
    context: Context<Input & MediaSessionInput>
) {
    const handleSequence = debounce((details: MediaSessionActionDetails) => {
        const sequence = context.sequenceStack.head();
        if (!sequence) {
            throw new Error('There is no sequence in stack');
        }

        sequence.handle(details, context.actionSequence);
        context.actionSequence.length = 0;
    }, context.config.delay);

    context.on('config', (config) => {
        handleSequence.delay = config.delay;
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

        handleSequence(details);

        const playbackState = details.action === 'pause' ? 'playing' : 'paused';
        context.session.playbackState = playbackState;
    };

    context.on(
        'interceptedActions',
        (current, previous) => {
            for (const action of previous) {
                context.session.setActionHandler(action, null);
            }

            for (const action of current) {
                context.session.setActionHandler(action, interceptHandler);
            }
        },
    );

    context.on('release', () => {
        for (const action of context.interceptedActions) {
            context.session.setActionHandler(action, null);
        }

        const entries = Object.entries(context.actionHandleCallbackMap);
        for (const [action, callback] of entries) {
            context.session.setActionHandler(
                action as MediaSessionAction,
                callback
            );
        }
    });
}
