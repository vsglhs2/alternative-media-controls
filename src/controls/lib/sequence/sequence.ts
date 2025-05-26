import type { ActionSequence } from "../action";
import { Handle, Handler } from "../handler";
import { createNotification } from "../notification";
import { getNotificationBody, getNotificationTitle, getUpdatedMetadata } from "../state";

export abstract class HandlerSequence extends Handle {
    public handlers: Handler[];

    public handle(
        current: MediaSessionActionDetails,
        sequence: ActionSequence
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

        // TODO: make this optionally (via state view)
        session.metadata = getUpdatedMetadata(handlerTitle, body);
    }

    public abstract getHandler(
        current: MediaSessionActionDetails,
        sequence: ActionSequence
    ): Handler | undefined;

    constructor(handlers: Handler[]) {
        super();
        
        this.handlers = handlers;
    }
}
