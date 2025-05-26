import { actionHandleCallbackMap } from "../../override/media-session";
import { Handler } from "../handler";

export class MediaSessionHandler extends Handler {
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