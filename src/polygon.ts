import { VolumeHandler } from "./controls/handler";
import { alternativeMediaSession, CallbackHandler, GroupHandler, InputHandler, LinearHandlerSequence, MediaSessionHandler, PassActionHandler, requestNotificationPermission } from "./controls/lib";
import { globalVolume } from "./controls/override/audio";

alternativeMediaSession.initialize();
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
    new CallbackHandler('release', () => {
        alternativeMediaSession.release();
    }),
]);

// TODO: find out why not every webpage shows permission request
requestNotificationPermission();

setTimeout(() => {
    alternativeMediaSession.initialize();
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
        new CallbackHandler('release', () => {
            alternativeMediaSession.release();
        }),
    ]);
}, 10000);