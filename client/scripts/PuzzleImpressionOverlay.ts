import RestrictedDraggable from "./RestrictedDraggable";
import { getPuzzleImpressions } from "./puzzleGenerator";
import { PuzzleConfig, PuzzleImpression } from "./types";

export type PuzzleImpressionOverlayConstructorArgs = {
  targetElement: HTMLImageElement | HTMLDivElement;
  selectedPuzzleConfig: PuzzleConfig;
  puzzleConfigs: PuzzleConfig[];
}

export default class PuzzleImpressionOverlay {
  svgElement: SVGSVGElement;
  draggable: RestrictedDraggable;
  targetElement: HTMLImageElement | HTMLDivElement;
  container: HTMLElement;
  puzzleConfigs: PuzzleConfig[] | null;
  selectedPuzzleConfig: PuzzleConfig;
  pieceSvgGroups: HTMLOrSVGElement[];
  impressionsContainer: HTMLDivElement;
  impressions: PuzzleImpression[];
  activeImpression: PuzzleImpression | null;
  leftBoundary: number;
  topBoundary: number;

  constructor(args: PuzzleImpressionOverlayConstructorArgs) {
    this.initiate(args);
  }

  initiate(args: PuzzleImpressionOverlayConstructorArgs) {
    this.reset();

    this.targetElement = args.targetElement;
    this.selectedPuzzleConfig = args.selectedPuzzleConfig;
    this.puzzleConfigs = args.puzzleConfigs;
    this.container = this.targetElement.parentElement as HTMLElement;

    const layout = this.getLayout(this.selectedPuzzleConfig);
    this.setLayoutInternal(layout);

    this.draggable = new RestrictedDraggable({
      containerElement: this.container,
      layout,
      id: "puzzle-impression-overlay",
      restrictionBoundingBox: layout,
    });

    this.setImpressions(this.puzzleConfigs);
    this.setActiveImpression(this.selectedPuzzleConfig);
  }

  reset() {
    if (this.puzzleConfigs) {
      this.puzzleConfigs = null;
    }
    if (this.activeImpression) {
      this.activeImpression = null;
    }
    if (this.draggable) {
      this.draggable.destroy();
    }
    if (this.impressionsContainer) {
      this.impressionsContainer.remove();
    }
  }

  getLayout(puzzleConfig: PuzzleConfig) {
    console.log('puzzle config', puzzleConfig)

    // Calculate top and left position of target element, assuming it is centered
    const topBoundary =
      (this.container.offsetHeight - this.targetElement.offsetHeight) / 2;
    const leftBoundary =
      (this.container.offsetWidth - this.targetElement.offsetWidth) / 2;
    const rightBoundary = this.targetElement.offsetWidth - leftBoundary;
    const bottomBoundary = this.targetElement.offsetHeight - topBoundary;

    const { percentageOfImageUsedHorizontal, percentageOfImageUsedVertical } = puzzleConfig;

    const width = percentageOfImageUsedHorizontal === 100 ? this.targetElement.offsetWidth : this.targetElement.offsetWidth / 100 * percentageOfImageUsedHorizontal;
    const height = percentageOfImageUsedVertical === 100 ? this.targetElement.offsetHeight : this.targetElement.offsetHeight / 100 * percentageOfImageUsedVertical;

    return {
      left: leftBoundary,
      top: 0,
      width,
      height,
      right: rightBoundary,
      bottom: bottomBoundary,
    };
  }

  setLayoutInternal({ top, left }: { top: number; left: number }) {
    this.leftBoundary = left;
    this.topBoundary = top;
  }

  setImpressions(puzzleConfigs: PuzzleConfig[]) {
    if (this.impressionsContainer) {
      this.impressionsContainer.remove();
    }

    const { container, impressions } = getPuzzleImpressions(puzzleConfigs);

    this.impressionsContainer = container;
    this.impressions = impressions;
    this.draggable.element.appendChild(this.impressionsContainer);
    this.draggable.update(this.getLayout(puzzleConfigs[0]));
  }

  setActiveImpression(puzzleConfig: PuzzleConfig) {
    const impressionElements =
      this.impressionsContainer.getElementsByTagName("div");
    const id = "puzzle-" + puzzleConfig.totalNumberOfPieces;

    Array.from(impressionElements).forEach((impressionElement) => {
      if (impressionElement.id === id) {
        impressionElement.classList.remove("js-hidden");

        const layout = this.getLayout(puzzleConfig);
        this.draggable.update(layout);

        const impressiongIndex = parseInt(
          impressionElement.dataset.impressionIndex as string
        );
        this.activeImpression = this.impressions.find(
          (impression: PuzzleImpression) =>
            impression.index === impressiongIndex
        ) as PuzzleImpression;
      } else {
        impressionElement.classList.add("js-hidden");
      }
    });
  }

  getActiveImpression() {
    return {
      ...this.activeImpression,
      impressionWidth: this.draggable.element.offsetWidth,
      impressionHeight: this.draggable.element.offsetHeight,
    };
  }

  getPositionAndDimensions() {
    const { offsetLeft, offsetTop } = this.draggable.element;
    const width = parseInt(this.draggable.element.style.width);
    const height = parseInt(this.draggable.element.style.height);

    return {
      left: offsetLeft - this.leftBoundary,
      top: offsetTop - this.topBoundary,
      width,
      height,
    };
  }
}
