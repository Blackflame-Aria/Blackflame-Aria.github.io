declare class KinesisPathElement {
    element: HTMLElement;
    strength: number;
    initialOffset: number;
    pathLength: number;
    transitionDuration: number;
    pathData: string;
    constructor(element: HTMLElement, pathData: string, pathLength: number);
    updatePosition(progress: number): void;
    resetPosition(throttleDuration: number): void;
}
export default KinesisPathElement;
