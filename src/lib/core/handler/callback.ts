import { Handler } from "./handler";

export class CallbackHandler extends Handler {
    private onHandle: () => void;

    constructor(title: string, onHandle: () => void) {
        super(title);

        this.onHandle = onHandle;
    }

    public handle(): void {
        this.onHandle();
    }
}