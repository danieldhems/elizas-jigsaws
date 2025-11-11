import wrapPiecesAroundEdge from "./pieceLayoutsNeaten";
import randomisePiecePositions from "./pieceLayoutsShuffle";
import Pockets from "./Pockets";
import SingleMovable from "./SingleMovable";
import SolvingArea from "./SolvingArea";
import { MovableElement, PieceSectors, PieceType, PuzzleData } from "../types";
import Utils from "../utils";

export interface PieceLayoutsProperties {
  largestPieceSpan: number;
  totalNumberOfPieces: PuzzleData['totalNumberOfPieces'];
  SolvingArea: SolvingArea;
  playBoundary: HTMLDivElement | null;
  Pockets: Pockets;
}

export default interface PieceLayouts extends PieceLayoutsProperties { }

export default class PieceLayouts {
  menuIsOpen: boolean;
  playBoundary: HTMLDivElement | null;
  solvingArea: SolvingArea;
  totalNumberOfPieces: PuzzleData['totalNumberOfPieces'];
  pieceSectors: PieceSectors;
  sendToEdgeNeatenBtn: HTMLSpanElement | null;
  controlsHandle: HTMLElement | null;
  controlsPanel: HTMLElement;
  sendToEdgeShuffleBtn: HTMLElement | null;
  gatherPiecesBtn: HTMLSpanElement | null;
  controlsPanelIsOpen: boolean;
  innerPiecesVisible: boolean;
  filterBtnOnLabel: HTMLSpanElement | null;
  filterBtnOffLabel: HTMLSpanElement | null;
  filterBtn: HTMLElement | null;
  solvingAreaBoundingBox: {
    width: number;
    height: number;
    top: number;
    left: number;
  };

  constructor({
    largestPieceSpan,
    totalNumberOfPieces,
    SolvingArea,
    playBoundary,
    Pockets,
  }: PieceLayoutsProperties) {
    this.menuIsOpen = false;

    this.largestPieceSpan = largestPieceSpan;
    this.SolvingArea = SolvingArea;
    this.playBoundary = playBoundary;
    this.totalNumberOfPieces = totalNumberOfPieces;

    this.sendToEdgeNeatenBtn = document.getElementById("wrap-pieces-around-edge");
    this.controlsHandle = document.getElementById("controls-handle");
    this.controlsPanel = document.getElementById("controls-panel") as HTMLElement;
    this.gatherPiecesBtn = document.getElementById("gather-pieces");
    this.filterBtn = document.getElementById("filter-pieces");
    this.filterBtnOffLabel = document.getElementById("inner-pieces-on");
    this.filterBtnOnLabel = document.getElementById("inner-pieces-off");

    this.Pockets = Pockets;

    if (this.sendToEdgeNeatenBtn) {
      this.sendToEdgeNeatenBtn.addEventListener(
        "mousedown",
        () => {
          wrapPiecesAroundEdge();

          this.controlsPanel.classList.add("js-hidden");

          // Fix: Very bad - this'll work for now, as long as I match the timeout to the animation duration.
          setTimeout(() => {
            const pieces = window.Puzzly.pieceInstances.filter((piece: SingleMovable) =>
              !piece.isSolved && !piece.groupInstance
            );

            fetch('/api/puzzle/updatePieces', {
              method: 'PUT',
              headers: {
                "Content-Type": "Application/json",
              },
              body: JSON.stringify({
                pieces: pieces.map((piece: SingleMovable) => piece.getDataForSave()),
                puzzleId: window.Puzzly.puzzleId,
              }),
            })
          }, 200);
        }
      );
    }

    if (this.sendToEdgeShuffleBtn) {
      this.sendToEdgeShuffleBtn.addEventListener("mousedown", () => {
        randomisePiecePositions(this.pieceSectors);
        this.controlsPanel.classList.add("js-hidden");
      });
    }

    if (this.gatherPiecesBtn) {
      this.gatherPiecesBtn.addEventListener(
        "mousedown", () => {
          this.gatherPieces();
          this.controlsPanel.classList.add("js-hidden");
        }
      );
    }

    if (this.filterBtn) {
      this.filterBtn.addEventListener(
        "mousedown", () => {
          this.toggleInnerPieces.bind(this);
          this.controlsPanel.classList.add("js-hidden");
        }
      );
    }
  }

