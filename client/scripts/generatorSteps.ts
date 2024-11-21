import { PUZZLE_SIZE_LANDSCAPE_VIEWPORT_LANDSCAPE_IMAGE, PUZZLE_SIZE_LANDSCAPE_VIEWPORT_PORTRAIT_IMAGE, PUZZLE_SIZE_PORTRAIT_VIEWPORT_LANDSCAPE_IMAGE, PUZZLE_SIZE_PORTRAIT_VIEWPORT_PORTRAIT_IMAGE, PUZZLE_SIZE_SQUARE_IMAGE } from "./constants";

const GeneratorSteps = {
    /**
     * Step one:
     * 
     * Get the maximum size that the puzzle can be, given the viewport's size and orientation, and the size and orientation of the image.
     * 
     * This maximum is based on the optimal space the puzzle can occupy on the screen,
     * and is calculated as a percentage of the relevant viewport dimension (width or height, depending on orientation),
     * that percentage being defined by the following constants:
     * 
     * PUZZLE_SIZE_LANDSCAPE_VIEWPORT_LANDSCAPE_IMAGE
     * or
     * PUZZLE_SIZE_LANDSCAPE_VIEWPORT_PORTRAIT_IMAGE
     * or
     * PUZZLE_SIZE_PORTRAIT_VIEWPORT_PORTRAIT_IMAGE
     * or
     * PUZZLE_SIZE_PORTRAIT_VIEWPORT_LANDSCAPE_IMAGE
     */

    getMaximumPuzzleDimensionsForViewport: function (viewportWidth: number, viewportHeight: number, imageWidth: number, imageHeight: number): {
        maxWidth: number;
        maxHeight: number;
    } {
        if (viewportHeight < viewportWidth) {
            // Landscape viewport
            return GeneratorSteps._getDimensionsForLandscapeViewport(viewportHeight, imageWidth, imageHeight);
        } else if (viewportWidth < viewportHeight) {
            // Portrait viewport
            return GeneratorSteps._getDimensionsForPortraitViewport(viewportWidth, imageWidth, imageHeight);
        } else {
            // Default to landscape viewport
            return GeneratorSteps._getDimensionsForLandscapeViewport(viewportHeight, imageWidth, imageHeight);
        }
    },

    _getDimensionsForLandscapeViewport: function (viewportHeight: number, imageWidth: number, imageHeight: number): {
        maxWidth: number;
        maxHeight: number;
    } {
        let maxWidth: number;
        let maxHeight: number;

        const aspectRatio = imageWidth / imageHeight;

        if (imageHeight < imageWidth) {
            // Landscape image
            maxHeight = viewportHeight / 100 * PUZZLE_SIZE_LANDSCAPE_VIEWPORT_LANDSCAPE_IMAGE;
            maxWidth = maxHeight * aspectRatio;
        } else if (imageWidth < imageHeight) {
            // Portrait image
            maxHeight = viewportHeight / 100 * PUZZLE_SIZE_LANDSCAPE_VIEWPORT_PORTRAIT_IMAGE;
            maxWidth = maxHeight * aspectRatio;
        } else {
            maxHeight = viewportHeight / 100 * PUZZLE_SIZE_SQUARE_IMAGE;
            maxWidth = maxHeight;
        }

        return {
            maxWidth,
            maxHeight,
        }
    },

    _getDimensionsForPortraitViewport: function (viewportWidth: number, imageWidth: number, imageHeight: number): {
        maxWidth: number;
        maxHeight: number;
    } {
        let maxWidth: number;
        let maxHeight: number;

        const aspectRatio = imageWidth / imageHeight;

        if (imageWidth < imageHeight) {
            // Portrait image
            maxWidth = viewportWidth / 100 * PUZZLE_SIZE_PORTRAIT_VIEWPORT_PORTRAIT_IMAGE;
            maxHeight = maxWidth / aspectRatio;
        } else if (imageHeight < imageWidth) {
            // Landscape image
            maxWidth = viewportWidth / 100 * PUZZLE_SIZE_PORTRAIT_VIEWPORT_LANDSCAPE_IMAGE;
            maxHeight = maxWidth / aspectRatio;
        } else {
            maxWidth = viewportWidth / 100 * PUZZLE_SIZE_SQUARE_IMAGE;;
            maxHeight = maxWidth;
        }

        return {
            maxWidth,
            maxHeight,
        }
    }
}

export default GeneratorSteps;