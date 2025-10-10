import GroupMovable from "./GroupMovable";
import SingleMovable from "./SingleMovable";
import { ELEMENT_IDS } from "../constants";
import { getSvg } from "../puzzle-creator/svg";
import { JigsawPieceData } from "../types";
import Utils from "../utils";

export default class SolvingArea {
    element: HTMLDivElement;
    playBoundary: HTMLDivElement;
    width: number;
    height: number;
    imagePath: string;
    pieces: JigsawPieceData[] = [];

    constructor(boardWidth: number, boardHeight: number, imagePath: string) {
        this.element = document.querySelector(
            `#${ELEMENT_IDS.SOLVED_PUZZLE_AREA}`
        ) as HTMLDivElement;
        this.playBoundary = document.querySelector(
            `#${ELEMENT_IDS.PLAY_BOUNDARY}`
        ) as HTMLDivElement;

        this.width = boardWidth;
        this.height = boardHeight;
        this.imagePath = imagePath;

        this.init();
    }

    init() {
        this.element.style.width = Utils.getPxString(this.width);
        this.element.style.height = Utils.getPxString(this.height);
        this.element.style.top = Utils.getPxString(
            this.playBoundary.offsetHeight / 2 - this.height / 2
        );
        this.element.style.left = Utils.getPxString(
            this.playBoundary.offsetWidth / 2 - this.width / 2
        );

        this.element.style.pointerEvents = "none";

        this.render()
    }

    addPiece(piece: SingleMovable) {
        this.pieces.push(piece.pieceData);
        this.render();
        piece.destroy();
        window.Puzzly.solvedCount += 1;
    }

    addPieces(pieces: SingleMovable[]) {
        pieces.forEach((piece: SingleMovable) => {
            this.pieces.push(piece.pieceData);
            piece.destroy();
        });
        this.render();
        window.Puzzly.solvedCount += 1;
    }

    addGroup(group: GroupMovable) {
        this.pieces.push(...group.piecesInGroup.map((piece: SingleMovable) => piece.pieceData))
        this.render();
        window.Puzzly.solvedCount += group.piecesInGroup.length;
    }

    /**
     * Use when loading puzzle from persistence to add pieces that have already been solved.
     * 
     * This method allows us to avoid instantiating instances of SingleMovable when we don't need to. 
     * 
     * @param {JigsawPieceData} pieces Collection of pieces by data only i.e. not an instance of SingleMovable
     * 
     * Question: Do we need this?
     */
    addSolvedPieces(pieces: JigsawPieceData[]) {
        this.pieces.push(...pieces);
        this.render();
    }

    render() {
        const shadowOffset = window.Puzzly.shadowOffset;

        const svgWidth = this.width + shadowOffset;
        const svgHeight = this.height + shadowOffset;

        const svgOptions = {
            svgWidth: svgWidth,
            svgHeight: svgHeight,
            imageWidth: this.width,
            imageHeight: this.height,
            viewbox: `0 0 ${svgWidth} ${svgHeight}`,
            isGroup: true,
            shadowOffset,
        }

        const svgElementTemplate = getSvg(
            `svg-${Date.now()}`,
            "",
            this.pieces,
            this.imagePath,
            svgOptions,
        );

        const existingSvgElement = this.element.querySelector(".group-svg-container");
        if (existingSvgElement) {
            existingSvgElement.remove();
        }

        const svgContainer = document.createElement("div");
        svgContainer.classList.add("group-svg-container");
        svgContainer.innerHTML = svgElementTemplate;
        this.element.appendChild(svgContainer)
    }
}