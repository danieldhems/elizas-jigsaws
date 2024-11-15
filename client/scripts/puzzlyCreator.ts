import {
  CONNECTOR_SIZE_PERC,
  CONNECTOR_TOLERANCE_AMOUNT,
  MINIMUM_NUMBER_OF_PIECES,
  MINIMUM_PIECE_SIZE,
  SHADOW_OFFSET_RATIO,
  SHOULDER_SIZE_PERC,
} from "./constants";
import GeneratorSteps from "./generatorSteps";
import puzzleGenerator, {
  addPuzzleDataToPieces,
  getPuzzleConfigs,
} from "./puzzleGenerator";
import PuzzleImpressionOverlay from "./PuzzleImpressionOverlay";
import Puzzly from "./Puzzly";
import {
  PuzzleConfig,
  PuzzleImpression,
  PuzzleShapes,
  SkeletonPiece,
} from "./types";
import Utils from "./utils";

export interface SourceImage {
  dimensions: {
    width: number;
    height: number;
  };
  previewPath: string;
  fullSizePath: string;
  imageName: string;
  filename: string;
  width: number;
  height: number;
}

export interface DebugOptions {
  noDispersal: boolean;
  highlightConnectingPieces: boolean;
}

export default class PuzzlyCreator {
  selectedNumPieces: number;
  piecesPerSideHorizontal: number;
  piecesPerSideVertical: number;
  sourceImage: SourceImage;
  puzzleConfigs: {
    rectangularPuzzleConfigs: PuzzleConfig[];
    squarePuzzleConfigs: PuzzleConfig[];
  };
  activePuzzleConfigs: PuzzleConfig[];
  selectedPuzzleConfig: PuzzleConfig;
  selectedPuzzleShape: PuzzleShapes;
  /**
   * Puzzle target area
   * Used by PuzzleImpressionOverlay
   *
   * The following properties describe the overlay element for the uploaded image
   * which shows the user which portion of the image the puzzle will be
   * generated from.
   *
   */
  puzzleTargetAreaOffsetLeft: number;
  puzzleTargetAreaOffsetTop: number;
  puzzleTargetAreaWidth: number;
  puzzleTargetAreaHeight: number;
  puzzleTargetAreaCalculatedWidth: number;
  puzzleTargetAreaCalculatedHeight: number;
  puzzleTargetAreaElement: HTMLElement;
  /* End puzzleTargetArea properties */
  debugOptions: DebugOptions;
  // The widest and tallest the generated puzzle can be given the ideal puzzle size as determined by the size of the viewport,
  // and the aspect ratio of the uploaded image.
  maximumPuzzleWidth: number;
  maximumPuzzleHeight: number;
  // The width of the puzzle based on the available viewport width
  // Only to be used if the puzzle is generated in portrait orientation
  solvingAreaWidth: number;
  // The height of the puzzle based on the available viewport height
  // Only to be used if the puzzle is generated in landscape orientation
  solvingAreaHeight: number;
  // The aspect ratio of the uploaded image
  // Use this to determine either the width or height of the puzzle depending on its orientation
  imageAspectRatio: number;
  boardWidth: number;
  boardHeight: number;
  puzzleSizeInputField: HTMLInputElement;
  puzzleSizeInputLabel: HTMLLabelElement;
  chkHighlights: HTMLInputElement;
  chkNoDispersal: HTMLInputElement;
  imagePreviewEl: HTMLImageElement;
  imageUploadField: HTMLInputElement;
  newPuzzleForm: HTMLDivElement;
  startBtn: HTMLInputElement;
  puzzleOptionsContainer: HTMLDivElement;
  puzzleSizeField: HTMLInputElement;
  puzzleShapeInputField: HTMLInputElement;
  puzzleShapeFieldContainer: HTMLDivElement;
  fullSizePath: string;
  imageUploadPreviewEl: HTMLImageElement & {
    naturalWidth: number;
    naturalHeight: number;
  };
  PuzzleImpressionOverlay: PuzzleImpressionOverlay;
  isIntegration: boolean;

