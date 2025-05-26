import { actionSequence } from "../action";
import { notificationId, updateNotification } from "../notification";
import { sequenceStack } from "../sequence";
import { config } from "../config";
import { debounce, defineProperty, GlobalValue } from "../utils";

const descriptors = Object.getOwnPropertyDescriptors(MediaSession.prototype);
const copiedPrototype = Object.defineProperties({}, descriptors) as MediaSession;

export const session = navigator.mediaSession;
const overridePrototype = {} as MediaSession;

function isActionIntercepted(action: MediaSessionAction) {
    return (
        interceptedActions.value.includes(action) ||
        action === 'pause' ||
        action === 'play'
    );
}

export const actionHandleCallbackMap: Partial<
    Record<
        MediaSessionAction,
        MediaSessionActionHandler
    >
> = {};

export const interceptedActions = new GlobalValue<MediaSessionAction[]>([])

defineProperty(overridePrototype, 'setActionHandler', {
    value: function (
        this: MediaSession,
        action: MediaSessionAction,
        handler: MediaSessionActionHandler | null
    ): void {
        if (!isActionIntercepted(action)) {
            return copiedPrototype.setActionHandler.call(session, action, handler);
        }

        if (!handler) {
            delete actionHandleCallbackMap[action];
            return;
        }

        actionHandleCallbackMap[action] = handler;
    },
});

defineProperty(overridePrototype, 'setPositionState', {
    value: function (
        this: MediaSession,
        state?: MediaPositionState
    ): void {
        return copiedPrototype.setPositionState.call(session, state);
    },
});

export const globalMetadata = new GlobalValue<MediaMetadata | null>(null);

defineProperty(overridePrototype, 'metadata', {
    get: () => {
        return session.metadata;
    },
    set: (metadata: MediaMetadata | null) => {
        console.log('Set metadata:', metadata);

        globalMetadata.value = metadata;
        session.metadata = metadata;
    },
});

defineProperty(overridePrototype, 'playbackState', {
    get: () => {
        return session.playbackState;
    },
    set: (playbackState: MediaSessionPlaybackState) => {
        changePlaybackState(playbackState, true);
    },
});

const overrideFunction = function MediaSession() { }
overrideFunction.prototype = overridePrototype;

defineProperty(navigator, 'mediaSession', {
    value: Object.create(overridePrototype),
});

defineProperty(self, 'MediaSession', {
    value: overrideFunction,
});

export function changePlaybackState(
    playbackState: MediaSessionPlaybackState,
    update = false
) {
    session.playbackState = playbackState;
    console.log('MediaSession playbackState:', playbackState);

    if (update) {
        updateNotification(notificationId, playbackState, undefined);
    }
}

const handleSequence = debounce((details: MediaSessionActionDetails) => {
    const sequence = sequenceStack.head();
    if (!sequence) {
        throw new Error('There is no sequence in stack');
    }

    sequence.handle(details, actionSequence);
    actionSequence.length = 0;
}, config.value.delay);

const cleanup = config.on((config) => {
    handleSequence.delay = config.delay;
});

let time = 0;

const interceptHandler = (details: MediaSessionActionDetails) => {
    const currentTime = Date.now();
    if (!actionSequence.length) {
        time = currentTime;
    }

    actionSequence.push({
        details: details,
        delta: currentTime - time,
    });
    time = currentTime;

    handleSequence(details);

    const playbackState = details.action === 'pause' ? 'playing' : 'paused';
    changePlaybackState(playbackState);
}

const cleanup2 = interceptedActions.on((current, previous) => {
    for (const action of previous) {
        session.setActionHandler(action, null);
    }

    for (const action of current) {
        session.setActionHandler(action, interceptHandler);
    }
});