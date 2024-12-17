import { TransformType, TransformAxisType } from "./types";
declare class KinesisAudioElement {
    element: HTMLElement;
    audioIndex: number;
    strength: number;
    transform: TransformType;
    transformAxis: TransformAxisType[];
    transformOrigin: string;
    initialTransform: string;
    private previousValue;
    constructor(element: HTMLElement);
    private getDefaultAxes;
    applyTransform(value: number): void;
    resetTransform(): void;
}
export default KinesisAudioElement;
