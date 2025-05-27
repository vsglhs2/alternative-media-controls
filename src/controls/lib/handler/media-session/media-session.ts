import { isInterceptHandler } from "../../context/setup-session-intercept";
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
        let handler = this.context.actionHandleCallbackMap[this.action];
        if (!handler) {
            const candidate = this.context.sessionCallbackMap[this.action];

            if (candidate && !isInterceptHandler(candidate)) {
                handler = candidate;
            }
        }

        handler?.({ action: this.action });
    }
}