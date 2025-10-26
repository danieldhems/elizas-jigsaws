import RestrictedDraggable from "./RestrictedDraggable";
import { getPuzzleImpressions } from "../puzzle-creator/puzzleGenerator";
import { MovementAxis, Puzzle } from "../types";

export type PuzzleImpressionOverlayConstructorArgs = {
  targetElement: HTMLImageElement | HTMLDivElement;
  selectedPuzzle: Puzzle;
  puzzles: Puzzle[];
}

export default class PuzzleImpressionOverlay {
  svgElement: SVGSVGElement;
  draggable: RestrictedDraggable;
  targetElement: HTMLImageElement | HTMLDivElement;
  container: HTMLElement;
  puzzles: Puzzle[] | null;
  selectedPuzzle: Puzzle;
  pieceSvgGroups: HTMLOrSVGElement[];
  impressionsContainer: HTMLDivElement;
  impressions: Puzzle[];
  activeImpression: Puzzle | null;
  leftBoundary: number;
  topBoundary: number;

  constructor(args: PuzzleImpressionOverlayConstructorArgs) {
    this.initiate(args);
  }

  initiate(args: PuzzleImpressionOverlayConstructorArgs) {
    this.reset();

    this.targetElement = args.targetElement;
    this.selectedPuzzle = args.selectedPuzzle;
    this.puzzles = args.puzzles;
    this.container = this.targetElement.parentElement as HTMLElement;

    const layout = this.getLayout(this.selectedPuzzle);
    this.setLayoutInternal(layout);

    this.draggable = new RestrictedDraggable({
      containerElement: this.container,
      layout,
      id: "puzzle-impression-overlay",
      restrictionBoundingBox: layout,
    });

    this.setImpressions(this.puzzles);
    this.setActiveImpression(this.selectedPuzzle);
  }

  reset() {
    if (this.puzzles) {
      this.puzzles = null;
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

  getLayout(puzzleConfig: Puzzle) {
    // Calculate top and left position of target element, assuming it is centered
    const topBoundary =
      (this.container.offsetHeight - this.targetElement.offsetHeight) / 2;
    const leftBoundary =
      (this.container.offsetWidth - this.targetElement.offsetWidth) / 2;
    const rightBoundary = this.targetElement.offsetWidth - leftBoundary;
    const bottomBoundary = this.targetElement.offsetHeight - topBoundary;

    const { percentageOfImageUsedHorizontal, percentageOfImageUsedVertical } = puzzleConfig;

    const shortLength = Math.min(this.targetElement.offsetWidth, this.targetElement.offsetHeight);

    const width = percentageOfImageUsedHorizontal === 100 ? shortLength : this.targetElement.offsetWidth / 100 * percentageOfImageUsedHorizontal;
    const height = percentageOfImageUsedVertical === 100 ? shortLength : this.targetElement.offsetHeight / 100 * percentageOfImageUsedVertical;

    let allowedMovementAxis: MovementAxis | null;

    if (width === height) {
      allowedMovementAxis = null;
    } else {
      allowedMovementAxis = width < height ? MovementAxis.Y : MovementAxis.X;
    }

    return {
      left: leftBoundary,
      top: 0,
      width,
      height,
      right: rightBoundary,
      bottom: bottomBoundary,
      allowedMovementAxis,
    };
  }

  setLayoutInternal({ top, left }: { top: number; left: number }) {
    this.leftBoundary = left;
    this.topBoundary = top;
  }

  setImpressions(puzzles: Puzzle[]) {
    if (this.impressionsContainer) {
      this.impressionsContainer.remove();
    }

    const { container, impressions } = getPuzzleImpressions(puzzles);

    this.impressionsContainer = container;
    this.impressions = impressions;
    this.draggable.element.appendChild(this.impressionsContainer);
    this.draggable.update(this.getLayout(puzzles[0]));
  }

  setActiveImpression(puzzleConfig: Puzzle) {
    const { puzzleWidth, puzzleHeight } = puzzleConfig;

    const impressionElements =
      this.impressionsContainer.getElementsByTagName("div");
    const id = "puzzle-" + puzzleConfig.totalNumberOfPieces;

    Array.from(impressionElements).forEach((impressionElement) => {
      if (impressionElement.id === id) {
        impressionElement.classList.remove("d-none");

        if (puzzleWidth !== puzzleHeight) {
          this.draggable.update(this.getLayout(puzzleConfig));
        }

        const impressiongIndex = parseInt(
          impressionElement.dataset.impressionIndex as string
        );

        this.activeImpression = this.impressions[impressiongIndex];
      } else {
        impressionElement.classList.add("d-none");
      }
    });
  }

  getActiveImpression() {
    return this.activeImpression;
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
