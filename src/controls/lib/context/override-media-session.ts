import { createContext, defineProperty } from "../utils";

type ActionHandleCallbackMap = Partial<
    Record<MediaSessionAction, MediaSessionActionHandler>
>;

export type MediaSessionInput = {
    session: MediaSession;
    actionHandleCallbackMap: ActionHandleCallbackMap;
    interceptedActions: MediaSessionAction[];
    globalMetadata: MediaMetadata | null;
};

export function overrideMediaSession() {
    const MediaSession = self.MediaSession;
    const mediaSession = navigator.mediaSession;

    const overridePrototype = {} as MediaSession;

    const context = createContext<MediaSessionInput>({
        session: mediaSession,
        actionHandleCallbackMap: {},
        interceptedActions: [],
        globalMetadata: null,
    });

    function isActionIntercepted(action: MediaSessionAction) {
        return (
            context.interceptedActions.includes(action) ||
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

    defineProperty(overridePrototype, 'playbackState', {
        get: () => {
            return mediaSession.playbackState;
        },
        set: (playbackState: MediaSessionPlaybackState) => {
            mediaSession.playbackState = playbackState;
            console.log('MediaSession playbackState:', playbackState);
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
