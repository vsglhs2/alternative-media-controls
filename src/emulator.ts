import { sequenceSourceActions } from "./controls/lib/override/media-session";
import { LinearHandlerSequence, sequenceStack } from "./controls/lib/sequence";
import { requestNotificationPermission } from "./controls/lib/notification";
import { VolumeHandler } from "./controls/handler";
import { PlayOrPauseHandler, GroupHandler, MediaSessionHandler, InputHandler } from "./controls/lib/handler";
import { globalVolume } from "./controls/override/audio";
import { config } from "./controls/lib/config";

config.value = {
    delay: 1000,
    volumeDelta: 0.1,
};

sequenceSourceActions.value = [
    'pause',
    'play',
    'nexttrack',
    'previoustrack',
    'seekforward',
    'seekbackward',
];

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

sequenceStack.push(mainSequence);

// TODO: find out why not every webpage shows permission request
requestNotificationPermission();