  constructor() {
    this.puzzleOptionsContainer = document.querySelector(
      "#puzzle-setup--options"
    ) as this["puzzleOptionsContainer"];

    this.puzzleSizeInputField = document.querySelector(
      "#puzzle-size-input-field"
    ) as this["puzzleSizeInputField"];
    this.puzzleSizeInputLabel = document.querySelector(
      "#puzzle-size-input-label"
    ) as this["puzzleSizeInputLabel"];

    this.puzzleShapeFieldContainer = document.querySelector(
      "#puzzle-setup--puzzle-shape .field-container"
    ) as this["puzzleShapeFieldContainer"];

    this.chkHighlights = document.querySelector(
      "#chk-highlights"
    ) as this["chkHighlights"];
    this.chkNoDispersal = document.querySelector(
      "#chk-no-disperse"
    ) as this["chkNoDispersal"];
    this.imagePreviewEl = document.querySelector(
      "#puzzle-setup--image_preview"
    ) as this["imagePreviewEl"];
    this.imageUploadField = document.querySelector(
      "#upload-fld"
    ) as this["imageUploadField"];
    this.newPuzzleForm = document.querySelector(
      "#form-container"
    ) as this["newPuzzleForm"];
    this.startBtn = document.querySelector("#start-btn") as this["startBtn"];
    this.puzzleSizeField = document.getElementById(
      "puzzle-size-input-field"
    ) as this["puzzleSizeField"];
    this.imageUploadPreviewEl = document.getElementById(
      "puzzle-setup--image_preview-imgEl"
    ) as this["imageUploadPreviewEl"];
    this.puzzleTargetAreaElement = document.getElementById(
      "image-crop"
    ) as this["puzzleTargetAreaElement"];

    this.sourceImage = {
      dimensions: {
        width: 0,
        height: 0,
      },
      previewPath: "",
      fullSizePath: "",
      imageName: "",
      filename: "",
      width: 0,
      height: 0,
    };

    this.debugOptions = {
      noDispersal: false,
      highlightConnectingPieces: false,
    };

    this.showForm();
    this.addGeneralEventListeners();

    this.selectedPuzzleShape = PuzzleShapes.Rectangle;

    if (!this.puzzleConfigs) {
      this.puzzleSizeInputField.disabled = true;
    }

    this.isIntegration =
      window.location.href.indexOf("isIntegration=true") > -1;
  }

  setupPuzzleShapefield() {
    const inputs = document.querySelectorAll("[name='input-puzzle_shape']");

    Array.from(inputs).forEach((field) => {
      field.removeAttribute("disabled");
      field.addEventListener(
        "input",
        function (e: InputEvent) {
          e.preventDefault();
          const target = e.target as HTMLInputElement;
          this.selectedPuzzleShape = target.value;

          let selectedConfigs;
          switch (this.selectedPuzzleShape) {
            case PuzzleShapes.Square:
              selectedConfigs = this.puzzleConfigs.squarePuzzleConfigs;
              break;
            case PuzzleShapes.Rectangle:
              selectedConfigs = this.puzzleConfigs.rectangularPuzzleConfigs;
              break;
          }

          this.activePuzzleConfigs = this.getPuzzleConfigsForSelectedShape(
            target.value
          );

          if (this.activePuzzleConfigs) {
            this.PuzzleImpressionOverlay.setImpressions(
              this.activePuzzleConfigs
            );
            this.PuzzleImpressionOverlay.setActiveImpression(
              this.activePuzzleConfigs[0]
            );
            this.updatePuzzleSizeField(this.activePuzzleConfigs);
          }
        }.bind(this)
      );
    })
  }

  showForm() {
    this.newPuzzleForm.style.display = "flex";
  }

  addGeneralEventListeners() {
    this.imageUploadField.addEventListener(
      "change",
      this.onImageUploadChange.bind(this)
    );

    this.imageUploadPreviewEl.addEventListener(
      "load",
      this.onImagePreviewLoad.bind(this)
    );

    this.startBtn.addEventListener("click", this.onStartBtnClick.bind(this));
  }

  addPuzzleOptionEventListeners() {
    this.puzzleSizeInputField.addEventListener("input", (event: InputEvent) => {
      const eventTarget = event.target as HTMLInputElement;
      const value = parseInt(eventTarget.value);

      const highlightedPuzzleSize: PuzzleConfig =
        this.activePuzzleConfigs[value - 1];

      if (this.puzzleConfigs) {
        this.puzzleSizeInputLabel.textContent =
          highlightedPuzzleSize.totalNumberOfPieces + "";
        this.PuzzleImpressionOverlay.setActiveImpression(highlightedPuzzleSize);
        this.selectedPuzzleConfig = highlightedPuzzleSize;
      }
    });

    // this.chkHighlights.addEventListener(
    //   "input",
    //   function (e: InputEvent) {
    //     this.debugOptions.highlightConnectingPieces = (
    //       e.target as HTMLInputElement
    //     ).checked;
    //   }.bind(this)
    // );

    this.chkNoDispersal.addEventListener(
      "input",
      function (e: InputEvent) {
        this.debugOptions.noDispersal = (e.target as HTMLInputElement).checked;
      }.bind(this)
    );

    window.addEventListener(
      "PuzzlyPuzzleImpressionMoved",
      this.onOverlayMove.bind(this)
    );
  }

