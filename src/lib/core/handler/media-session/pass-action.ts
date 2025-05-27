import type { ActionSequence } from "../../action";
import { MediaSessionHandler } from "./media-session";

export class PassActionHandler extends MediaSessionHandler {
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
    }
}