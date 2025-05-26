import type { ActionSequence } from "../action";
import type { Handler } from "../handler";
import { HandlerSequence } from "./sequence";

export class LinearHandlerSequence extends HandlerSequence {
    public getHandler(
        current: MediaSessionActionDetails,
        sequence: ActionSequence
    ): Handler {
        return this.handlers[sequence.length - 1];
    }
}