  onImageUploadChange(e: MouseEvent) {
    // e.preventDefault();
    this.upload()
      .then(
        function (d: Response) {
          this.onUploadSuccess(d);
        }.bind(this)
      )
      .catch(
        function (err: Error) {
          this.onUploadFailure(err);
        }.bind(this)
      );
  }

  onOverlayMove(event: CustomEvent) {
    console.log(event.detail);
    const { left, top } = event.detail;
    this.puzzleTargetAreaOffsetLeft = left;
    this.puzzleTargetAreaOffsetTop = top;

    this.setPuzzleImageOffsetAndWidth();
  }

  onStartBtnClick(e: SubmitEvent) {
    e.preventDefault();
    this.createPuzzle();
  }

  onUploadSuccess(response: { data: SourceImage }) {
    console.log("onUploadSuccess", response);

    if (response.data) {
      this.imagePreviewEl.style.display = "flex";
      // this.imagePreviewEl.style.opacity = "0.5";
      // (
      //   this.imagePreviewEl as HTMLImageElement
      // ).style.backgroundImage = "url("+response.data.fullSizePath+")";
      (this.imageUploadPreviewEl as HTMLImageElement).src =
        response.data.fullSizePath;
      this.sourceImage.imageName = response.data.filename;
      this.fullSizePath = response.data.fullSizePath;

      this.sourceImage.dimensions.width = response.data.width;
      this.sourceImage.dimensions.height = response.data.height;
    }
  }

  onImagePreviewLoad() {
    const { width, height } = this.sourceImage.dimensions;

    this.imageAspectRatio = width / height;

    const { maxWidth, maxHeight } = GeneratorSteps.getMaximumPuzzleDimensionsForViewport(
      innerWidth, innerHeight, width, height,
    );

    this.maximumPuzzleWidth = maxWidth;
    this.maximumPuzzleHeight = maxHeight;

    const { rectangularPuzzleConfigs, squarePuzzleConfigs } =
      getPuzzleConfigs(
        this.maximumPuzzleWidth,
        this.maximumPuzzleHeight,
        MINIMUM_PIECE_SIZE,
        MINIMUM_NUMBER_OF_PIECES
      );

    this.puzzleConfigs = {
      rectangularPuzzleConfigs,
      squarePuzzleConfigs,
    };

    this.activePuzzleConfigs = this.getPuzzleConfigsForSelectedShape(
      this.selectedPuzzleShape
    );

    console.log("active puzzle configs", this.activePuzzleConfigs)
    this.selectedPuzzleConfig = this.activePuzzleConfigs[0];

    const puzzleImpressionOverlayConfig = {
      targetElement: this.imageUploadPreviewEl,
      puzzleConfigs: this.activePuzzleConfigs,
      selectedPuzzleConfig: this.selectedPuzzleConfig,
    };

    if (this.PuzzleImpressionOverlay) {
      this.PuzzleImpressionOverlay.initiate(puzzleImpressionOverlayConfig)
    } else {
      this.PuzzleImpressionOverlay = new PuzzleImpressionOverlay(
        puzzleImpressionOverlayConfig
      );
    }

    this.imagePreviewEl.classList.remove("js-hidden");

    this.updatePuzzleSizeField(
      this.getPuzzleConfigsForSelectedShape(this.selectedPuzzleShape)
    );
    this.puzzleSizeInputField.value = 1 + "";
    this.puzzleSizeInputField.disabled = false;

    this.setupPuzzleShapefield();
    this.addPuzzleOptionEventListeners();
    this.getCropData();
  }

  getPuzzleConfigsForSelectedShape(shape: PuzzleShapes) {
    switch (shape) {
      case PuzzleShapes.Rectangle:
        return this.puzzleConfigs.rectangularPuzzleConfigs;
      case PuzzleShapes.Square:
        return this.puzzleConfigs.squarePuzzleConfigs;
    }
  }

