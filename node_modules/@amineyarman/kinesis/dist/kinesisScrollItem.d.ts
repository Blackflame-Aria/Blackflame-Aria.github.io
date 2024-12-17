import { KinesisScrollItemOptions, TransformAxisType, TransformType } from "./types";
declare class KinesisScrollItem {
    element: HTMLElement;
    options: KinesisScrollItemOptions;
    isActive: boolean;
    initialTransform: string;
    transformType: TransformType;
    transformAxis: TransformAxisType[];
    strength: number;
    observer: IntersectionObserver | null;
    throttleDuration: number;
    constructor(element: HTMLElement, options?: KinesisScrollItemOptions);
    init(): void;
    setupScrollInteraction(): void;
    startScrollAnimation(): void;
    onScroll: () => void;
    applyTransform(progress: number): void;
    resetTransform(): void;
}
export default KinesisScrollItem;
