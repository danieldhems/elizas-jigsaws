import BaseMovable from "./BaseMovable";
import { EVENT_TYPES, ZOOM_AMOUNT } from "./constants";
import Puzzly from "./Puzzly";

export enum ZoomTypes {
  Normal = "normal",
  Pointer = "pointer",
}

export default class Zoom extends BaseMovable {
  stage: HTMLDivElement;
  isPreviewActive: boolean;
  zoomLevel: BaseMovable["zoomLevel"];
  prevZoomLevel: number;
  zoomType: ZoomTypes;
  isZoomed: boolean;

  keys = [187, 189, 48];

  constructor(puzzly: Puzzly) {
    super(puzzly);
    this.isPreviewActive = puzzly.isPreviewActive;
    this.stage = puzzly.stage as HTMLDivElement;
    this.zoomLevel = 1;

    window.Zoom = this;
    window.Puzzly.PlayBoundaryMovable.reCenter();

    window.addEventListener("keydown", this.handleKeyboardZoom.bind(this));
    window.addEventListener("dblclick", this.handlePointerZoom.bind(this));
  }

  handleKeyboardZoom(event: KeyboardEvent) {
    event.preventDefault();

    this.prevZoomLevel = this.zoomLevel;
    this.zoomType = ZoomTypes.Normal;

    if (this.keys.includes(event.which)) {
      // this.setTransformOrigin(event);
    }

    // Plus key
    if (event.which === 187) {
      this.zoomType = ZoomTypes.Normal;
      this.increaseZoomLevel(ZOOM_AMOUNT);
    }

    // Minus key
    if (event.which === 189) {
      this.zoomType = ZoomTypes.Normal;
      this.decreaseZoomLevel(ZOOM_AMOUNT);
    }

    // "0" Number key
    if (event.which === 48) {
      this.resetZoomLevel();
      window.Puzzly.PlayBoundaryMovable.reCenter();
    }
  }

  handlePointerZoom(event: MouseEvent) {
    this.zoomType = ZoomTypes.Pointer;

    // this.setTransformOrigin(event);

    // if (this.currentZoomInterval < ZOOM_INTERVALS.length - 1) {
    //   this.increaseZoomLevel();
    // } else if (this.currentZoomInterval === ZOOM_INTERVALS.length - 1) {
    //   this.resetZoomLevel();
    // }
  }

  getTransformOrigin(
    event: KeyboardEvent | MouseEvent
  ): { top: number; left: number } | undefined {
    if (this.zoomType === ZoomTypes.Normal) {
      return {
        top:
          window.innerHeight / 2 -
          (window.Puzzly.playBoundary as HTMLDivElement).offsetTop,
        left:
          window.innerWidth / 2 -
          (window.Puzzly.playBoundary as HTMLDivElement).offsetLeft,
      };
    } else if (this.zoomType === ZoomTypes.Pointer) {
      const pointerEvent = event as MouseEvent;
      return {
        top: pointerEvent.clientY,
        left: pointerEvent.clientX,
      };
    }
  }

  setTransformOrigin(event: MouseEvent | KeyboardEvent) {
    const { top, left } = this.getTransformOrigin(event) as {
      top: number;
      left: number;
    };
    // console.log("transform origin", top, left);
    (
      window.Puzzly.playBoundary as HTMLDivElement
    ).style.transformOrigin = `${top}px ${left}px`;
  }

  // Might want an observer of some kind for the scalePlayBoundary method calls here, instead of manually calling it in all of these helper methods.
  resetZoomLevel() {
    this.zoomLevel = 1;
    this.scalePlayBoundary(this.zoomLevel);
    window.Puzzly.PlayBoundaryMovable.reCenter();
    this.isZoomed = false;
  }

  setZoomLevel() {
    this.zoomLevel = 1;
    this.scalePlayBoundary(this.zoomLevel);
  }

  increaseZoomLevel(amount: number) {
    this.zoomLevel += amount;
    this.scalePlayBoundary(this.zoomLevel);
    this.isZoomed = true;
  }

  decreaseZoomLevel(amount: number) {
    this.zoomLevel -= amount;
    this.scalePlayBoundary(this.zoomLevel);

    if (this.zoomLevel === 1) {
      this.isZoomed = false;
      window.Puzzly.PlayBoundaryMovable.reCenter();
    }
  }

  scalePlayBoundary(scale: number) {
    (window.Puzzly.piecesContainer as HTMLDivElement).style.transform = `scale(${scale})`;

    if (this.zoomLevel !== this.prevZoomLevel) {
      window.dispatchEvent(
        new CustomEvent(EVENT_TYPES.CHANGE_SCALE, { detail: this.zoomLevel })
      );
    }

    if (this.isPreviewActive) {
      // TODO: Reimplement
      // this.updatePreviewerSizeAndPosition();
    }
  }


}
