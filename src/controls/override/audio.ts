import { defineProperty, GlobalValue } from "../lib/utils";

export const globalVolume = new GlobalValue(1);

const Audio = window.Audio;
const overrideAudio = function (this: HTMLAudioElement, src?: string) {
    const audio = new Audio(src);
    Object.setPrototypeOf(this, audio);

    let rawVolume = audio.volume;

    function valueBetween(volume: number, min = 0, max = 1) {
        return Math.max(min, Math.min(max, volume));
    }

    // TODO: add cleanup
    // TODO: notify when audio.volume > 1
    const cleanup = globalVolume.on((volume) => {
        globalVolume.value = valueBetween(volume);
        audio.volume = valueBetween(rawVolume * globalVolume.value);
    });

    defineProperty(this, 'volume', {
        set(volume: number) {
            rawVolume = volume;
            audio.volume = valueBetween(rawVolume * globalVolume.value);
        },
        get() {
            return rawVolume;
        },
    });

    return audio;
}

defineProperty(overrideAudio, 'name', {
    value: 'Audio',
});

defineProperty(window, 'Audio', {
    value: overrideAudio,
});
