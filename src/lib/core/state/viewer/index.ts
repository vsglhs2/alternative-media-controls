// TODO: move to more appropriate place

// const state = new State();

// const body = state.getNotificationBody();
// const handlerTitle = handler?.title ?? 'no handler';
// const title = state.getNotificationTitle(handlerTitle);

// createNotification(title, body, this.context.notificationId);
// console.log('Handled sequence:', sequence.map(a => a.details.action));

// let chosenTitle = `${handler?.constructor.name ?? 'Not handler'}`;
// if (handlerTitle) {
//     chosenTitle += ` (${handlerTitle})`;
// }
// console.log('Choose handler:', chosenTitle);
// console.log('Route:', body);

// // TODO: make this optionally (via state view)
// this.context.session.metadata = state.getUpdatedMetadata(handlerTitle, body);

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
        let title = this.context.session.playbackState as string;
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

