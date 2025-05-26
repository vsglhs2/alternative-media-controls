export class Stack<T> {
    private readonly stack: T[];
    
    public get inner(): readonly T[] {
        return this.stack;
    }

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