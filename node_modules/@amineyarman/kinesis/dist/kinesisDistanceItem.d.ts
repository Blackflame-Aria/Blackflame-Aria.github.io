import { KinesisDistanceItemOptions } from "./types";
declare class KinesisDistanceItem {
    private element;
    private options;
    private isActive;
    private initialTransform;
    private mouseX;
    private mouseY;
    private animationId;
    private duration;
    private easing;
    private readonly MIN_DISTANCE;
    private minimumDistance;
    constructor(element: HTMLElement, options?: KinesisDistanceItemOptions);
    private bindEvents;
    private onMouseMove;
    private calculateDistance;
    private getInteractionFactor;
    private applyTransform;
    private animate;
    destroy(): void;
}
export default KinesisDistanceItem;
