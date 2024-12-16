import { TransformAxisType, TransformType, InteractionAxisType } from "./types";
declare class KinesisTransformerElement {
    element: HTMLElement;
    strength: number;
    type: TransformType;
    transformAxis: TransformAxisType[];
    interactionAxis: InteractionAxisType | null;
    initialTransform: string;
    transformOrigin: string;
    mutationObserver: MutationObserver;
    rafId: number | null;
    constructor(element: HTMLElement);
    updatePropertiesFromAttributes(): void;
    handleAttributeChange: (mutationsList: MutationRecord[]) => void;
    applyTransform(x: number, y: number): void;
    performTransform(x: number, y: number): void;
    resetTransform(): void;
    destroy(): void;
}
export default KinesisTransformerElement;
