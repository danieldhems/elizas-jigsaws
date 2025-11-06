import { SVG_NAMESPACE, SVG_SHADOW_COLOR, SVG_STROKE_COLOR, SVG_STROKE_WIDTH } from "../constants";
import jigsawPath from "../puzzle-main/jigsawPath";
import { ConnectorType, PuzzlePiece } from "../types";

export function getSvg(
    id: string,
    pieces: PuzzlePiece[],
    imagePath: string,
    options: {
        svgWidth: number,
        svgHeight: number,
        imageWidth: number;
        imageHeight: number;
        svgPosition?: {
            x: number;
            y: number;
        },
        shadowOffset: number;
        isGroup?: boolean;
        viewbox: string,
        imagePosition?: {
            x: number;
            y: number;
        },
    }
): string {
    const {
        svgWidth,
        svgHeight,
        imageWidth,
        imageHeight,
        viewbox,
        imagePosition,
        shadowOffset,
    } = options;

    const imgPosition = {
        x: imagePosition?.x || 0,
        y: imagePosition?.y || 0,
    };

    // TODO Bad name
    const clipId = `clip-${id}`;

    let pathElementsForDefs: string = "";
    let useElementsForClip: string = "";
    let useElementsForShadow: string = "";
    let useElementsForStroke: string = "";

    for (let i = 0, l = pieces.length; i < l; i++) {
        const piece = pieces[i];
        const { positionInPuzzle, pathString } = this.getAttributesForPiece(piece);

        const shapeId = `shape-${i}`;
        const xPosition = pieces.length > 1 ? positionInPuzzle.x : 0;
        const yPosition = pieces.length > 1 ? positionInPuzzle.y : 0;

        pathElementsForDefs += `<path id="path-${shapeId}" d="${pathString}"></path>`;
        useElementsForClip += `<use href="#path-${shapeId}" x="${xPosition}" y="${yPosition}"></use>`;
        useElementsForShadow += `<use id="shadow-${shapeId}" href="#path-${shapeId}" x="${xPosition + shadowOffset}" y="${yPosition + shadowOffset}" fill="${SVG_SHADOW_COLOR}"></use>`
        useElementsForStroke += `<use id="path-${shapeId}"   href="#path-${shapeId}" fill="none" stroke="${SVG_STROKE_COLOR}" stroke-width="${SVG_STROKE_WIDTH}" x="${xPosition}" y="${yPosition}" pointer-events="visibleFill" data-piece-index="${piece.index}"></use>`
    }

    return `
      <svg xmlns="${SVG_NAMESPACE}" width="${svgWidth}" height="${svgHeight}" viewBox="${viewbox}" class="puzzle-piece-group-svg">
        <defs>
            ${pathElementsForDefs}
        </defs>
        <clipPath id="${clipId}">
            ${useElementsForClip}
        </clipPath>
        ${useElementsForShadow}
        <image 
            class="svg-image" 
            clip-path="url(#${clipId})" 
            href="${imagePath}" 
            width="${imageWidth}" 
            height="${imageHeight}"
            x="-${imgPosition?.x}"
            y="-${imgPosition?.y}"
        />
        ${useElementsForStroke}
      </svg>
    `;
}

export function getAttributesForPiece(
    piece: PuzzlePiece,
) {
    const { index, positionInPuzzle, width, height } = piece;

    return {
        index,
        shapeId: `shape-${index}`,
        pathString: getJigsawShapeSvgString(piece),
        width,
        height,
        positionInPuzzleX: positionInPuzzle.x,
        positionInPuzzley: positionInPuzzle.y,
    };
}

/**
 * 
 * @param piece 
 * @param startingPosition 
 * @returns 
 */