  updatePuzzleSizeField(puzzleConfigs: PuzzleConfig[]) {
    this.selectedPuzzleConfig = puzzleConfigs[0];
    this.puzzleSizeInputField.min = 1 + "";
    this.puzzleSizeInputField.max = puzzleConfigs.length + "";
    this.puzzleSizeInputField.value = 1 + "";
    this.puzzleSizeInputLabel.textContent =
      this.selectedPuzzleConfig.totalNumberOfPieces + "";
  }

  onFullSizeImageLoad(e: Response) {
    console.log(e);
  }

  onUploadFailure(response: string) {
    console.log("onUploadFailure", response);
    this.imagePreviewEl.textContent = response;
  }

  setPuzzleImageOffsetAndWidth() {
    const leftPos = this.puzzleTargetAreaOffsetLeft;
    const topPos = this.puzzleTargetAreaOffsetTop;

    const cropLeftOffsetPercentage = Math.floor(
      (leftPos / this.imageUploadPreviewEl.naturalWidth) * 100
    );
    const cropTopOffsetPercentage = Math.floor(
      (topPos / this.imageUploadPreviewEl.naturalHeight) * 100
    );
    const cropWidthPercentage = Math.floor(
      (this.puzzleTargetAreaWidth / this.imageUploadPreviewEl.naturalWidth) *
      100
    );
    const cropHeightPercentage = Math.floor(
      (this.puzzleTargetAreaWidth / this.imageUploadPreviewEl.naturalWidth) *
      100
    );

    this.puzzleTargetAreaOffsetLeft =
      (this.imageUploadPreviewEl.naturalWidth / 100) * cropLeftOffsetPercentage;
    this.puzzleTargetAreaOffsetTop =
      (this.imageUploadPreviewEl.naturalHeight / 100) * cropTopOffsetPercentage;
    this.puzzleTargetAreaCalculatedWidth =
      (this.imageUploadPreviewEl.naturalWidth / 100) * cropWidthPercentage;
    this.puzzleTargetAreaCalculatedHeight =
      (this.imageUploadPreviewEl.naturalWidth / 100) * cropHeightPercentage;
  }

  upload(): Promise<Response> {
    const fileFld = document.querySelector("#upload-fld") as HTMLInputElement;
    const files = fileFld.files as FileList;

    let image;
    if (files.length > 0) {
      image = files[0] as File;
      // console.log("image to upload", image);
    }

    const fd = new FormData();

    if (image) {
      fd.append("files[]", image);
    }

    fd.append("previewWidth", this.imagePreviewEl.offsetWidth.toString());
    fd.append("previewHeight", this.imagePreviewEl.offsetHeight.toString());
    // fd.append("boardSize", this.boardHeight.toString());
    fd.append("integration", this.isIntegration + "");

    return fetch("/api/upload", {
      body: fd,
      method: "POST",
    }).then((response) => response.json());
  }

  getCropData() {
    let widthPercentage,
      heightPercentage,
      leftOffsetPercentage,
      topOffsetPercentage;

    const imageWidth = this.sourceImage.dimensions.width;
    const imageHeight = this.sourceImage.dimensions.height;

    const { top, left, width, height } =
      this.PuzzleImpressionOverlay.getPositionAndDimensions();
    const { offsetWidth, offsetHeight } = this.imageUploadPreviewEl;

    widthPercentage = Math.floor((width / offsetWidth) * 100);
    heightPercentage = Math.floor((height / offsetHeight) * 100);
    leftOffsetPercentage = Math.floor((Math.abs(left) / offsetWidth) * 100);
    topOffsetPercentage = Math.floor((Math.abs(top) / offsetHeight) * 100);

    return {
      imageWidth,
      imageHeight,
      topOffsetPercentage,
      leftOffsetPercentage,
      widthPercentage,
      heightPercentage,
    };
  }

  // getPuzzleDimensions(
  //   puzzleConfig: Pick<
  //     PuzzleConfig,
  //     | "imageWidth"
  //     | "imageHeight"
  //     | "numberOfPiecesHorizontal"
  //     | "numberOfPiecesVertical"
  //   >,
  //   activeImpression: PuzzleImpression
  // ) {
  //   const { numberOfPiecesHorizontal, numberOfPiecesVertical } = puzzleConfig;
  //   const { impressionWidth, impressionHeight } = activeImpression;

  //   const isSquare = numberOfPiecesHorizontal === numberOfPiecesVertical;

