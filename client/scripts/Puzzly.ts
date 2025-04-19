import GroupMovable from "./GroupMovable";
import GroupOperations from "./GroupOperations";
import PieceLayouts from "./PieceLayouts";
import PlayBoundaryMovable from "./PlayBoundaryMovable";
import { PocketMovable } from "./PocketMovable";
import Pockets from "./Pockets";
import SingleMovable from "./SingleMovable";
import SolvedPuzzlePreview from "./SolvedPuzzlePreview";
import SolvingArea from "./SolvingArea";
import Sounds from "./Sounds";
import loadAssets from "./assetLoader";
import {
  CONNECTOR_TOLERANCE_AMOUNT,
  ELEMENT_IDS,
  FLOAT_TOLERANCE_AMOUNT,
  INITIAL_ZINDEX_FOR_PIECES,
  QUERY_STRING_PARAM_SHOW_CONNECTOR_BOXES,
  SHADOW_OFFSET_RATIO,
} from "./constants";
import DragAndSelect from "./dragAndSelect";
import PersistenceOperations from "./persistence";
import arrangePiecesAroundEdge from "./pieceLayoutsNeaten";
import {
  GroupData,
  JigsawPieceData,
  MovableElement,
  SolvedPuzzlePreviewType,
} from "./types";
import Utils from "./utils";
import Zoom from "./zoom";
/**
 * Puzzly
 *
 */

export default class Puzzly {
  DragAndSelect: DragAndSelect;
  SolvedPuzzlePreview: SolvedPuzzlePreview;
  PocketMovable: PocketMovable;
  PieceLayouts: PieceLayouts;
  PersistenceOperations: PersistenceOperations;
  PlayBoundaryMovable: PlayBoundaryMovable;
  SolvingArea: SolvingArea;
  Zoom: Zoom;
  Sounds: Sounds;
  boardSize: number;
  puzzleWidth: number;
  puzzleHeight: number;
  puzzleId: string;
  pieces: JigsawPieceData[];
  groups: GroupData[];
  lastSaveDate: number;
  pieceSize: number;
  piecesPerSideHorizontal: number;
  piecesPerSideVertical: number;
  selectedNumPieces: number;
  shadowOffset: number;
  Pockets: Pockets;
  pocketId: number;
  puzzleImage: HTMLImageElement;
  puzzleSprite: HTMLImageElement;
  previewImage: HTMLImageElement;
  previewImageType: SolvedPuzzlePreviewType;
  puzzleImagePath: string;
  spritePath: string;
  boardWidth: number;
  solvedGroupId: number;
  boardHeight: number;
  zoomLevel: number;
  connectorTolerance: number;
  connectorDistanceFromCorner: number;
  connectorSize: number;
  floatTolerance: number;
  pieceInstances: SingleMovable[];
  groupInstances: GroupMovable[];
  complete?: boolean;
  solvedCount: number;
  stage: HTMLDivElement | null;
  playBoundary: HTMLDivElement | null;
  piecesContainer: HTMLDivElement | null;
  controlsHandle: HTMLDivElement;
  controlsPanel: HTMLDivElement;
  isPreviewActive: boolean;
  largestPieceSpan: number;
  noDispersal?: boolean;
  currentZIndex?: number;
  solvedCnv: HTMLCanvasElement | null;
  filterBtn: HTMLSpanElement | null;
  filterBtnOffLabel: HTMLSpanElement | null;
  filterBtnOnLabel: HTMLSpanElement | null;
  timeStarted: number;
  integration: boolean;
  imageWidth: number;
  imageHeight: number;
  imagePreviewType: SolvedPuzzlePreviewType;
  scale: number;
  viewportLargeEnoughForOutOfBoundsArea: boolean;
  playBoundaryWidth: number;
  playBoundaryHeight: number;
  lengthForFullScreen: number;
  numberOfPiecesHorizontal: number;
  numberOfPiecesVertical: number;
  GroupOperations: GroupOperations;
  showConnectorBoxes: boolean;
  cropData: {
    top: number,
    left: number,
    width: number;
    height: number;
  }

