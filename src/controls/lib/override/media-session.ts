
import type { ActionSequence } from "../action";
import type { Config } from "../config";
import { updateNotification } from "../notification";
import type { HandlerSequence } from "../sequence";
import { createContext, debounce, defineProperty, Stack } from "../utils";
import type { Context } from "../utils/context";

type Input = {
    notificationId: string;
    sequenceStack: Stack<HandlerSequence>;
    config: Config;
    actionSequence: ActionSequence;
};

type Output = {
    session: MediaSession;
    actionHandleCallbackMap: ActionHandleCallbackMap;
    interceptedActions: MediaSessionAction[];
    globalMetadata: MediaMetadata | null;
};

type ActionHandleCallbackMap = Partial<
    Record<MediaSessionAction, MediaSessionActionHandler>
>;

export function createMediaSessionOverride(input: Context<Input>) {
    const MediaSession = self.MediaSession;
    const mediaSession = navigator.mediaSession;

    const context = createContext<Output>({
        session: mediaSession,
        actionHandleCallbackMap: {},
        interceptedActions: [],
        globalMetadata: null,
    });

    context.on(
        'interceptedActions',
        (current, previous) => {
            for (const action of previous) {
                mediaSession.setActionHandler(action, null);
            }

            for (const action of current) {
                mediaSession.setActionHandler(action, interceptHandler);
            }
        }
    );

    function isActionIntercepted(action: MediaSessionAction) {
        return (
            context.interceptedActions.includes(action) ||
            action === 'pause' ||
            action === 'play'
        );
    }

    const overridePrototype = {} as MediaSession;

    defineProperty(overridePrototype, 'setActionHandler', {
        value: function (
            this: MediaSession,
            action: MediaSessionAction,
            handler: MediaSessionActionHandler | null
        ): void {
            if (!isActionIntercepted(action)) {
                return mediaSession.setActionHandler(action, handler);
            }

            if (!handler) {
                delete context.actionHandleCallbackMap[action];
                return;
            }

            context.actionHandleCallbackMap[action] = handler;
        },
    });

    defineProperty(overridePrototype, 'setPositionState', {
        value: function (
            this: MediaSession,
            state?: MediaPositionState
        ): void {
            return mediaSession.setPositionState(state);
        },
    });

    defineProperty(overridePrototype, 'metadata', {
        get: () => {
            return mediaSession.metadata;
        },
        set: (metadata: MediaMetadata | null) => {
            console.log('Set metadata:', metadata);

            context.globalMetadata = metadata;
            mediaSession.metadata = metadata;
        },
    });

    function changePlaybackState(
        playbackState: MediaSessionPlaybackState,
        update = false
    ) {
        mediaSession.playbackState = playbackState;
        console.log('MediaSession playbackState:', playbackState);

        if (update) {
            updateNotification(input.notificationId, playbackState, undefined);
        }
    }

    defineProperty(overridePrototype, 'playbackState', {
        get: () => {
            return mediaSession.playbackState;
        },
        set: (playbackState: MediaSessionPlaybackState) => {
            changePlaybackState(playbackState, true);
        },
    });

    defineProperty(navigator, 'mediaSession', {
        value: Object.create(overridePrototype),
    });

    const overrideFunction = function MediaSession() { }
    overrideFunction.prototype = overridePrototype;

    defineProperty(self, 'MediaSession', {
        value: overrideFunction,
    });

    const handleSequence = debounce((details: MediaSessionActionDetails) => {
        const sequence = input.sequenceStack.head();
        if (!sequence) {
            throw new Error('There is no sequence in stack');
        }

        sequence.handle(details, input.actionSequence);
        input.actionSequence.length = 0;
    }, input.config.delay);

    input.on('config', (config) => {
        handleSequence.delay = config.delay;
    });

    let time = 0;

    const interceptHandler = (details: MediaSessionActionDetails) => {
        const currentTime = Date.now();
        if (!input.actionSequence.length) {
            time = currentTime;
        }

        input.actionSequence.push({
            details: details,
            delta: currentTime - time,
        });
        time = currentTime;

        handleSequence(details);

        const playbackState = details.action === 'pause' ? 'playing' : 'paused';
        changePlaybackState(playbackState);
    }

    context.on('release', () => {
        defineProperty(navigator, 'mediaSession', {
            value: mediaSession,
        });

        defineProperty(self, 'MediaSession', {
            value: MediaSession,
        });        
    });

    return context;
}
