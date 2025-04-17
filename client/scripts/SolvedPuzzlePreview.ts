import Puzzly from "./Puzzly";
import { SolvedPuzzlePreviewType } from "./types";

export default class SolvedPuzzlePreview {
  fullImageViewerEl: HTMLDivElement | null;
  backgroundElement: HTMLDivElement | null;
  controlElement: HTMLSpanElement | null;
  showBtn: HTMLSpanElement | null;
  hideBtn: HTMLSpanElement | null;
  puzzleImagePath: string;
  imagePreviewType: SolvedPuzzlePreviewType;
  isPreviewActive: boolean;
  isControlAvailable: boolean;
  cropData: any;

  constructor({ puzzleImagePath, imagePreviewType }: Puzzly) {
    this.isControlAvailable =
      imagePreviewType === SolvedPuzzlePreviewType.Toggle;
    this.controlElement = document.getElementById("preview");
    this.showBtn = document.getElementById("preview-show") as HTMLSpanElement;
    this.hideBtn = document.getElementById("preview-hide") as HTMLSpanElement;

    this.puzzleImagePath = puzzleImagePath;

    this.backgroundElement = document.getElementById(
      "solved-background"
    ) as HTMLDivElement;
    this.fullImageViewerEl = document.getElementById(
      "solved-preview"
    ) as HTMLDivElement;

    this.setupFullImagePreviewer();
  }

  setupFullImagePreviewer() {
    if (this.fullImageViewerEl) {
      this.fullImageViewerEl.style.background = `url(${this.puzzleImagePath}) no-repeat`;
      (this.fullImageViewerEl as HTMLDivElement).classList.add("js-hidden");
    }

    if (this.backgroundElement) {
      this.backgroundElement.style.background = `url(${this.puzzleImagePath}) no-repeat`;
      (this.backgroundElement as HTMLDivElement).style.opacity = 0.2 + "";
    }

    if (this.controlElement) {
      if (this.imagePreviewType === SolvedPuzzlePreviewType.AlwaysOn) {
        this.controlElement.style.display = "none";
      } else {
        this.controlElement.addEventListener(
          "mousedown",
          this.togglePreviewer.bind(this)
        );
      }
    }
  }

  togglePreviewer() {
    if (this.isPreviewActive) {
      // Hide preview image
      (this.fullImageViewerEl as HTMLDivElement).classList.add("js-hidden");
      (this.showBtn as HTMLSpanElement).classList.remove("js-hidden");
      (this.hideBtn as HTMLSpanElement).classList.add("js-hidden");
      this.isPreviewActive = false;
    } else {
      // Show preview image
      (this.fullImageViewerEl as HTMLDivElement).classList.remove("js-hidden");
      (this.showBtn as HTMLSpanElement).classList.add("js-hidden");
      (this.hideBtn as HTMLSpanElement).classList.remove("js-hidden");
      this.isPreviewActive = true;
    }
  }
}
