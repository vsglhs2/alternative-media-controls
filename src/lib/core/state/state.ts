import { globalVolume } from "../../override/audio";
import { WithGlobalContext } from "../context/with-context";

// class State {}
// class NotificationState extends State {}
// class MetadataState extends State {}
// class UIState extends State {}
// class LogState extends State {}

export class State extends WithGlobalContext {
    getNotificationBody() {
        const sequence = this.context.sequenceStack.head()!;
        const postfix = sequence.handlers
            .map((h, i) => `${i + 1} - ${h.title}`)
            .join(', ');

        return `${postfix} (volume = ${globalVolume.value})`;
    }

    getNotificationTitle(handler?: string) {
        let title =  this.context.session.playbackState as string;
        if (handler) {
            title = `${title}: (${handler})`;
        }

        return title;
    }

    getUpdatedMetadata(title: string, body: string) {
        const { globalMetadata, session } = this.context;

        const data: MediaMetadataInit = {
            title: globalMetadata?.title,
            album: globalMetadata?.album,
            artist: globalMetadata?.artist,
            artwork: globalMetadata?.artwork?.slice(),
        };

        if (title) {
            data.title = `${data.title} (${session.playbackState}) (${title})`;
        }

        if (data.artist) {
            data.artist = `${data.artist} (${body})`;
        }

        return new MediaMetadata(data);
    }
}

