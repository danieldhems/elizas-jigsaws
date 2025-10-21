import {
  MINIMUM_NUMBER_OF_PIECES_PER_SIDE,
  MINIMUM_PIECE_SIZE_AS_PERCENTAGE_OF_VIEWPORT,
} from "../constants";
import GeneratorSteps from "../../sandbox/generatorSteps";
import {
  generatePieces,
  generatePuzzleConfigs,
} from "./puzzleGenerator";
import PuzzleImpressionOverlay from "../puzzle-main/PuzzleImpressionOverlay";
import Puzzly from "../puzzle-main";
import {
  PuzzleConfig,
  PuzzleImpression,
  PuzzleShapes,
} from "../types";
import Utils from "../utils";

export interface SourceImage {
  width: number;
  height: number;
  creatorImagePath: string;
  sourceImagePath: string;
  galleryImagePath: string;
  imageName: string;
  filename: string;
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
  activePuzzleConfig: PuzzleConfig;
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
  chkAddToLibrary: HTMLInputElement;
  imagePreviewElContainer: HTMLDivElement;
  imagePreviewElInner: HTMLDivElement;
  imagePreviewEl: HTMLImageElement;
  imageUploadField: HTMLInputElement;
  newPuzzleForm: HTMLDivElement;
  startBtn: HTMLInputElement;
  puzzleOptionsContainer: HTMLDivElement;
  puzzleSizeField: HTMLInputElement;
  puzzleShapeInputFields: NodeListOf<HTMLInputElement>;
  puzzleShapeFieldContainer: HTMLDivElement;
  sourceImagePath: string;
  creatorImagePath: string;
  galleryImagePath: string;
  imageUploadPreviewEl: HTMLImageElement & {
    naturalWidth: number;
    naturalHeight: number;
  };
  PuzzleImpressionOverlay: PuzzleImpressionOverlay;
  isIntegration: boolean;
  addToLibrary: boolean;

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
    this.chkAddToLibrary = document.querySelector(
      "#chk-add-to-library"
    ) as this["chkAddToLibrary"];
    this.imagePreviewElContainer = document.querySelector(
      "#puzzle-setup--image"
    ) as this["imagePreviewEl"];
    this.imagePreviewEl = document.querySelector(
      "#puzzle-setup--image_preview"
    ) as this["imagePreviewEl"];
    this.imagePreviewElInner = document.querySelector(
      "#puzzle-setup--image_preview_inner"
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
    this.puzzleShapeInputFields = document.querySelectorAll("[name='input-puzzle_shape']") as this["puzzleShapeInputFields"];
    this.imageUploadPreviewEl = document.getElementById(
      "puzzle-setup--image_preview-imgEl"
    ) as this["imageUploadPreviewEl"];
    this.puzzleTargetAreaElement = document.getElementById(
      "image-crop"
    ) as this["puzzleTargetAreaElement"];

    this.sourceImage = {
      width: 0,
      height: 0,
      creatorImagePath: "",
      sourceImagePath: "",
      galleryImagePath: "",
      imageName: "",
      filename: "",
    };

    this.debugOptions = {
      noDispersal: false,
      highlightConnectingPieces: false,
    };

    this.addToLibrary = false;

    this.addGeneralEventListeners();
    this.setupPuzzleShapefield();

    const imgId = Utils.getQueryStringValue("img_id");

    if (!imgId) {
      // TODO: Messy as hell doing this in an IF-statement
      const addToLibraryControl = document.getElementById("puzzle-setup--add-to-library");
      addToLibraryControl?.classList.remove("d-none");

      this.chkAddToLibrary.addEventListener(
        "input",
        function (e: InputEvent) {
          this.addToLibrary = (e.target as HTMLInputElement).checked;
          console.log("add to library", this.addToLibrary)
        }.bind(this)
      );
    }

    // TODO: Might need a more reliable test for valid img ID
    if (imgId.length === 24) {
      // Initiate puzzle impressions
      fetch("/api/getImageByIdForAuthenticatedUser/" + imgId)
        .then(res => res.json())
        .then(res => {
          console.log("fetched image by id", res);

          this.imageUploadPreviewEl.addEventListener(
            "load",
            this.onImagePreviewLoad.bind(this)
          );

          this.onUploadSuccess(res);
        })
        .catch(err => console.log(err))
    }

    this.selectedPuzzleShape = PuzzleShapes.Rectangle;

    if (!this.puzzleConfigs) {
      this.puzzleSizeInputField.disabled = true;
    }

    this.isIntegration =
      window.location.href.indexOf("isIntegration=true") > -1;
  }

  enablePuzzleShapeInputs() {
    Array.from(this.puzzleShapeInputFields).forEach((field) => {
      field.removeAttribute("disabled")
    });
  }

  disablePuzzleShapeInputs() {
    Array.from(this.puzzleShapeInputFields).forEach((field) => {
      field.setAttribute("disabled", "true")
    });
  }

  setPuzzleShapeInputsValue(puzzleShape: PuzzleShapes) {
    Array.from(this.puzzleShapeInputFields).forEach((field) => {
      if (field.value === puzzleShape) {
        field.setAttribute("checked", "true")
      } else {
        field.removeAttribute("checked")
      }
    });
  }

