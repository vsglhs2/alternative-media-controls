import { Handle } from "./handle";

export abstract class Handler extends Handle {
    public title: string;

    constructor(title: string) {
        super();

        this.title = title;
    }
}