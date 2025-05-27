import type { ActionSequence } from "../../action";
import { PassActionHandler } from "./pass-action";

export class PlayOrPauseHandler extends PassActionHandler {
    public handle(
        current: MediaSessionActionDetails,
        sequence: ActionSequence
    ): void {
        if (current.action !== 'pause' && current.action !== 'play') {
            this.title = 'ignoring';
            return;
        }

        super.handle(current, sequence);

        const initialAction = sequence[0].details.action;
        const nextState = initialAction === 'pause' ? 'paused' : 'playing';

        this.context.session.playbackState = nextState;
    }
}