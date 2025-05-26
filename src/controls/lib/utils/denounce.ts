import { defineProperty } from "./define-property";

type Debounced<Callback extends (...args: any[]) => any> = {
    (...args: Parameters<Callback>): unknown;
    delay: number;
};

export function debounce<Callback extends (...args: any[]) => any>(
    callback: Callback,
    delay: number
) {
    let timer: ReturnType<typeof setTimeout>;
    let finalDelay = delay;

    const debounced = function (...args: Parameters<Callback>) {
        clearTimeout(timer);
        // @ts-expect-error TODO: related to @types/node
        // need to find a way to exclude src directory from it
        timer = setTimeout(callback, finalDelay, ...args);
    };
    defineProperty(debounced, 'name', {
        value: `debounced ${callback.name}`,
    });

    defineProperty(debounced, 'delay', {
        set(delay) { finalDelay = delay },
        get: () => finalDelay,
    })

    return debounced as Debounced<Callback>;
}
