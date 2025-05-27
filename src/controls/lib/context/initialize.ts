import { setupSessionIntercept } from "./setup-session-intercept";
import { setupGlobalContext } from "./setup-global";
import type { GlobalContext } from "./with-context";
import { overrideMediaSession } from "./override-media-session";
import { createInitialContext } from "./create-initial-context";
import { mergeContexts } from "../utils";

export function initializeContext() {
    const initialContext = createInitialContext();
    const sessionContext = overrideMediaSession();
    
    const context: GlobalContext = mergeContexts(
        initialContext,
        sessionContext
    );

    setupSessionIntercept(context);
    setupGlobalContext(context);

    return context;
}