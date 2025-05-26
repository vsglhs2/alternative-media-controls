import { LinearHandlerSequence, sequenceStack } from "./controls/lib/sequence";
import { requestNotificationPermission } from "./controls/lib/notification";
import { VolumeHandler } from "./controls/handler";
import { GroupHandler, MediaSessionHandler, InputHandler } from "./controls/lib/handler";
import { globalVolume } from "./controls/override/audio";
import { config } from "./controls/lib/config";
import { PassActionHandler } from "./controls/lib/handler/media-session";


config.value = {
    delay: 1000,
    volumeDelta: 0.1,
};

context.interceptedActions = [
    'pause',
    'play',
    'nexttrack',
    'previoustrack',
    'seekforward',
    'seekbackward',
    'seekto',
];

const mainSequence = new LinearHandlerSequence([
    new PassActionHandler(),
    new GroupHandler(
        {title: 'playback' },
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
        new VolumeHandler(config.value.volumeDelta * 3),
        new VolumeHandler(-config.value.volumeDelta * 3),
        new InputHandler('1234567890', c => {
            if (!c) return;

            const parsed = parseInt(c);
            if (isNaN(parsed)) return;

            globalVolume.value = parsed / 100;
        }),
    ),
]);

sequenceStack.value.push(mainSequence);

// TODO: find out why not every webpage shows permission request
requestNotificationPermission();
