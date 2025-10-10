import BaseMovable from "./BaseMovable";
import Puzzly from ".";
import { EVENT_TYPES, MINIMUM_VIEWPORT_LENGTH_FOR_OUTOFBOUNDS_TO_BE_USED, SCREEN_MARGIN } from "../constants";
import { InstanceTypes } from "../types";
import Utils from "../utils";

export default class PlayBoundaryMovable extends BaseMovable {
  instanceType = InstanceTypes.PlayBoundaryMovable;
  stage: HTMLDivElement;
  viewportLargeEnoughForOutOfBoundsArea: boolean;
  puzzleWidth: number;
  puzzleHeight: number;

  constructor(puzzly: Puzzly) {
    super(puzzly);

    this.element = window.Puzzly.playBoundary as HTMLDivElement;
    this.stage = puzzly.stage as HTMLDivElement;
    this.puzzleWidth = puzzly.boardWidth;
    this.puzzleHeight = puzzly.boardHeight;
    window.Puzzly.PlayBoundaryMovable = this;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.element.addEventListener("mousedown", this.onMouseDown);
    this.element.addEventListener("mousemove", this.onMouseMove);

    this.init();

    window.addEventListener(
      EVENT_TYPES.DRAGANDSELECT_ACTIVE,
      (event: CustomEvent) => {
        this.isDragAndSelectActive = event.detail;
      }
    );
  }

  init() {
    this.setSize();
    window.addEventListener("resize", this.reCenter.bind(this));
  }

  setSize() {
    if (window.innerHeight < window.innerWidth) {
      // Landscape viewport
      const height = window.innerHeight - (SCREEN_MARGIN * 2);
      const width = window.innerWidth < MINIMUM_VIEWPORT_LENGTH_FOR_OUTOFBOUNDS_TO_BE_USED
        ? window.innerWidth - (SCREEN_MARGIN * 2)
        : MINIMUM_VIEWPORT_LENGTH_FOR_OUTOFBOUNDS_TO_BE_USED;
      this.element.style.height = height + "px";
      this.element.style.width = width + "px";
    } else if (window.innerWidth < window.innerHeight) {
      // Portrait viewport
      const width = window.innerWidth - (SCREEN_MARGIN * 2);
      const height = window.innerHeight < MINIMUM_VIEWPORT_LENGTH_FOR_OUTOFBOUNDS_TO_BE_USED
        ? window.innerHeight - (SCREEN_MARGIN * 2)
        : MINIMUM_VIEWPORT_LENGTH_FOR_OUTOFBOUNDS_TO_BE_USED;
      this.element.style.width = width + "px";
      this.element.style.height = height + "px";
    }
  }

  drawSolvingArea() {

  }

  reCenter() {
    const { playBoundary } = window.Puzzly;
    if (playBoundary) {
      const stageRect = this.stage.getBoundingClientRect();
      const playBoundaryRect = playBoundary.getBoundingClientRect();

      // TODO: Abstract / clean up
      if (window.innerHeight < window.innerWidth) {
        // Landscape viewport
        playBoundary.style.top = Utils.getPxString(
          SCREEN_MARGIN
        );
        if (window.innerWidth < MINIMUM_VIEWPORT_LENGTH_FOR_OUTOFBOUNDS_TO_BE_USED) {
          playBoundary.style.left = Utils.getPxString(
            SCREEN_MARGIN
          );
        } else {
          playBoundary.style.left = Utils.getPxString(
            stageRect.width / 2 - playBoundaryRect.width / 2
          );
        }
      } else if (window.innerWidth < window.innerHeight) {
        // Portrait viewport
        playBoundary.style.left = Utils.getPxString(
          SCREEN_MARGIN
        );
        if (window.innerHeight < MINIMUM_VIEWPORT_LENGTH_FOR_OUTOFBOUNDS_TO_BE_USED) {
          playBoundary.style.top = Utils.getPxString(
            SCREEN_MARGIN
          );
        } else {
          playBoundary.style.top = Utils.getPxString(
            stageRect.height / 2 - playBoundaryRect.height / 2
          );
        }
      }

      window.dispatchEvent(new CustomEvent(EVENT_TYPES.RESIZE));
    }
  }

  onMouseDown(event: MouseEvent) {
    if (
      this.isPlayBoundary(event.target as HTMLElement) &&
      window.Zoom.isZoomed
    ) {
      // TODO: Is this needed?
      this.active = true;
      super.onPickup(event);

      this.element.addEventListener("mousemove", this.onMouseMove);
      this.element.addEventListener("mouseup", this.onMouseUp);
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.active && !this.isDragAndSelectActive) {
      let newPosTop, newPosLeft;

      // this.shouldConstrainViewport()
      // Viewport constraint not yet implemented so just ignore for now and move the play boundary around freely
      newPosTop = event.clientY - this.diffY;
      newPosLeft = event.clientX - this.diffX;

      this.element.style.top = newPosTop + "px";
      this.element.style.left = newPosLeft + "px";
    }
  }

  onMouseUp() {
    if (this.active) {
      this.element.removeEventListener('mousemove', this.onMouseMove);
      this.active = false;
    }
  }

  // Determine whether to allow the play boundary to be dragged any further based on its relation to the viewport
  shouldConstrainViewport(event: MouseEvent) {
    // TODO: Implement
    const rect = this.element.getBoundingClientRect();

    const currentTop = parseInt(this.element.style.top);
    // console.log("rect height", rect.height);
    // console.log("rect width", rect.width);
    // console.log("rect right", rect.right);
    console.log("rect bottom", rect.bottom);
    console.log("window height", window.innerHeight);
    // console.log("viewport width", window.innerWidth);
    const cutOffHeight =
      Math.floor((rect.height - this.element.offsetHeight) / 2) + 10;
    const cutOffWidth =
      Math.floor((rect.width - this.element.offsetWidth) / 2) + 10;
    // console.log("cut off height", cutOffHeight);
    // console.log("cut off width", cutOffWidth);

    // const target = cutOffWidth - window.innerWidth;
    // console.log("target", target);
    // console.log(this.element.offsetLeft + this.element);

    const newPosTop = event.clientY - this.diffY;
    const newPosLeft = event.clientX - this.diffX;

    // console.log("newPosLeft", newPosLeft);
    // console.log("element width", this.element.offsetWidth);
    console.log("calc", Math.abs(newPosTop) + this.element.offsetHeight);

    if (
      Math.abs(newPosTop) + this.element.offsetHeight >
      window.innerHeight + 10
    ) {
      return;
    }

    if (newPosTop > cutOffHeight) {
      return;
    }
  }
}