  getPlayBoundaryBoundingBox() {
    if (this.playBoundary) {
      return {
        top: parseInt(this.playBoundary.style.top),
        left: parseInt(this.playBoundary.style.left),
        right:
          parseInt(this.playBoundary.style.left) +
          parseInt(this.playBoundary.style.width),
        bottom:
          parseInt(this.playBoundary.style.top) +
          parseInt(this.playBoundary.style.height),
        width: parseInt(this.playBoundary.style.width),
        height: parseInt(this.playBoundary.style.height),
      };
    }
  }

  toggleInnerPieces(piecesVisible: boolean) {
    // TODO: Repetative code
    if (piecesVisible) {
      Utils.getAllPieces().forEach((piece: MovableElement) => {
        const p = Utils.getPieceFromElement(piece);
        if (p.pieceType === PieceType.Inner && !p.isSolved && !p.groupId) {
          window.Puzzly.hidePiece(piece);
        }
      });
      this.innerPiecesVisible = false;
      (this.filterBtnOnLabel as HTMLSpanElement).style.display = "block";
      (this.filterBtnOffLabel as HTMLSpanElement).style.display = "none";
    } else {
      Utils.getAllPieces().forEach((piece: MovableElement) => {
        const p = Utils.getPieceFromElement(piece);
        if (p.pieceType === PieceType.Inner) {
          window.Puzzly.showPiece(piece);
        }
      });
      this.innerPiecesVisible = true;
      (this.filterBtnOffLabel as HTMLSpanElement).style.display = "block";
      (this.filterBtnOnLabel as HTMLSpanElement).style.display = "none";
    }
  }

  gatherPieces() {
    const pieces = window.Puzzly.pieceInstances.filter((piece: SingleMovable) =>
      !piece.isSolved && !piece.groupInstance
    );
    const pocket = document.querySelector("#pocket-0") as HTMLDivElement;
    window.Puzzly.Pockets.addPiecesToPocket(pieces, pocket);

    fetch('/api/puzzle/updatePieces', {
      method: 'PUT',
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify({
        pieces: pieces.map((piece: SingleMovable) => piece.getDataForSave()),
        puzzleId: window.Puzzly.puzzleId,
      }),
    })
  }

  // Generate map of sectors that can be used for even dispersal of pieces around outside of puzzle board
  generatePieceSectorMap() {
    const box = Utils.getStyleBoundingBox(this.playBoundary as HTMLDivElement);
    const totalArea = box.bottom * box.right;
    const pieceSectorSize = totalArea / this.totalNumberOfPieces;

    const sqr = Math.abs(Math.sqrt(pieceSectorSize));
    const area = { width: sqr, height: sqr };

    let currX = 0,
      currY = 0;

    for (let i = 0, l = this.totalNumberOfPieces; i < l; i++) {
      this.pieceSectors[i] = {
        left: currX,
        top: currY,
        ...area,
      };

      if (currX + sqr + sqr < box.right) {
        currX += sqr;
      } else {
        currX = 0;
        currY += sqr;
      }
    }
  }

  getRandomCoordsFromSectorMap() {
    return this.pieceSectors.map((s) => ({
      x: Utils.getRandomInt(s.left, s.left + s.width),
      y: Utils.getRandomInt(s.top, s.top + s.height),
    }));
  }

