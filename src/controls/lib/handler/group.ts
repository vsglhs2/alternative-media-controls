
import { LinearHandlerSequence } from "../sequence";
import { CallbackHandler } from "./callback";
import { Handler } from "./handler";

export type ExitPosition = 'begin' | 'end';

export type GroupHandlerOptions = {
    title: string;
    exitPosition: ExitPosition;
    onExit: () => void;
};

export class GroupHandler extends Handler {
    protected handlers: Handler[];

    public handle(): void {
        this.context.sequenceStack.push(new LinearHandlerSequence(this.handlers));
    }

    constructor(
        options: Partial<GroupHandlerOptions>,
        ...handlers: Handler[]
    ) {
        let title = 'group';
        if (options.title) {
            title += ` ${options.title}`;
        }

        super(title);
        this.handlers = handlers ?? [];

        const onExit = () => {
            this.context.sequenceStack.pop();

            options.onExit?.();
        };
        const exitHandler = new CallbackHandler('exit', onExit);

        const exitPosition = options.exitPosition ?? 'end';        
        if (exitPosition === 'end') {
            this.handlers.push(exitHandler);
        } else {
            this.handlers.unshift(exitHandler);
        }
    }
}