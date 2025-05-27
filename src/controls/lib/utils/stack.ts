export class Stack<T> {
    private readonly stack: T[];
    
    public get inner(): readonly T[] {
        return this.stack;
    }

    constructor(stack: T[] = []) {
        this.stack = stack;
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

    tail(): T | undefined {
        return this.stack[0];
    }

    reset() {
        this.stack.length = 0;
    }
}