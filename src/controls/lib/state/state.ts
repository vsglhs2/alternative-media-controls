import { globalVolume } from "../../override/audio";
import { globalMetadata, session } from "../override";
import { sequenceStack } from "../sequence";

// class State {}
// class NotificationState extends State {}
// class MetadataState extends State {}
// class UIState extends State {}
// class LogState extends State {}

export function getNotificationBody() {
    const sequence = sequenceStack.head()!;
    const postfix = sequence.handlers
        .map((h, i) => `${i + 1} - ${h.title}`)
        .join(', ');

    return `${postfix} (volume = ${globalVolume.value})`;
}

export function getNotificationTitle(handler?: string) {
    let title = session.playbackState as string;
    if (handler) {
        title = `${title}: (${handler})`;
    }

    return title;
}

export function getUpdatedMetadata(title: string, body: string) {
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