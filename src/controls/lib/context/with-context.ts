import type { Context } from "../utils/context";
import type { InitialContextInput } from "./create-initial-context";
import type { MediaSessionInput } from "./override-media-session";

export type GlobalContext = Context<MediaSessionInput & InitialContextInput>;

// THINK: maybe redesign initialization logic?
// like not new LinearSequence(...), but 'linear': ...handlers

export abstract class WithGlobalContext {
    static context: GlobalContext | undefined;
    
    protected get context() {
        if (!WithGlobalContext.context) {
            throw new Error('Global context is not set')
        }

        return WithGlobalContext.context;
    }

    constructor() {}
}
