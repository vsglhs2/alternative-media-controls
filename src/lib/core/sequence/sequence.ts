import type { ActionSequence } from "../action";
import { Handle, Handler } from "../handler";

export abstract class HandlerSequence extends Handle {
    public handlers: Handler[];

    public handle(
        current: MediaSessionActionDetails,
        sequence: ActionSequence
    ): void {
        const handler = this.getHandler(current, sequence);
        this.context.activeHandler = handler;
        
        if (handler) {
            handler.handle(current, sequence);
        }
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
