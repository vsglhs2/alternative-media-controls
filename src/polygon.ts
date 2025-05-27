
import { alternativeMediaSession, CallbackHandler, GroupHandler, InputHandler, LinearHandlerSequence, MediaSessionHandler, PassActionHandler, requestNotificationPermission, type EventKey, type State } from "./lib/core";
import { globalVolume, VolumeHandler, overrideAudio } from "./lib/extra/audio";

function startSession() {
    console.log('Starting session');

    const cleanup = overrideAudio();

    function callback(key: EventKey, state: State) {
        console.log(key, state);
    }

    alternativeMediaSession.on('start', callback);
    alternativeMediaSession.on('stop', callback);
    alternativeMediaSession.on('state', callback);
    alternativeMediaSession.on('sequence', callback);
    alternativeMediaSession.on('action', callback);
    alternativeMediaSession.on('handler', callback);

    alternativeMediaSession.start();
    alternativeMediaSession.handleDelay = 700;

    alternativeMediaSession.interceptActions = [
        'pause',
        'play',
        'nexttrack',
        'previoustrack',
        'seekforward',
        'seekbackward',
        'seekto',
    ];

    alternativeMediaSession.handlerSequence = new LinearHandlerSequence([
        new PassActionHandler(),
        new GroupHandler(
            { title: 'playback' },
            new MediaSessionHandler('play'),
            new MediaSessionHandler('pause'),
        ),
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
            new VolumeHandler(0.03),
            new VolumeHandler(-0.03),
            new InputHandler('1234567890', c => {
                if (!c) return;

                const parsed = parseInt(c);
                if (isNaN(parsed)) return;

                globalVolume.value = parsed / 100;
            }),
        ),
        new CallbackHandler('stop', () => {
            setTimeout(() => {
                alternativeMediaSession.stop();
                cleanup();
            });

            console.log('stopped session');
        }),
    ]);
}

declare global {
    interface Window {
        startSession: typeof startSession;
    }
}

window.startSession = startSession;

// TODO: find out why not every webpage shows permission request (on android firefox)
requestNotificationPermission();   

startSession();