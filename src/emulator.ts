import { createNotification, requestNotificationPermission, updateNotification } from "./notification";

const config = {
    delay: 700,
    volumeDelta: 0.01,
};

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
        // @ts-expect-error TODO: related to @types/node
        // need to find a way to exclude src directory from it
        timer = setTimeout(callback, delay, ...args);
    };
}

const actionHandleCallbackMap: Partial<
    Record<
        MediaSessionAction,
        MediaSessionActionHandler
    >
> = {};

abstract class Handler {
    public title: string;

    constructor(title: string) {
        this.title = title;
    }

    public abstract handle(
        current: MediaSessionActionDetails,
        sequence: ActionSequenceItem[],
    ): void;
}

class MediaSessionHandler extends Handler {
    protected action: MediaSessionAction;

    constructor(action: MediaSessionAction) {
        super(action);

        this.action = action;
    }

    public handle(
        // @ts-ignore
        current: MediaSessionActionDetails,
        // @ts-ignore
        sequence: ActionSequenceItem[]
    ): void {
        const handler = actionHandleCallbackMap[this.action];

        handler?.({ action: this.action });
    }
}

class PlayOrPauseHandler extends MediaSessionHandler {
    constructor() {
        super('pause');
    }

    public handle(
        current: MediaSessionActionDetails,
        sequence: ActionSequenceItem[]
    ): void {
        this.action = current.action;
        this.title = this.action;

        super.handle(current, sequence);
    }
}

type ExitPosition = 'begin' | 'end';

type GroupHandlerOptions = {
    title: string;
    exitPosition: ExitPosition;
};

type HandlerSequence = Handler[];

const sequenceStack: HandlerSequence[] = [];

class GroupHandler extends Handler {
    protected handlers: HandlerSequence;

    public handle(): void {
        sequenceStack.unshift(this.handlers);
    }

    constructor(
        options: Partial<GroupHandlerOptions>,
        ...handlers: Handler[]
    ) {
        let title = 'group';
        if (options.title) {
            title += ` ${options.title}`;
        }

        super(title);
        this.handlers = handlers ?? [];

        const exitPosition = options.exitPosition ?? 'end';
        const exitHandler = new ExitHandler();

        if (exitPosition === 'end') {
            this.handlers.push(exitHandler);
        } else {
            this.handlers.unshift(exitHandler);
        }
    }
}

class ExitHandler extends Handler {
    constructor() {
        super('exit');
    }

    public handle(): void {
        sequenceStack.shift();
    }
}

class VolumeHandler extends Handler {
    protected delta: number;

    public handle(): void {
        
    }

    constructor(delta: number) {
        super(`volume ${delta}`);

        this.delta = delta;
    }
}

// class NotifyHandler extends Handler {
//     public handle(): void {
//         // turn on/off notification
//     }
// }

const emulatedActions: MediaSessionAction[] = [
    'pause',
    'play',
    'nexttrack',
    'previoustrack',
    'seekforward',
    'seekbackward',
];

const mainSequence = [
    new PlayOrPauseHandler(),
    new GroupHandler(
        { title: 'track' },
        new MediaSessionHandler('nexttrack'),
        new MediaSessionHandler('previoustrack'),
    ),
    new GroupHandler(
        { title: 'seek' },
        new MediaSessionHandler('seekforward'),
        new MediaSessionHandler('seekbackward'),
    ),
    new GroupHandler(
        { title: 'volume' },
        new VolumeHandler(config.volumeDelta),
        new VolumeHandler(-config.volumeDelta),
        new VolumeHandler(config.volumeDelta * 3),
        new VolumeHandler(-config.volumeDelta * 3),
    ),
];

sequenceStack.unshift(mainSequence);

function getNotificationBody() {
    const sequence = sequenceStack[0];
    const postfix = sequence
        .map((h, i) => `${i + 1} - ${h.title}`)
        .join(', ');

    return `${postfix}`
}

function getNotificationTitle(handler: string) {
    return `${session.playbackState}: (${handler})`;
}

const notificationId = 'notification-1';

type ActionSequenceItem = {
    delta: number;
    details: MediaSessionActionDetails;
};

type ActionSequence = ActionSequenceItem[];

const actionSequence: ActionSequence = [];
const actionsDelay = config.delay;

let time = 0;


const debouncedHandler = debounce((details: MediaSessionActionDetails) => {
    const sequence = sequenceStack[0];
    const handler = sequence[actionSequence.length - 1];

    if (handler) {
        handler.handle(details, actionSequence);
    }

    if (handler instanceof PlayOrPauseHandler) {
        const initialAction = actionSequence[0].details.action
        const nextState = initialAction === 'pause' ? 'paused' : 'playing';
        changePlaybackState(nextState);
    }

    actionSequence.length = 0;

    const body = getNotificationBody();
    const title = getNotificationTitle(handler?.title ?? 'no handler');

    createNotification(title, body, notificationId);       
}, actionsDelay);

const playOrPauseHandler = (details: MediaSessionActionDetails) => {
    const currentTime = Date.now();
    if (!actionSequence.length) {
        time = currentTime;
    }

    actionSequence.push({
        details: details,
        delta: currentTime - time,
    });
    time = currentTime;

    debouncedHandler(details);

    const playbackState = details.action === 'pause' ? 'playing' : 'paused';
    changePlaybackState(playbackState);
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
    update = false
) {
    session.playbackState = playbackState;
    console.log('MediaSession playbackState:', playbackState);

    if (update) {
        updateNotification(notificationId, playbackState, undefined);
    }
}

requestNotificationPermission();
