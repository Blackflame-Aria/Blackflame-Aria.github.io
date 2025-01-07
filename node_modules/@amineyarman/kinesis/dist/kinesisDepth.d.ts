import { KinesisDepthOptions } from "./types";
import KinesisDepthElement from "./kinesisDepthElement";
declare class KinesisDepth {
    container: HTMLElement;
    elements: KinesisDepthElement[];
    options: Required<KinesisDepthOptions>;
    isActive: boolean;
    initialTransform: string;
    perspective: number;
    sensitivity: number;
    inverted: boolean;
    observer: IntersectionObserver | null;
    throttleDuration: number;
    isMouseInside: boolean;
    constructor(container: HTMLElement, options?: KinesisDepthOptions);
    init(): void;
    bindHoverEvents(): void;
    onMouseEnter: () => void;
    onMouseMove: (event: MouseEvent) => void;
    onMouseLeave: () => void;
}
export default KinesisDepth;
