import { TransformAxisType } from "./types";
/**
 * Clamps a value between a specified minimum and maximum range.
 *
 * @param value - The value to clamp.
 * @param min - The minimum allowed value.
 * @param max - The maximum allowed value.
 * @returns The clamped value.
 */
export declare function clamp(value: number, min: number, max: number): number;
/**
 * Gets the normalized position of the mouse relative to the center of an element.
 *
 * @param event - The mouse event containing the cursor position.
 * @param element - The element to which the mouse position is relative.
 * @returns An object containing normalized x and y coordinates, with respect to the element center.
 */
export declare function getMousePosition(event: MouseEvent, element: HTMLElement): {
    x: number;
    y: number;
};
/**
 * Gets the absolute position of the mouse on the screen from the MouseEvent.
 *
 * @param event - The mouse event containing the cursor position.
 * @returns An object with the x and y coordinates of the mouse position.
 */
export declare function getMousePositionDistance(event: MouseEvent): {
    x: number;
    y: number;
};
/**
 * Parses a comma-separated string of axes ("X", "Y", "Z") into an array of valid TransformAxisType.
 *
 * @param value - A string containing the axes to parse (e.g., "X,Y,Z").
 * @returns An array of valid TransformAxisType axes.
 */
export declare function parseTransformAxes(value: string): TransformAxisType[];
/**
 * Creates a throttled version of the given function that ensures the function
 * is called at most once per animation frame, or at a specified interval if provided.
 *
 * @param func - The function to throttle.
 * @param interval - (Optional) The duration in milliseconds to throttle the function. If not provided, requestAnimationFrame is used.
 * @returns A throttled version of the function that calls the original function at most once per frame or per the specified interval.
 */
export declare function throttle<T extends (...args: any[]) => void>(func: T, interval?: number): (...args: Parameters<T>) => void;
/**
 * Creates a debounced version of the given function that delays its execution
 * until after a specified wait time has passed since the last time it was invoked.
 *
 * @param func - The function to debounce.
 * @param wait - The number of milliseconds to delay.
 * @returns A debounced version of the function that delays execution.
 */
export declare function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void;
