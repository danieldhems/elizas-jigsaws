import { EVENT_TYPES, LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_AMOUNT, LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE } from "./constants";
import { MovableElement, SideNames } from "./types";
import Utils from "./utils";

// Determine when to start placing pieces on next side
function shouldProceedToNextSide(
  currentSide: SideNames,
  element: MovableElement,
  firstPieceOnNextSide: MovableElement,
  solvingAreaElement: HTMLDivElement,
) {
  // console.log("shouldProceedToNextSide()", currentSide, element, firstPieceOnNextSide)
  let targetBox;

  targetBox = firstPieceOnNextSide
    ? Utils.getStyleBoundingBox(firstPieceOnNextSide)
    : Utils.getStyleBoundingBox(solvingAreaElement);

  const box = Utils.getStyleBoundingBox(element);
  const connectorSize = parseInt(element.dataset.connectorSize as string);

  switch (currentSide) {
    case SideNames.Top:
      if (targetBox.right) {

      }
      return (
        box.left > targetBox.right ||
        box.right - connectorSize > targetBox.right
      );
    case SideNames.Right:
      return (
        box.top > targetBox.bottom ||
        box.bottom - connectorSize > targetBox.bottom
      );
    case SideNames.Bottom:
      return (
        box.right < targetBox.left ||
        box.left + connectorSize < targetBox.left
      );
    case SideNames.Left:
      return (
        box.bottom < targetBox.top - targetBox.bottom ||
        box.top + connectorSize < targetBox.top
      );
  }
}

// Each time we start the next side, determine where the first piece should go
function getPositionForFirstPieceOnNextSide(
  element: MovableElement,
  nextElement: MovableElement | null,
  currentSide: SideNames,
  firstPieceOnNextSideFromPreviousIteration: MovableElement,
) {
  const solvingArea = window.Puzzly.SolvingArea.element;

  const targetBox = firstPieceOnNextSideFromPreviousIteration
    ? Utils.getStyleBoundingBox(firstPieceOnNextSideFromPreviousIteration)
    : Utils.getStyleBoundingBox(solvingArea);

  const box = Utils.getStyleBoundingBox(element);
  const nextElementBox = nextElement
    ? Utils.getStyleBoundingBox(nextElement)
    : null;

  let nextElementWidth = 0;
  let nextElementHeight = 0;
  if (nextElementBox) {
    nextElementWidth = nextElementBox?.right - nextElementBox?.left;
    nextElementHeight = nextElementBox?.bottom - nextElementBox?.top;
  }

  switch (currentSide) {
    case SideNames.Top:
      return {
        x: targetBox.right + LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE,
        y: box.bottom + LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE,
      };
    case SideNames.Right:
      return {
        x: box.left - nextElementWidth - LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE,
        y: targetBox.bottom + LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE,
      };
    case SideNames.Bottom:
      return {
        x: targetBox.left - targetBox.right - LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE,
        y: box.top - nextElementHeight - LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE,
      };
    case SideNames.Left:
      return {
        x: box.right + LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE,
        y: targetBox.bottom - LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE,
      };
  }
}

