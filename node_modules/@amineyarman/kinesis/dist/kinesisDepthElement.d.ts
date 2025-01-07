declare class KinesisDepthElement {
    element: HTMLElement;
    depth: number;
    initialTransform: string;
    constructor(element: HTMLElement);
    applyDepth(newDepth: number): void;
    resetDepth(): void;
}
export default KinesisDepthElement;
