import BaseMovable from "./BaseMovable";
import { EVENT_TYPES, ZOOM_INTERVALS } from "./constants";
import Puzzly from "./Puzzly";

export enum ZoomTypes {
  Normal = "normal",
  Pointer = "pointer",
}

export default class Zoom extends BaseMovable {
  stage: HTMLDivElement;
  isPreviewActive: boolean;
  currentZoomInterval: number;
  zoomLevel: BaseMovable["zoomLevel"];
  prevZoomLevel: number;
  zoomType: ZoomTypes;
  isZoomed: boolean;

  keys = [187, 189, 48];

  constructor(puzzly: Puzzly) {
    super(puzzly);
    this.isPreviewActive = puzzly.isPreviewActive;
    this.stage = puzzly.stage as HTMLDivElement;
    this.currentZoomInterval = 0;
    this.zoomLevel = ZOOM_INTERVALS[this.currentZoomInterval];

    window.Zoom = this;
    window.Puzzly.PlayBoundaryMovable.reCenter();

    window.addEventListener("keydown", this.handleKeyboardZoom.bind(this));
    window.addEventListener("dblclick", this.handlePointerZoom.bind(this));
  }

  handleKeyboardZoom(event: KeyboardEvent) {
    this.prevZoomLevel = this.zoomLevel;
    this.zoomType = ZoomTypes.Normal;

    if (this.keys.includes(event.which)) {
      this.setTransformOrigin(event);
    }

    // Plus key
    if (event.which === 187) {
      this.zoomType = ZoomTypes.Normal;
      this.increaseZoomLevel();
    }

    // Minus key
    if (event.which === 189) {
      this.zoomType = ZoomTypes.Normal;
      this.decreaseZoomLevel();
    }

    // "0" Number key
    if (event.which === 48) {
      this.resetZoomLevel();
      window.Puzzly.PlayBoundaryMovable.reCenter();
    }
  }

  handlePointerZoom(event: MouseEvent) {
    this.zoomType = ZoomTypes.Pointer;

    this.setTransformOrigin(event);

    if (this.currentZoomInterval < ZOOM_INTERVALS.length - 1) {
      this.increaseZoomLevel();
    } else if (this.currentZoomInterval === ZOOM_INTERVALS.length - 1) {
      this.resetZoomLevel();
    }
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
    this.currentZoomInterval = 0;
    this.zoomLevel = ZOOM_INTERVALS[this.currentZoomInterval];
    this.scalePlayBoundary(this.zoomLevel);
    window.Puzzly.PlayBoundaryMovable.reCenter();
    this.isZoomed = false;
  }

  setZoomLevel() {
    this.zoomLevel = ZOOM_INTERVALS[this.currentZoomInterval];
    this.scalePlayBoundary(this.zoomLevel);
  }

  increaseZoomLevel() {
    const newLevel = this.currentZoomInterval + 1;
    if (ZOOM_INTERVALS[newLevel]) {
      this.currentZoomInterval = newLevel;
      this.zoomLevel = ZOOM_INTERVALS[newLevel];
      this.scalePlayBoundary(this.zoomLevel);
      this.isZoomed = true;
    }
  }

  decreaseZoomLevel() {
    const newLevel = this.currentZoomInterval - 1;
    if (ZOOM_INTERVALS[newLevel]) {
      this.currentZoomInterval = newLevel;
      this.zoomLevel = ZOOM_INTERVALS[newLevel];
      this.scalePlayBoundary(this.zoomLevel);

      if (ZOOM_INTERVALS[newLevel] === ZOOM_INTERVALS[0]) {
        this.isZoomed = false;
        window.Puzzly.PlayBoundaryMovable.reCenter();
      }
    }
  }

  scalePlayBoundary(scale: number) {
    (window.Puzzly.playBoundary as HTMLDivElement).style.transform = `scale(${scale})`;

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