  getSectorBoundingBox(sectorIndex: number) {
    const sectors = [
      "top-first-half",
      "top-second-half",
      "top-right",
      "right-first-half",
      "right-second-half",
      "bottom-right",
      "bottom-first-half",
      "bottom-second-half",
      "bottom-left",
      "left-first-half",
      "left-second-half",
      "top-left",
    ];
    const chosen = sectors[sectorIndex];
    const solvingAreaBoundingBox = Utils.getStyleBoundingBox(window.Puzzly.SolvingArea) as DOMRect;
    const playBoundaryBoundingBox =
      this.getPlayBoundaryBoundingBox() as DOMRect;
    switch (chosen) {
      case "top-first-half":
        return {
          top: 0,
          right: solvingAreaBoundingBox.width / 2,
          bottom: solvingAreaBoundingBox.bottom,
          left: solvingAreaBoundingBox.left,
        };
      case "top-second-half":
        return {
          top: 0,
          right: solvingAreaBoundingBox.right,
          bottom: solvingAreaBoundingBox.left,
          left: solvingAreaBoundingBox.left + solvingAreaBoundingBox.width / 2,
        };
      case "top-left":
        return {
          top: 0,
          right: solvingAreaBoundingBox.left,
          bottom: solvingAreaBoundingBox.left,
          left: 0,
        };
      case "right-first-half":
        return {
          top: solvingAreaBoundingBox.left,
          right: playBoundaryBoundingBox.width,
          bottom:
            solvingAreaBoundingBox.left + solvingAreaBoundingBox.height / 2,
          left: solvingAreaBoundingBox.right,
        };
      case "right-second-half":
        return {
          top: solvingAreaBoundingBox.left + solvingAreaBoundingBox.height / 2,
          right: playBoundaryBoundingBox.width,
          bottom: solvingAreaBoundingBox.bottom,
          left: solvingAreaBoundingBox.right,
        };
      case "top-right":
        return {
          top: 0,
          right: playBoundaryBoundingBox.width,
          bottom: solvingAreaBoundingBox.left,
          left: solvingAreaBoundingBox.right,
        };
      case "bottom-first-half":
        return {
          top: solvingAreaBoundingBox.bottom,
          right: solvingAreaBoundingBox.right,
          bottom: playBoundaryBoundingBox.height,
          left: solvingAreaBoundingBox.left + solvingAreaBoundingBox.width / 2,
        };
      case "bottom-second-half":
        return {
          top: solvingAreaBoundingBox.bottom,
          right: solvingAreaBoundingBox.left + solvingAreaBoundingBox.width / 2,
          bottom: playBoundaryBoundingBox.height,
          left: solvingAreaBoundingBox.left,
        };
      case "bottom-right":
        return {
          top: solvingAreaBoundingBox.bottom,
          right: playBoundaryBoundingBox.width,
          bottom: playBoundaryBoundingBox.height,
          left: solvingAreaBoundingBox.right,
        };
      case "left-first-half":
        return {
          top: solvingAreaBoundingBox.left + solvingAreaBoundingBox.height / 2,
          right: solvingAreaBoundingBox.left,
          bottom: solvingAreaBoundingBox.bottom,
          left: 0,
        };
      case "left-second-half":
        return {
          top: solvingAreaBoundingBox.left,
          right: solvingAreaBoundingBox.left,
          bottom:
            solvingAreaBoundingBox.top + solvingAreaBoundingBox.height / 2,
          left: 0,
        };
      case "bottom-left":
        return {
          top: solvingAreaBoundingBox.bottom,
          right: solvingAreaBoundingBox.left,
          bottom: playBoundaryBoundingBox.height,
          left: 0,
        };
    }
  }

  getRandomPositionOutsideBoardArea(sectorIndex: number) {
    const randSectorBoundingBox = this.getSectorBoundingBox(sectorIndex);

    if (randSectorBoundingBox) {
      return {
        left: Utils.getRandomInt(
          randSectorBoundingBox.left,
          randSectorBoundingBox.right - this.largestPieceSpan
        ),
        top: Utils.getRandomInt(
          randSectorBoundingBox.top,
          randSectorBoundingBox.bottom - this.largestPieceSpan
        ),
      };
    }
  }
}
