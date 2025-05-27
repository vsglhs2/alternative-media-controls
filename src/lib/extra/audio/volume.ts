import { Handler } from "../../core/handler";
import { globalVolume } from "./audio";

export class VolumeHandler extends Handler {
    protected delta: number;

    public handle(): void {
        globalVolume.value += this.delta;
    }

    constructor(delta: number) {
        super(`volume ${delta}`);

        this.delta = delta;
    }
}