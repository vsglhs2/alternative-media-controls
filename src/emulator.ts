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
    
    return function(...args: Parameters<Callback>) {
        clearTimeout(timer);
        timer = setTimeout(callback, delay, ...args);
    };
}

type ActionItem = {
    time: number;
    details: MediaSessionActionDetails;
};
const actionStack: ActionItem[] = [];

const actionsDelay = 700;

defineProperty(overridePrototype, 'setActionHandler', {
    value: function (
        this: MediaSession,
        action: MediaSessionAction,
        handler: MediaSessionActionHandler | null
    ): void {
        let finalHandler = handler;
        if (handler && (action === 'pause' || action === 'play')) {
            const debounced = debounce((details: MediaSessionActionDetails) => {
                handler(details);

                for (let index = 0; index < actionStack.length - 1; index++) {
                    actionStack[index].time = actionStack[index + 1].time - actionStack[index].time;
                }
                actionStack[actionStack.length - 1].time = 0;

                console.log(...actionStack);    
                actionStack.length = 0;
            }, actionsDelay);

            finalHandler = (details) => {
                actionStack.push({
                    details: details,
                    time: Date.now(),
                });
                debounced(details);
            }
        }

        return copiedPrototype.setActionHandler.call(session, action, finalHandler);
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
        session.metadata = metadata;
    },
});

defineProperty(overridePrototype, 'playbackState', {
    get: () => {
        return session.playbackState;
    },
    set: (playbackState: MediaSessionPlaybackState) => {
        session.playbackState = playbackState;
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
