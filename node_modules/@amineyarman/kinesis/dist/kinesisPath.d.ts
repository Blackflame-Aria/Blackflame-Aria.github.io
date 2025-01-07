import { KinesisPathOptions } from "./types";
import KinesisPathElement from "./kinesisPathElement";
declare class KinesisPath {
    container: HTMLElement;
    elements: KinesisPathElement[];
    options: Required<KinesisPathOptions>;
    isActive: boolean;
    interaction: "mouse" | "scroll";
    throttleDuration: number;
    globalPath: string;
    globalPathLength: number;
    constructor(container: HTMLElement, options?: KinesisPathOptions);
    init(): void;
    calculatePathLength(pathData: string): number;
    bindMoveEvents(): void;
    onMouseMove: (event: MouseEvent) => void;
    onMouseLeave: () => void;
    bindScrollEvents(): void;
    onScroll: () => void;
}
export default KinesisPath;
