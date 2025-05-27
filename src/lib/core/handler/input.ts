import { CallbackHandler } from "./callback";
import { GroupHandler } from "./group";
import { Handler } from "./handler";

export class InputCharacterHandler extends Handler {
    protected character: string;
    protected onCharacter: (character: string) => void;

    constructor(
        character: string,
        onCharacter: (character: string) => void
    ) {
        const title = `Character ${character}`;
        super(title);

        this.character = character;
        this.onCharacter = onCharacter;
    }

    public handle(): void {
        this.onCharacter(this.character);
    }
}

export class InputHandler extends GroupHandler {
    protected characters: string;

    constructor(
        characters: string | string[],
        onInput: (characters: string) => void,
    ) {
        const handlers: Handler[] = [];

        for (const character of characters) {
            const handler = new InputCharacterHandler(
                character, 
                (character) => {
                    this.characters += character;
                },
            );
            handlers.push(handler);
        }

        const clearHandler  =new CallbackHandler(
            'clear', 
            () => this.characters = ''
        );
        handlers.push(clearHandler);

        const onExit = () => onInput(this.characters);
        super({ title: 'Input', onExit: onExit }, ...handlers);

        this.characters = '';
    }
}