  constructor(puzzleId: string, config: any) {
    Object.assign(this, {
      ...config,
      debug: true,
      showDebugInfo: false,
      piecesPerSideHorizontal: config.numberOfPiecesHorizontal,
      piecesPerSideVertical: config.numberOfPiecesVertical,
    });

    window.Puzzly = this;

    this.numberOfPiecesHorizontal = config.numberOfPiecesHorizontal;
    this.numberOfPiecesVertical = config.numberOfPiecesVertical;

    // TODO: Rename this to avoid confusion
    this.selectedNumPieces = config.totalNumberOfPieces;

    this.boardWidth = config.boardWidth;
    this.boardHeight = config.boardHeight;

    this.pieces = config.pieces as JigsawPieceData[];

    this.pieceSize = config.pieceSize;
    this.shadowOffset = this.pieceSize / 100 * SHADOW_OFFSET_RATIO;

    this.complete = config.complete;

    this.puzzleId = puzzleId;

    this.noDispersal = config?.debugOptions?.noDispersal;

    this.currentZIndex = config.zIndex || INITIAL_ZINDEX_FOR_PIECES;

    this.solvedGroupId = 1111;

    this.puzzleId = puzzleId;

    this.puzzleImage = new Image();
    this.puzzleImage.src = this.puzzleImagePath;

    console.log(this);

    this.previewImageType = SolvedPuzzlePreviewType.AlwaysOn;

    this.stage = document.querySelector(`#${ELEMENT_IDS.STAGE}`);
    this.playBoundary = document.querySelector(`#${ELEMENT_IDS.PLAY_BOUNDARY}`);
    this.piecesContainer = document.querySelector(
      `#${ELEMENT_IDS.PIECES_CONTAINER}`
    );

    if (this.piecesContainer) {
      this.piecesContainer.style.zIndex = this.currentZIndex + '';
    }

    loadAssets([this.puzzleImage]).then(() => {
      this.init();
    });
  }

