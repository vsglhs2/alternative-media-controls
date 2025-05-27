import { GlobalValue } from "../../core";
import { defineProperty } from "../../core/utils";
import type { CleanupCallback } from "../../core/utils/global-value";

export const globalVolume = new GlobalValue(1);

export function overrideAudio(): CleanupCallback {
    const Audio = window.Audio;
    const cleanups: CleanupCallback[] = [];

    const overrideAudio = function (this: HTMLAudioElement, src?: string) {
        const audio = new Audio(src);
        Object.setPrototypeOf(this, audio);

        let rawVolume = audio.volume;

        function valueBetween(volume: number, min = 0, max = 1) {
            return Math.max(min, Math.min(max, volume));
        }

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

        cleanups.push(
            () => {
                audio.volume = rawVolume;
                // @ts-ignore
                delete this['volume'];
            },
            cleanup,
        );

        return audio;
    }

    defineProperty(overrideAudio, 'name', {
        value: 'Audio',
    });

    defineProperty(window, 'Audio', {
        value: overrideAudio,
    });

    return () => {
        defineProperty(window, 'Audio', {
            value: Audio,
        });

        for (const cleanup of cleanups) {
            cleanup();
        }
    };
}

