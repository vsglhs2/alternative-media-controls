import type { ActionSequence } from "../action";
import { WithGlobalContext } from "../context/with-context";

export abstract class Handle extends WithGlobalContext {
    public abstract handle(
        current: MediaSessionActionDetails,
        sequence: ActionSequence,
    ): void;
}
