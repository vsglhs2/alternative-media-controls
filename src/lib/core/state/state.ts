import type { ActionSequenceItem } from "../action";
import type { GlobalContext } from "../context/with-context";
import type { Handler } from "../handler";
import type { HandlerSequence } from "../sequence";
import { Stack } from "../utils";

export type State = Readonly<{
    sequenceStack: Stack<HandlerSequence>;
    actionSequence: readonly ActionSequenceItem[];
    activeHandler: Handler | undefined;
    interceptedActions: readonly MediaSessionAction[];
    handleDelay: number;
}>;

export function createDefaultState(): State {
    return {
        sequenceStack: new Stack(),
        actionSequence: [],
        activeHandler: undefined,
        interceptedActions: [],
        handleDelay: 0,
    };
}

export function createStateFromContext(context: GlobalContext): State {
    return {
        sequenceStack: new Stack(context.sequenceStack.inner.slice()),
        actionSequence: context.actionSequence.slice(),
        activeHandler: context.activeHandler,
        interceptedActions: context.interceptedActions.slice(),
        handleDelay: context.handleDelay,
    };
}