export default function arrangePiecesAroundEdge() {
  const solvingArea = window.Puzzly.SolvingArea.element;
  const playBoundary = window.Puzzly.playBoundary;

  const sides = [
    SideNames.Top,
    SideNames.Right,
    SideNames.Bottom,
    SideNames.Left,
  ];
  let i = 0;
  let sideIndex = 0;

  let currentSide = sides[sideIndex];

  const firstPiecesOnEachSide = {
    top: null,
    right: null,
    bottom: null,
    left: null,
  } as Record<string, MovableElement | null>;

  const piecesInPlay: MovableElement[] = Utils.shuffleArray(Utils.getIndividualPiecesOnCanvas()) as MovableElement[];
  // console.log("arrangePiecesAroundEdge", piecesInPlay)

  const solvingAreaXPosition = parseInt(solvingArea.style.left);
  const solvingAreaYPosition = parseInt(solvingArea.style.top);

  let currentX: number = solvingAreaXPosition;
  let currentY: number = solvingAreaYPosition - piecesInPlay[0].offsetHeight - LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE;

  const spacing = LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_AMOUNT;

  let baseTop = solvingAreaYPosition - spacing;
  let baseRight = solvingAreaXPosition + solvingArea.offsetWidth + spacing;
  let baseBottom = solvingAreaYPosition + solvingArea.offsetHeight + spacing;
  let baseLeft = solvingAreaXPosition - spacing;

  // As we wrap pieces around the edge, keep track of the furthest reach of all pieces
  // in each direction. We can use this as the baseline for the next row.
  let perimeterTop = baseTop;
  let perimeterRight = baseRight;
  let perimeterBottom = baseBottom;
  let perimeterLeft = baseLeft;

  let iterations = 0;
  let currentIteration = 0;

  while (i < piecesInPlay.length) {
    const currentPiece = piecesInPlay[i] as MovableElement;

    const currentPieceBoundingBox = Utils.getStyleBoundingBox(currentPiece);
    const nextPiece = piecesInPlay[i + 1];

    const isLastPiece = i === piecesInPlay.length - 1;

    if (currentSide === "top") {
      if (iterations > currentIteration) {
        currentIteration++;
        baseTop = perimeterTop;
        baseRight = perimeterRight;
        baseBottom = perimeterBottom;
        baseLeft = perimeterLeft;
      }

      const nextY = baseTop - currentPiece.offsetHeight
      currentY = nextY;

      // Update perimeter if necessary
      if (nextY < perimeterTop) {
        perimeterTop = nextY;
      }
    } else if (currentSide === "right") {
      currentX = baseRight;
      const distanceX = currentX + currentPiece.offsetWidth;

      // Update perimeter if necessary
      if (distanceX > perimeterRight) {
        perimeterRight = distanceX;
      }
    } else if (currentSide === "bottom") {
      currentY = baseBottom;
      const distanceBottom = baseBottom + currentPiece.offsetHeight;

      // Update perimeter if necessary
      if (distanceBottom > perimeterBottom) {
        perimeterBottom = distanceBottom;
      }

    } else if (currentSide === "left") {
      const nextX = baseLeft - currentPiece.offsetWidth;
      currentX = nextX;

      // Update perimeter if necessary
      if (nextX < perimeterLeft) {
        perimeterLeft = nextX;
      }
    }

    window
      .move(currentPiece)
      .x(currentX)
      .y(currentY)
      .duration(this.animationDuration)
      .end();

    // Need to update the currentX / currentY to push the next piece along once the current piece's position has been set
    if (currentSide === SideNames.Top) {
      currentX += currentPieceBoundingBox.right + LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE;
    } else if (currentSide === SideNames.Right) {
      currentY += currentPieceBoundingBox.bottom + LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE;
    } else if (currentSide === SideNames.Bottom) {
      currentX -= (currentPiece.offsetWidth + LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE);
    } else if (currentSide === SideNames.Left) {
      currentY -= (currentPiece.offsetHeight + LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE);
    }

    const nextSide = sideIndex < 3 ? sideIndex + 1 : 0;

    if (
      shouldProceedToNextSide(currentSide,
        currentPiece,
        firstPiecesOnEachSide[sides[nextSide]] as HTMLDivElement,
        solvingArea
      )
    ) {
      if (currentSide === SideNames.Bottom) {
        iterations++;
      }

      // const nextPos = getPositionForFirstPieceOnNextSide(
      //   currentPiece,
      //   !isLastPiece ? (nextPiece as HTMLDivElement) : null,
      //   currentSide,
      //   firstPiecesOnEachSide[sides[nextSide]] as HTMLDivElement,
      // );

      sideIndex = nextSide;
      currentSide = sides[nextSide];

      // if (nextPos) {
      // currentX = nextPos.x;
      // currentY = nextPos.y;
      // }
    } else {

    }

    i++;
  }

  window.dispatchEvent(new CustomEvent(EVENT_TYPES.SAVE));
}
