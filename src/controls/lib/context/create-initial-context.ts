
import type { ActionSequence } from "../action";
import { defaultConfig, type Config } from "../config";
import type { HandlerSequence } from "../sequence";
import { Stack, createContext } from "../utils";

export type InitialContextInput = {
    sequenceStack: Stack<HandlerSequence>;
    actionSequence: ActionSequence;
    config: Config;
    notificationId: string;
};

export function createInitialContext() {
    const sequenceStack = new Stack<HandlerSequence>();
    const actionSequence: ActionSequence = [];
    const config = defaultConfig;
    const notificationId = 'notification-1';
    
    return createContext<InitialContextInput>({
        sequenceStack,
        actionSequence,
        config,
        notificationId,
    });    
}