  init() {
    this.zoomLevel = 1;

    this.shadowOffset = this.pieceSize / 100 * SHADOW_OFFSET_RATIO;

    this.connectorTolerance =
      (this.connectorSize / 100) * ((100 - CONNECTOR_TOLERANCE_AMOUNT) / 2);

    this.floatTolerance = (this.pieceSize / 100) * FLOAT_TOLERANCE_AMOUNT;

    this.largestPieceSpan = this.pieceSize + this.connectorSize * 2;

    this.playBoundary = document.querySelector("#play-boundary");

    this.PlayBoundaryMovable = new PlayBoundaryMovable(this);
    this.SolvingArea = new SolvingArea(this.boardWidth, this.boardHeight, this.puzzleImage.src)
    this.Zoom = new Zoom(this);
    this.Pockets = new Pockets(this);
    // this.DragAndSelect = new DragAndSelect(this);
    this.SolvedPuzzlePreview = new SolvedPuzzlePreview(this);
    this.PocketMovable = new PocketMovable(this);
    this.PieceLayouts = new PieceLayouts(this);
    this.PersistenceOperations = new PersistenceOperations(this);
    this.Sounds = new Sounds();

    this.controlsHandle = document.querySelector("#controls-handle") as HTMLDivElement;
    this.controlsPanel = document.querySelector("#controls-panel") as HTMLDivElement;
    if (this.controlsHandle && this.controlsPanel) {
      this.controlsHandle.addEventListener("click", () => {
        if (this.controlsPanel.classList.contains("js-hidden")) {
          this.controlsPanel.classList.remove("js-hidden");
        } else {
          this.controlsPanel.classList.add("js-hidden");
        }
      })
    }

    const showConnectorBoxes = Utils.getQueryStringValue(QUERY_STRING_PARAM_SHOW_CONNECTOR_BOXES);
    console.log("showConnectorBoxes", showConnectorBoxes)
    if (!!showConnectorBoxes) {
      this.showConnectorBoxes = true;
    }

    this.solvedCount = 0;

    this.GroupOperations = new GroupOperations({
      width: this.boardWidth,
      height: this.boardHeight,
      puzzleImage: this.puzzleImage,
      shadowOffset: this.shadowOffset,
      piecesPerSideHorizontal: this.piecesPerSideHorizontal,
      piecesPerSideVertical: this.piecesPerSideVertical,
    });

    const storage = this.PersistenceOperations.getPersistence(this);

    this.pieceInstances = [];
    this.groupInstances = [];
    const solvedPieces: JigsawPieceData[] = [];

    if (storage && storage.pieces.length > 0) {
      // console.log("Getting pieces from storage", storage)
      storage.pieces.forEach((p) => {
        const pieceInstance = new SingleMovable({
          puzzleData: this,
          pieceData: p,
        });

        this.pieceInstances.push(pieceInstance);

        if (p.isSolved) {
          solvedPieces.push(p);
        }
      });
      // console.log('Single pieces', this.pieceInstances)

      if (solvedPieces.length > 0) {
        this.SolvingArea.addSolvedPieces(solvedPieces);
      }

      // console.log("groups from persistence", this.groups);
      if (this.groups && Object.keys(this.groups).length) {
        for (let g in this.groups) {
          const group = this.groups[g];
          const groupInstance = new GroupMovable(group);
          this.groupInstances.push(groupInstance);
        }
      }
    } else {
      this.pieces.forEach((piece, index) => {
        const pieceInstance = new SingleMovable({
          puzzleData: this,
          pieceData: {
            ...piece,
            index,
          },
        });
        this.pieceInstances.push(pieceInstance);
      });

      if (!this.noDispersal) {
        arrangePiecesAroundEdge();
      } else {
        // NOTE: Initial save once all pieces have been rendered
        // Only necessary when loading puzzle without disperal (for debug)
        // else the save would be called elsewhere
        const pieces = this.pieceInstances.map((piece) => piece.getDataForSave());

        fetch('/api/puzzle/createPieces', {
          method: 'POST',
          headers: {
            "Content-Type": "Application/json",
          },
          body: JSON.stringify({
            pieces,
            puzzleId: this.puzzleId,
          }),
        }).then(res => res.json())
          .then((response) => {
            // console.log('/api/puzzle/createPieces response', response);
          });
      }
    }

    this.timeStarted = new Date().getTime();

    addEventListener(
      "beforeunload",
      function () {
        this.updateElapsedTime();
      }.bind(this)
    );

    const newPuzzleBtn = document.getElementById("js-create-new-puzzle");
    (newPuzzleBtn as HTMLElement).addEventListener("mousedown", () => {
      window.location.href = "/";
    });

    (this.stage as HTMLDivElement).classList.add("loaded");



    const integrationTestDragHelper = document.querySelector(
      "#integration-test-drag-helper"
    ) as HTMLDivElement;
    integrationTestDragHelper.style.position = "absolute";
    integrationTestDragHelper.style.top = window.innerHeight / 2 + "px";
    integrationTestDragHelper.style.top =
      parseInt((this.playBoundary as HTMLDivElement).style.left) / 2 + "px";
    integrationTestDragHelper.style.width = "100px";
    integrationTestDragHelper.style.height = "100px";
  }

  getSingleInstanceByIndex(
    index: number
  ): SingleMovable {
    return window.Puzzly.pieceInstances.find(
      (instance: SingleMovable) => {
        return instance.index === index
      }
    ) as SingleMovable;
  }

  getGroupInstanceById(
    id: string
  ): GroupMovable {
    return window.Puzzly.groupInstances.find(
      (instance: GroupMovable) => {
        return instance.id === id
      }
    ) as GroupMovable;
  }

  getSingleInstances(): SingleMovable[] {
    return this.pieceInstances;
  }

  getGroupInstances(): GroupMovable[] {
    return this.groupInstances;
  }

  // Question: Do we need this?
  removeSingleInstance(singleInstance: SingleMovable) {
    this.pieceInstances = this.pieceInstances.filter(
      (instance) => instance.id !== singleInstance.id
    );
  }

  // Question: Do we need this?`
  removeGroupInstance(groupInstance: GroupMovable) {
    this.groupInstances = this.groupInstances.filter(
      (instance) => instance.id !== groupInstance.id
    );
  }

  getPiecesInPlay() {
    return this.pieceInstances.filter((piece) => !piece.isSolved && !piece.groupInstance);
  }

  updateElapsedTime() {
    const now = new Date().getTime();
    const elapsedTime = now - this.timeStarted;

    return fetch(`/api/puzzle/updateTimePlayed`, {
      method: "PUT",
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify({
        puzzleId: this.puzzleId,
        timePlayed: elapsedTime,
      }),
    });
  }

  keepOnTop(el: MovableElement) {
    el.style.zIndex =
      (this.currentZIndex = (this.currentZIndex as number) + 1) + "";
  }
}