  //   let width: number;
  //   let height: number;
  //   let pieceSize: number;
  //   let connectorSize: number;
  //   let connectorDistanceFromCorner: number;
  //   let connectorTolerance: number;
  //   let shadowOffset: number;

  //   const impressionW = impressionWidth as number;
  //   const impressionH = impressionHeight as number;

  //   if (window.innerWidth < window.innerHeight) {
  //     height = Utils.getSolvingAreaHeight();
  //     width = isSquare ? height : (impressionW / impressionH) * height;
  //   } else if (window.innerHeight < window.innerWidth) {
  //     width = Utils.getSolvingAreaWidth();
  //     height = isSquare ? width : (impressionH / impressionW) * width;
  //   } else {
  //     width = Utils.getSolvingAreaWidth();
  //     height = width;
  //   }

  //   if (isSquare) {
  //     // For square puzzles use either width or height to dervice piece size from
  //     // as both are equal
  //     pieceSize = height / numberOfPiecesVertical;
  //   } else {
  //     if (numberOfPiecesHorizontal < numberOfPiecesVertical) {
  //       pieceSize = width / numberOfPiecesHorizontal;
  //     } else {
  //       pieceSize = height / numberOfPiecesVertical;
  //     }
  //   }

  //   const onePercent = pieceSize / 100;

  //   connectorSize = onePercent * CONNECTOR_SIZE_PERC;
  //   connectorDistanceFromCorner = onePercent * SHOULDER_SIZE_PERC;
  //   connectorTolerance = onePercent * CONNECTOR_TOLERANCE_AMOUNT;
  //   shadowOffset = onePercent * SHADOW_OFFSET_RATIO;

  //   return {
  //     puzzleWidth: width,
  //     puzzleHeight: height,
  //     pieceSize,
  //     connectorSize,
  //     connectorDistanceFromCorner,
  //     connectorTolerance,
  //     shadowOffset,
  //   };
  // }

  async createPuzzle(options: Record<any, any> | null = null) {
    // const pieces = generatePieces(this.selectedPuzzleConfig);
    const cropData = this.getCropData();

    // console.log("crop data", cropData)

    const activeImpression = this.PuzzleImpressionOverlay.getActiveImpression();
    // console.log("active impression", activeImpression);
    // console.log("selected puzzle config", this.selectedPuzzleConfig);
    // const puzzleDimensions = this.getPuzzleDimensions(this.selectedPuzzleConfig, activeImpression);

    let mappedPieces: SkeletonPiece[];
    if (activeImpression.pieces) {
      mappedPieces = addPuzzleDataToPieces(
        activeImpression.pieces,
        this.selectedPuzzleConfig
      );
    }
    // console.log("mapped pieces", mappedPieces);

    const makePuzzleImageResponse = await fetch("/api/makePuzzleImage", {
      body: JSON.stringify({
        ...cropData,
        dimensions: this.sourceImage.dimensions,
        imageName: this.sourceImage.imageName,
        resizeWidth: Math.floor(this.selectedPuzzleConfig.puzzleWidth),
        resizeHeight: Math.floor(this.selectedPuzzleConfig.puzzleHeight),
      }),
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    const { puzzleImagePath } = await makePuzzleImageResponse.json();
    const { puzzleWidth, puzzleHeight } = this.selectedPuzzleConfig;

    const data = {
      ...this.selectedPuzzleConfig,
      boardWidth: puzzleWidth,
      boardHeight: puzzleHeight,
      imageName: this.sourceImage.imageName,
      puzzleImagePath,
      debugOptions: this.debugOptions,
      isIntegration: this.isIntegration,
    };

    // const puzzleSprite = await generatePuzzleSprite(puzzleImagePath, mappedPieces);

    fetch("/api/puzzle", {
      body: JSON.stringify(data),
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    })
      .then((response) => response.json())
      .then(
        function (response: any) {
          console.log("Puzzle creation response", response);
          const puzzleId = response._id;

          Utils.insertUrlParam("puzzleId", puzzleId);

          this.newPuzzleForm.style.display = "none";

          window.Puzzly = new Puzzly(puzzleId, {
            ...data,
            pieces: mappedPieces,
            _id: response._id,
            previewPath: response.previewPath,
            // puzzleSprite,
            puzzleImagePath,
            boardWidth: puzzleWidth,
            boardHeight: puzzleHeight,
          });
        }.bind(this)
      )
      .catch(function (err) {
        console.log(err);
      });
  }
}

window.PuzzlyCreator = PuzzlyCreator;
