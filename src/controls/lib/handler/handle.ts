import type { ActionSequence } from "../action";

export abstract class Handle {
    public abstract handle(
        current: MediaSessionActionDetails,
        sequence: ActionSequence,
    ): void;
}
