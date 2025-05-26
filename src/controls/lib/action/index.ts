import { createContext } from "../utils";

export type ActionSequenceItem = {
    delta: number;
    details: MediaSessionActionDetails;
};

export type ActionSequence = ActionSequenceItem[];

type Input = {
    actionSequence: ActionSequence
};

export function createActionContext() {
    return createContext<Input>({
        actionSequence: [],
    });
}