  setupPuzzleShapefield() {
    Array.from(this.puzzleShapeInputFields).forEach((field) => {
      field.addEventListener(
        "input",
        function (e: InputEvent) {
          e.preventDefault();
          e.stopImmediatePropagation()

          const target = e.target as HTMLInputElement;
          this.selectedPuzzleShape = target.value;

          if (this.selectedPuzzleShape === PuzzleShapes.Rectangle) {
            this.activePuzzleConfigs = this.puzzleConfigs.rectangularPuzzleConfigs;
          } else if (this.selectedPuzzleShape === PuzzleShapes.Square) {
            this.activePuzzleConfigs = this.puzzleConfigs.squarePuzzleConfigs;
          }

          this.PuzzleImpressionOverlay.setImpressions(
            this.activePuzzleConfigs
          );
          this.PuzzleImpressionOverlay.setActiveImpression(
            this.activePuzzleConfigs[0]
          );
          this.updatePuzzleSizeField(this.activePuzzleConfigs);
        }.bind(this)
      );
    })
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
      (this.imageUploadPreviewEl as HTMLImageElement).src =
        response.data.creatorImagePath;
      this.sourceImage = response.data;
      this.sourceImagePath = response.data.sourceImagePath;
      this.galleryImagePath = response.data.galleryImagePath;
      this.creatorImagePath = response.data.creatorImagePath;

      this.startBtn.removeAttribute("disabled");
    }
  }

  onImagePreviewLoad() {
    const { width, height } = this.sourceImage;

    this.imageAspectRatio = width / height;

    const { maxWidth, maxHeight } = GeneratorSteps.getMaximumPuzzleDimensionsForViewport(
      innerWidth, innerHeight, width, height,
    );

    this.maximumPuzzleWidth = maxWidth;
    this.maximumPuzzleHeight = maxHeight;

    const minimumPieceSize = Math.min(window.innerWidth, window.innerHeight) / 100 * MINIMUM_PIECE_SIZE_AS_PERCENTAGE_OF_VIEWPORT;

    const { rectangularPuzzleConfigs, squarePuzzleConfigs } =
      generatePuzzleConfigs(
        this.maximumPuzzleWidth,
        this.maximumPuzzleHeight,
        minimumPieceSize,
        MINIMUM_NUMBER_OF_PIECES_PER_SIDE
      );

    this.puzzleConfigs = {
      rectangularPuzzleConfigs,
      squarePuzzleConfigs,
    };

    console.log('puzzle configs', this.puzzleConfigs);

    if (width === height) {
      this.selectedPuzzleShape = PuzzleShapes.Square;
      this.activePuzzleConfigs = this.puzzleConfigs.squarePuzzleConfigs;
      this.disablePuzzleShapeInputs()
      this.setPuzzleShapeInputsValue(PuzzleShapes.Square);
    } else {
      this.selectedPuzzleShape = PuzzleShapes.Rectangle;
      this.activePuzzleConfigs = this.puzzleConfigs.rectangularPuzzleConfigs;
      this.enablePuzzleShapeInputs()
      this.setPuzzleShapeInputsValue(PuzzleShapes.Rectangle);
    }

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

    this.imagePreviewEl.classList.remove("d-none");

    this.updatePuzzleSizeField(this.activePuzzleConfigs);
    this.addPuzzleOptionEventListeners();
    this.getCropData();
  }

  updatePuzzleSizeField(puzzleConfigs: PuzzleConfig[]) {
    this.selectedPuzzleConfig = puzzleConfigs[0];

    if (puzzleConfigs.length > 1) {
      this.puzzleSizeInputField.removeAttribute("disabled");
      this.puzzleSizeInputField.min = 1 + "";
      this.puzzleSizeInputField.max = puzzleConfigs.length + "";
      this.puzzleSizeInputField.value = 1 + "";
    } else {
      this.puzzleSizeInputField.setAttribute("disabled", "true");
    }

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
    fd.append("viewportWidth", window.innerWidth + "");
    fd.append("viewportHeight", window.innerHeight + "");
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

    const imageWidth = this.sourceImage.width;
    const imageHeight = this.sourceImage.height;

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

  async createPuzzle(options: Record<any, any> | null = null) {
    // const pieces = generatePieces(this.selectedPuzzleConfig);
    const cropData = this.getCropData();

    const makePuzzleImageResponse = await fetch("/api/makePuzzleImage", {
      body: JSON.stringify({
        ...cropData,
        ...this.sourceImage,
        resizeWidth: Math.floor(this.selectedPuzzleConfig.puzzleWidth),
        resizeHeight: Math.floor(this.selectedPuzzleConfig.puzzleHeight),
      }),
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    const {
      puzzleImagePath,
    } = await makePuzzleImageResponse.json();

    const { puzzleWidth, puzzleHeight } = this.selectedPuzzleConfig;

    const data = {
      ...this.selectedPuzzleConfig,
      pieces: mappedPieces,
      boardWidth: puzzleWidth,
      boardHeight: puzzleHeight,
      filename: this.sourceImage.filename,
      puzzleImagePath,
      sourceImagePath: this.sourceImagePath,
      creatorImagePath: this.creatorImagePath,
      galleryImagePath: this.galleryImagePath,
      addToLibrary: this.addToLibrary,
      debugOptions: this.debugOptions,
      isIntegration: this.isIntegration,
    };

    fetch("/api/puzzle/createPuzzle", {
      body: JSON.stringify(data),
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    })
      .then((response) => response.json())
      .then(
        function (response: any) {
          console.log('/api/puzzle/createPuzzle response', response)
          window.Puzzly = new Puzzly({
            ...data,
            puzzleId: response._id,
            pieces,
            puzzleImagePath,
            boardWidth: puzzleWidth,
            boardHeight: puzzleHeight,
          });

          window.location.href = "/puzzle?id=" + response._id;
        }.bind(this)
      )
      .catch(function (err) {
        console.log(err);
      });
  }
}

window.PuzzlyCreator = PuzzlyCreator;
