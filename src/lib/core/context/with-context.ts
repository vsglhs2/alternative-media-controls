import type { Context } from "../utils/context";
import type { CleanupCallback } from "../utils/global-value";
import type { InitialContextInput } from "./create-initial-context";
import type { MediaSessionInput, MediaSessionPrototypeInput } from "./override-media-session";

export type GlobalContext = Context<
    & MediaSessionInput
    & InitialContextInput
    & MediaSessionPrototypeInput
>;

// TODO (THINK): maybe redesign initialization logic?
// like not new LinearSequence(...), but 'linear': ...handlers

export abstract class WithGlobalContext {
    static context: GlobalContext | undefined;

    protected get context() {
        if (!WithGlobalContext.context) {
            throw new Error('Global context is not set')
        }

        return WithGlobalContext.context;
    }
}

export function setupGlobalContext(context: GlobalContext): CleanupCallback {
    WithGlobalContext.context = context;

    return () => {
        WithGlobalContext.context = undefined;
    };
}
