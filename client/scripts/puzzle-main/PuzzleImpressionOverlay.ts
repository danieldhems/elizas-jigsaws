import RestrictedDraggable from "./RestrictedDraggable";
import { MovementAxis, Puzzle } from "../types";
import { SVG_NAMESPACE } from "../constants";

export type PuzzleImpressionOverlayConstructorArgs = {
  targetElement: HTMLImageElement | HTMLDivElement;
  selectedPuzzle: Puzzle;
  puzzles: Puzzle[];
}

export default class PuzzleImpressionOverlay {
  svgElement: SVGSVGElement;
  draggableElement: RestrictedDraggable;
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
    this.leftBoundary = layout.left;
    this.topBoundary = layout.top;

    this.draggableElement = new RestrictedDraggable({
      containerElement: this.targetElement,
      layout,
      id: "puzzle-impression-overlay",
      restrictionBoundingBox: layout,
    });

    this.targetElement.appendChild(this.draggableElement.getElement());

    this.generatePuzzleImpressions(this.puzzles);
    // this.setActiveImpression(this.selectedPuzzle);
  }

  generatePuzzleImpressions(puzzles: Puzzle[]) {
    const fragment = document.createDocumentFragment();

    const destinationElement = this.draggableElement.getElement();

    // Iterate puzzles
    for (let i = 0, l = puzzles.length; i < l; i++) {
      const p = puzzles[i];

      const svgElement = document.createElementNS(SVG_NAMESPACE, "svg");
      svgElement.setAttribute("xmlns", SVG_NAMESPACE);
      svgElement.setAttribute("fill", "none");
      svgElement.setAttribute("stroke", "#000")
      svgElement.setAttribute("viewBox", "0 0 " + p.width + " " + p.height);
      svgElement.setAttribute("width", p.width + "");
      svgElement.setAttribute("height", p.height + "");
      svgElement.setAttribute("id", `puzzle-impression-${p.orientation.toLowerCase()}-${p.numberOfPiecesHorizontal}x${p.numberOfPiecesVertical}`);
      svgElement.classList.add("absolute");
      svgElement.classList.add("start-0");
      svgElement.classList.add("top-0");

      // Iterate pieces for current puzzle
      for (
        let n = 0,
        piecesLength = p.pieces.length;
        n < piecesLength;
        n++
      ) {
        const currentPiece = p.pieces[n];

        const pathElement = document.createElementNS(SVG_NAMESPACE, "path");
        pathElement.setAttribute("id", "piece-" + n);
        pathElement.setAttribute("d", currentPiece.svgString);
        pathElement.setAttribute("transform", `translate(${currentPiece.positionInPuzzle.x},${currentPiece.positionInPuzzle.y})`);
        svgElement.appendChild(pathElement);
      }

      fragment.appendChild(svgElement);
    }

    destinationElement.appendChild(fragment);
  }

  reset() {
    if (this.puzzles) {
      this.puzzles = null;
    }
    if (this.activeImpression) {
      this.activeImpression = null;
    }
    if (this.draggableElement) {
      this.draggableElement.destroy();
    }
    if (this.impressionsContainer) {
      this.impressionsContainer.remove();
    }
  }

  getLayout(puzzleConfig: Puzzle) {
    // Calculate top and left position of target element, assuming it is centered
    const topBoundary =
      this.targetElement.offsetHeight / 2;
    const leftBoundary =
      this.targetElement.offsetWidth / 2;
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

  setActiveImpression(puzzleConfig: Puzzle) {
    const { width, height } = puzzleConfig;

    const impressionElements =
      this.impressionsContainer.getElementsByTagName("div");
    const id = "puzzle-" + puzzleConfig.totalNumberOfPieces;

    Array.from(impressionElements).forEach((impressionElement) => {
      if (impressionElement.id === id) {
        impressionElement.classList.remove("d-none");

        if (width !== height) {
          this.draggableElement.update(this.getLayout(puzzleConfig));
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
    const { offsetLeft, offsetTop } = this.draggableElement.element;
    const width = parseInt(this.draggableElement.element.style.width);
    const height = parseInt(this.draggableElement.element.style.height);

    return {
      left: offsetLeft - this.leftBoundary,
      top: offsetTop - this.topBoundary,
      width,
      height,
    };
  }
}
