export type Config = {
    delay: number;
    volumeDelta: number;
};

export const defaultConfig: Config = {
    delay: 1000,
    volumeDelta: 0.01,
};
