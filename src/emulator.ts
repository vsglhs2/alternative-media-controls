import { createNotification, requestNotificationPermission, updateNotification } from "./notification";

const config = {
    delay: 1000,
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

abstract class Handle {
    public abstract handle(
        current: MediaSessionActionDetails,
        sequence: ActionSequenceItem[],
    ): void;    
}

abstract class Handler extends Handle {
    public title: string;

    constructor(title: string) {
        super();

        this.title = title;
    }
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

        const initialAction = sequence[0].details.action;
        const nextState = initialAction === 'pause' ? 'paused' : 'playing';
        changePlaybackState(nextState);
    }
}

type ExitPosition = 'begin' | 'end';

type GroupHandlerOptions = {
    title: string;
    exitPosition: ExitPosition;
    onExit: () => void;
};

const sequenceStack: LinearHandlerSequence[] = [];

class GroupHandler extends Handler {
    protected handlers: Handler[];

    public handle(): void {
        sequenceStack.unshift(new LinearHandlerSequence(this.handlers));
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

        const onExit = () => {
            sequenceStack.shift();

            options.onExit?.();
        };
        const exitHandler = new CallbackHandler('exit', onExit);

        const exitPosition = options.exitPosition ?? 'end';        
        if (exitPosition === 'end') {
            this.handlers.push(exitHandler);
        } else {
            this.handlers.unshift(exitHandler);
        }
    }
}

class CallbackHandler extends Handler {
    private onHandle: () => void;

    constructor(title: string, onHandle: () => void) {
        super(title);

        this.onHandle = onHandle;
    }

    public handle(): void {
        this.onHandle();
    }
}

class GlobalValue<T> extends EventTarget {
    #value: T;

    get value() {
        return this.#value;
    }

    set value(value: T) {
        this.#value = value;

        const event = new CustomEvent('value', {
            detail: value,
        });
        this.dispatchEvent(event);
    }

    constructor(initial: T) {
        super();

        this.#value = initial;
    }
}

const globalVolume = new GlobalValue(1);

class VolumeHandler extends Handler {
    protected delta: number;

    public handle(): void {
        globalVolume.value += this.delta;
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

class InputCharacterHandler extends Handler {
    protected character: string;
    protected onCharacter: (character: string) => void;

    constructor(
        character: string,
        onCharacter: (character: string) => void
    ) {
        const title = `Character ${character}`;
        super(title);

        this.character = character;
        this.onCharacter = onCharacter;
    }

    public handle(): void {
        this.onCharacter(this.character);
    }
}

class InputHandler extends GroupHandler {
    protected characters: string;

    constructor(
        characters: string | string[],
        onInput: (characters: string) => void,
    ) {
        const handlers: Handler[] = [];

        for (const character of characters) {
            const handler = new InputCharacterHandler(
                character, 
                (character) => {
                    this.characters += character;
                },
            );
            handlers.push(handler);
        }

        const clearHandler  =new CallbackHandler(
            'clear', 
            () => this.characters = ''
        );
        handlers.push(clearHandler);

        const onExit = () => onInput(this.characters);
        super({ title: 'Input', onExit: onExit }, ...handlers);

        this.characters = '';
    }
}

const emulatedActions: MediaSessionAction[] = [
    'pause',
    'play',
    'nexttrack',
    'previoustrack',
    'seekforward',
    'seekbackward',
];

abstract class HandlerSequence extends Handle {
    public handlers: Handler[];

    public handle(
        current: MediaSessionActionDetails,
        sequence: ActionSequenceItem[]
    ): void {
        const handler = this.getHandler(current, sequence);
        if (handler) {
            handler.handle(current, sequence);
        }

        const body = getNotificationBody();
        const handlerTitle = handler?.title ?? 'no handler';
        const title = getNotificationTitle(handlerTitle);

        createNotification(title, body, notificationId);
        console.log('Handled sequence:', sequence.map(a => a.details.action));

        let chosenTitle = `${handler?.constructor.name ?? 'Not handler'}`;
        if (handlerTitle) {
            chosenTitle += ` (${handlerTitle})`;
        }
        console.log('Choose handler:', chosenTitle);
        console.log('Route:', body);

        // TODO: make this optionally
        session.metadata = getUpdatedMetadata(handlerTitle, body);
    }

    public abstract getHandler(
        current: MediaSessionActionDetails,
        sequence: ActionSequenceItem[]
    ): Handler | undefined;

    constructor(handlers: Handler[]) {
        super();
        this.handlers = handlers;
    }
}

class LinearHandlerSequence extends HandlerSequence {
    public getHandler(
        current: MediaSessionActionDetails,
        sequence: ActionSequenceItem[]
    ): Handler {
        return this.handlers[sequence.length - 1];
        
    }
}

const mainSequence = new LinearHandlerSequence([
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
        new VolumeHandler(config.volumeDelta * 3),
        new VolumeHandler(-config.volumeDelta * 3),
        new InputHandler('1234567890', c => {
            if (!c) return;

            const parsed = parseInt(c);
            if (isNaN(parsed)) return;

            globalVolume.value = parsed / 100;
        }),
    ),
]);

sequenceStack.unshift(mainSequence);

function getNotificationBody() {
    const sequence = sequenceStack[0];
    const postfix = sequence.handlers
        .map((h, i) => `${i + 1} - ${h.title}`)
        .join(', ');

    return `${postfix} (volume = ${globalVolume.value})`;
}

function getNotificationTitle(handler?: string) {
    let title = session.playbackState as string;
    if (handler) {
        title = `${title}: (${handler})`;
    }

    return title;
}

function getUpdatedMetadata(title: string, body: string) {
    const data: MediaMetadataInit = {
        title: globalMetadata.value?.title,
        album: globalMetadata.value?.album,
        artist: globalMetadata.value?.artist,
        artwork: globalMetadata.value?.artwork?.slice(),
    };

    if (title) {
        data.title = `${data.title} (${session.playbackState}) (${title})`;
    }

    if (data.artist) {
        data.artist = `${data.artist} (${body})`;
    }
    
    return new MediaMetadata(data);
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
    sequence.handle(details, actionSequence);

    actionSequence.length = 0;
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

const globalMetadata = new GlobalValue<MediaMetadata | null>(null);

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

// TODO: find out why not every webpage shows permission request
requestNotificationPermission();

const Audio = window.Audio;
const overrideAudio = function (this: HTMLAudioElement, src?: string) {
    const audio = new Audio(src);
    Object.setPrototypeOf(this, audio);

    let rawVolume = audio.volume;

    function valueBetween(volume: number, min = 0, max = 1) {
        return Math.max(min, Math.min(max, volume));
    }

    // TODO: add cleanup
    // TODO: notify when audio.volume > 1
    globalVolume.addEventListener('value', (event) => {
        const { detail: value } = event as CustomEvent<number>;


        audio.volume = valueBetween(rawVolume * value);
    });

    defineProperty(this, 'volume', {
        set(volume: number) {
            rawVolume = volume;
            audio.volume = valueBetween(rawVolume * globalVolume.value);
        },
        get() {
            return rawVolume;
        },
    });

    return audio;
}

defineProperty(overrideAudio, 'name', {
    value: 'Audio',
});

defineProperty(window, 'Audio', {
    value: overrideAudio,
});