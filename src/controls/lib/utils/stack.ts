export class Stack<T> {
    private stack: T[];

    constructor() {
        this.stack = [];
    }

    push(item: T) {
        this.stack.push(item);
    }

    pop(): T | undefined {
        return this.stack.pop();
    }

    head(): T | undefined {
        return this.stack[this.stack.length - 1];
    }
}