import { WithGlobalContext, type GlobalContext } from "./with-context";

export function setupGlobalContext(context: GlobalContext) {
    WithGlobalContext.context = context;

    context.on('release', () => {
        WithGlobalContext.context = undefined;
    });
}