export const getJigsawShapeSvgString = (
    piece: PuzzlePiece,
) => {
    let svgString = "";

    let x = 0;
    let y = 0;

    // TODO: Assuming all pieces are square - might not work for irregular shapes / sizes
    const { pieceBodySize, connectorSize, connectorDistanceFromCorner } = piece;

    const hasTopPlug = piece.connectors[0].type === ConnectorType.Plug;
    const hasTopSocket = piece.connectors[0].type === ConnectorType.Socket;

    const hasRightPlug = piece.connectors[1].type === ConnectorType.Plug;
    const hasRightSocket = piece.connectors[1].type === ConnectorType.Socket;

    const hasBottomPlug = piece.connectors[2].type === ConnectorType.Plug;
    const hasBottomSocket = piece.connectors[2].type === ConnectorType.Socket;

    const hasLeftPlug = piece.connectors[3].type === ConnectorType.Plug;
    const hasLeftSocket = piece.connectors[3].type === ConnectorType.Socket;

    let topBoundary = hasTopPlug ? y + connectorSize : y;
    let leftBoundary = hasLeftPlug ? x + connectorSize : x;

    let topConnector = null,
        rightConnector = null,
        bottomConnector = null,
        leftConnector = null;

    const jigsawShapes = new jigsawPath(pieceBodySize, connectorSize);

    const getRotatedConnector = jigsawShapes.getRotatedConnector;

    svgString += `M ${leftBoundary} ${topBoundary} `;

    if (hasTopPlug) {
        topConnector = getRotatedConnector(jigsawShapes.getPlug(), 0);
    } else if (hasTopSocket) {
        topConnector = getRotatedConnector(jigsawShapes.getSocket(), 0);
    }

    if (topConnector) {
        // left boundary = connector size
        // + connector distance from corner
        svgString += `h ${connectorDistanceFromCorner} `;
        // + connector size
        svgString += `c ${topConnector.cp1.x} ${topConnector.cp1.y}, ${topConnector.cp2.x} ${topConnector.cp2.y}, ${topConnector.dest.x} ${topConnector.dest.y} `;
        // should go to piece size - connector size
        svgString += `h ${connectorDistanceFromCorner} `;
    } else {
        svgString += `h ${pieceBodySize} `;
    }

    if (hasRightPlug) {
        rightConnector = getRotatedConnector(jigsawShapes.getPlug(), 90);
    } else if (hasRightSocket) {
        rightConnector = getRotatedConnector(jigsawShapes.getSocket(), 90);
    }

    if (rightConnector !== null) {
        svgString += `v ${connectorDistanceFromCorner} `;
        svgString += `c ${rightConnector.cp1.x} ${rightConnector.cp1.y}, ${rightConnector.cp2.x} ${rightConnector.cp2.y}, ${rightConnector.dest.x} ${rightConnector.dest.y} `;
        svgString += `v ${connectorDistanceFromCorner} `;
    } else {
        svgString += `v ${pieceBodySize} `;
    }

    if (hasBottomPlug) {
        bottomConnector = getRotatedConnector(jigsawShapes.getPlug(), 180);
    } else if (hasBottomSocket) {
        bottomConnector = getRotatedConnector(jigsawShapes.getSocket(), 180);
    }

    if (bottomConnector) {
        svgString += `h -${connectorDistanceFromCorner} `;
        svgString += `c ${bottomConnector.cp1.x} ${bottomConnector.cp1.y}, ${bottomConnector.cp2.x} ${bottomConnector.cp2.y}, ${bottomConnector.dest.x} ${bottomConnector.dest.y} `;
        svgString += `h -${connectorDistanceFromCorner}`;
    } else {
        svgString += `h -${pieceBodySize}`;
    }

    if (hasLeftPlug) {
        leftConnector = getRotatedConnector(jigsawShapes.getPlug(), 270);
    } else if (hasLeftSocket) {
        leftConnector = getRotatedConnector(jigsawShapes.getSocket(), 270);
    }

    if (leftConnector !== null) {
        svgString += `v -${connectorDistanceFromCorner} `;
        svgString += `c ${leftConnector.cp1.x} ${leftConnector.cp1.y}, ${leftConnector.cp2.x} ${leftConnector.cp2.y}, ${leftConnector.dest.x} ${leftConnector.dest.y} `;
    }

    svgString += "z";

    return svgString;
};

// export const getShapeForGroupPerimeter = (pieces: SingleMovable[]): string => {
//     let pathString: string;

//     const lowestIndex = Math.min(...pieces.map(piece => piece.pieceData.index));
//     const firstPiece = pieces.find(piece => piece.pieceData.index === lowestIndex) as SingleMovable;

//     const firstPiecePosition = {
//         y: firstPiece?.pieceData.puzzleY,
//         x: firstPiece?.pieceData.puzzleX,
//     };

//     const firstPieceType = firstPiece.pieceData.type;
//     const firstPieceConnectorSize = firstPiece.pieceData.connectorSize;

//     const startPosition = {
//         y: firstPieceType[0] === 1 ? firstPiecePosition.y : firstPiecePosition.y + firstPieceConnectorSize,
//         x: firstPieceType[3] === 1 ? firstPiecePosition.x : firstPiecePosition.x + firstPieceConnectorSize,
//     };

//     pathString = `M ${startPosition.x} ${startPosition.y}`;

//     pieces.forEach(piece => {
//         const pieceData = piece.pieceData;
//         if (pieceData.type[0] === 1) {

//         }
//     });

//     return pathString;
// }
