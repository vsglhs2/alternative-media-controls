import { createContext, GlobalValue } from "./utils";

export type Config = {
    delay: number;
    volumeDelta: number;
};

const defaultConfig: Config = {
    delay: 1000,
    volumeDelta: 0.01,
};
export const config = new GlobalValue<Config>(defaultConfig);


type Input = {
    config: Config
};

export function createConfigContext() {
    return createContext<Input>({
        config: defaultConfig,
    });

}
