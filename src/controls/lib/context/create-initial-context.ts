
import type { ActionSequence } from "../action";
import type { HandlerSequence } from "../sequence";
import { Stack, createContext } from "../utils";

export type InitialContextInput = {
    sequenceStack: Stack<HandlerSequence>;
    actionSequence: ActionSequence;
    handleDelay: number;
    notificationId: string;
};

export function createInitialContext() {
    const sequenceStack = new Stack<HandlerSequence>();
    const actionSequence: ActionSequence = [];
    const handleDelay = 700;
    const notificationId = 'notification-1';
    
    return createContext<InitialContextInput>({
        sequenceStack,
        actionSequence,
        handleDelay,
        notificationId,
    });    
}
