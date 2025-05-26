import type { ActionSequence } from "../action";
import { actionHandleCallbackMap, changePlaybackState } from "../override/media-session";
import { Handler } from "./handler";

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

export class PlayOrPauseHandler extends MediaSessionHandler {
    constructor() {
        super('pause');
    }

    public handle(
        current: MediaSessionActionDetails,
        sequence: ActionSequence
    ): void {
        this.action = current.action;
        this.title = this.action;

        super.handle(current, sequence);

        const initialAction = sequence[0].details.action;
        const nextState = initialAction === 'pause' ? 'paused' : 'playing';
        changePlaybackState(nextState);
    }
}