import { createNotification } from "./notification";

const descriptors = Object.getOwnPropertyDescriptors(MediaSession.prototype);
const copiedPrototype = Object.defineProperties({}, descriptors) as MediaSession;

function defineProperty<T>(
    object: T,
    property: PropertyKey,
    descriptor: PropertyDescriptor & ThisType<any>
): T {
    descriptor.configurable ??= true;
    descriptor.enumerable ??= true;

    if ('value' in descriptor) {
        descriptor.writable ??= true;
    }

    return Object.defineProperty(object, property, descriptor);
}

const session = navigator.mediaSession;
const overridePrototype = {} as MediaSession;

function debounce<Callback extends (...args: any[]) => unknown>(
    callback: Callback,
    delay: number
) {
    let timer: ReturnType<typeof setTimeout>;

    return function (...args: Parameters<Callback>) {
        clearTimeout(timer);
        timer = setTimeout(callback, delay, ...args);
    };
}

type ActionItem = {
    delta: number;
    details: MediaSessionActionDetails;
};

const sequence: ActionItem[] = [];
const actionsDelay = 700;

let time = 0;

const actionCallbackMap: Partial<Record<
    MediaSessionAction,
    MediaSessionActionHandler
>> = {};

const playOrPauseMarker = Symbol('Play or pause');

const emulatedActions: (MediaSessionAction | typeof playOrPauseMarker)[] = [
    playOrPauseMarker,
    'nexttrack',
    'previoustrack',
    'seekforward',
    'seekbackward',
];

const actionSequence: (MediaSessionAction | typeof playOrPauseMarker)[] = [
    playOrPauseMarker,
    'nexttrack',
    'previoustrack',
    'seekforward',
    'seekbackward',
];

const debouncedHandler = debounce((details: MediaSessionActionDetails) => {
    const action = actionSequence[sequence.length - 1];
    if (emulatedActions.includes(action)) {
        const {
            action: finalAction,
            handler
        } = action == playOrPauseMarker ? {
            action: details.action,
            handler: actionCallbackMap[details.action]
        } : {
                action: action,
                handler: actionCallbackMap[action],
            };

        handler?.({ action: finalAction });
        createNotification(session.playbackState, finalAction, '1');
    } else {
        createNotification(session.playbackState, 'there is no such action', '1');
    }

    const initialAction = sequence[0].details.action
    const nextState = initialAction === 'pause' ? 'paused' : 'playing';

    sequence.length = 0;    
    if (sequence.length !== 1) return;
    
    changePlaybackState(nextState, true);
}, actionsDelay);

const playOrPauseHandler = (details: MediaSessionActionDetails) => {
    const currentTime = Date.now();
    if (!sequence.length) {
        time = currentTime;
    }

    sequence.push({
        details: details,
        delta: currentTime - time,
    });
    time = currentTime;

    debouncedHandler(details);

    if (details.action === 'pause') {
        changePlaybackState('playing');
    } else {
        changePlaybackState('paused');
    }
}

session.setActionHandler('pause', playOrPauseHandler);
session.setActionHandler('play', playOrPauseHandler);

function isActionEmulated(action: MediaSessionAction) {
    return (
        emulatedActions.includes(action) ||
        action === 'pause' ||
        action === 'play'
    );
}

defineProperty(overridePrototype, 'setActionHandler', {
    value: function (
        this: MediaSession,
        action: MediaSessionAction,
        handler: MediaSessionActionHandler | null
    ): void {
        if (!isActionEmulated(action)) {
            return copiedPrototype.setActionHandler.call(session, action, handler);
        }

        if (!handler) {
            delete actionCallbackMap[action];
            return;
        }

        actionCallbackMap[action] = handler;
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

defineProperty(overridePrototype, 'metadata', {
    get: () => {
        return session.metadata;
    },
    set: (metadata: MediaMetadata | null) => {
        console.log('Set metadata:', metadata);
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

function changePlaybackState(
    playbackState: MediaSessionPlaybackState,
    updateWidget = false
) {
    session.playbackState = playbackState;
    console.log('MediaSession playbackState:', playbackState);

    if (updateWidget) {
        createNotification(playbackState, undefined, '1');
    }
}
