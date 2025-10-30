import RestrictedDraggable from "./RestrictedDraggable";
import { MovementAxis, Orientation, Puzzle, PuzzleOrientation } from "../types";
import { SVG_NAMESPACE } from "../constants";
import { getJigsawShapeSvgString } from "../puzzle-creator/svg";

export type PuzzleImpressionOverlayConstructorArgs = {
  targetElement: HTMLImageElement | HTMLDivElement;
  selectedPuzzle: Puzzle;
  puzzles: Puzzle[];
}

export default class PuzzleImpressionOverlay {
  svgElement: SVGSVGElement;
  draggable: RestrictedDraggable;
  targetElement: HTMLImageElement | HTMLDivElement;
  puzzles: Puzzle[] | null;
  selectedPuzzle: Puzzle;
  impressionsContainer: HTMLDivElement;
  impressions: Puzzle[];
  activeImpression: Puzzle | null;
  leftBoundary: number;
  topBoundary: number;

  constructor(args: PuzzleImpressionOverlayConstructorArgs) {
    this.initiate(args);
  }

  initiate(args: PuzzleImpressionOverlayConstructorArgs) {
    this.targetElement = args.targetElement;
    this.selectedPuzzle = args.selectedPuzzle;
    this.puzzles = args.puzzles;

    const layout = this.getLayout(this.selectedPuzzle);
    this.setLayoutInternal(layout);

    this.draggable = new RestrictedDraggable({
      containerElement: this.targetElement,
      layout,
      id: "puzzle-impression-overlay",
      restrictionBoundingBox: layout,
    });

    this.setImpressions(this.puzzles);
    this.setActiveImpression(this.selectedPuzzle);
  }

  generateImpressions(puzzles: Puzzle[]) {
    const impressions = [];

    const containerElementForLandscapePuzzles = document.createElement("div");
    containerElementForLandscapePuzzles.id = PuzzleOrientation.Landscape;

    const containerElementForPortraitPuzzles = document.createElement("div");
    containerElementForPortraitPuzzles.id = PuzzleOrientation.Portrait;

    const containerElementForSquarePuzzles = document.createElement("div");
    containerElementForSquarePuzzles.id = PuzzleOrientation.Square;

    const landscapePuzzles = puzzles.filter((p) => p.orientation === PuzzleOrientation.Landscape);
    const portraitPuzzles = puzzles.filter((p) => p.orientation === PuzzleOrientation.Portrait);
    const squarePuzzles = puzzles.filter((p) => p.orientation === PuzzleOrientation.Square);

    function generateSvgElementForImpressions(puzzles: Puzzle[]): HTMLDivElement {
      const currentConfig = puzzles[n];

      const element = document.createElement("div");
      element.dataset.impressionIndex = n + '';
      element.id = "puzzle-" + currentConfig.totalNumberOfPieces;

      const svgElement = document.createElementNS(SVG_NAMESPACE, "svg");
      svgElement.setAttribute("xmlns", SVG_NAMESPACE);
      svgElement.setAttribute("fill", "none");
      svgElement.setAttribute("stroke", "#000")
      svgElement.setAttribute("viewBox", "0 0 " + currentConfig.width + " " + currentConfig.height);

      element.appendChild(svgElement);
      return element;
    }

    function generatePiecesForImpression(puzzle: Puzzle): HTMLOrSVGElement[] {
      const svgElements: HTMLOrSVGElement[] = [];

      for (let n = 0, l = puzzle.pieces.length; n < l; n++) {
        const currentPiece = puzzle.pieces[n];

        const svgElement = document.createElementNS(SVG_NAMESPACE, "svg");
        svgElement.setAttribute("xmlns", SVG_NAMESPACE);
        svgElement.setAttribute("fill", "none");
        svgElement.setAttribute("stroke", "#000")
        svgElement.setAttribute("viewBox", "0 0 " + currentPiece.width + " " + currentPiece.height);

        const pathElement = document.createElementNS(SVG_NAMESPACE, "path");
        pathElement.setAttribute("id", "piece-" + n);
        svgElement.appendChild(pathElement);

        const shape = getJigsawShapeSvgString(currentPiece);
        pathElement.setAttribute("d", shape);
      }

      return svgElements;
    }
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

  // TODO: Is this method necessary? Very poorly named...
  setLayoutInternal({ top, left }: { top: number; left: number }) {
    this.leftBoundary = left;
    this.topBoundary = top;
  }

  setImpressions(puzzles: Puzzle[]) {
    if (this.impressionsContainer) {
      this.impressionsContainer.remove();
    }

    const { container, impressions } = getPuzzlesForImpressionsForOverlay(puzzles);

    this.impressionsContainer = container;
    this.impressions = impressions;
    this.draggable.element.appendChild(this.impressionsContainer);
    this.draggable.update(this.getLayout(puzzles[0]));
  }

  setActiveImpression(puzzleConfig: Puzzle) {
    const { width, height } = puzzleConfig;

    const impressionElements =
      this.impressionsContainer.getElementsByTagName("div");
    const id = "puzzle-" + puzzleConfig.totalNumberOfPieces;

    Array.from(impressionElements).forEach((impressionElement) => {
      if (impressionElement.id === id) {
        impressionElement.classList.remove("d-none");

        if (width !== height) {
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
