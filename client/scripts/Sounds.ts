import { EVENT_TYPES } from "./constants";

export default class Sounds {
  soundsBtn: HTMLElement | null;
  soundsBtnOnLabel: HTMLSpanElement | null;
  soundsBtnOffLabel: HTMLSpanElement | null;
  soundsEnabled: boolean;
  pieceConnectionSound: HTMLAudioElement;

  constructor() {
    this.soundsBtn = document.getElementById("sound-toggle");
    this.soundsBtnOnLabel = document.getElementById("sounds-on");
    this.soundsBtnOffLabel = document.getElementById("sounds-off");

    if (this.soundsBtnOnLabel) {
      this.soundsBtnOnLabel.style.display = "none";
    }

    this.pieceConnectionSound = new Audio(
      "./assets/mixkit-plastic-bubble-click-1124.wav"
    );

    this.soundsEnabled = true;
  }

  attachEvents() {
    if (this.soundsBtn) {
      this.soundsBtn.addEventListener(
        "mousedown",
        this.toggleSounds.bind(this)
      );
    }

    window.addEventListener(
      EVENT_TYPES.CONNECTION_MADE,
      this.playPieceConnectionSound.bind(this)
    );
  }

  toggleSounds() {
    this.soundsEnabled = this.soundsEnabled ? false : true;
    (this.soundsBtnOffLabel as HTMLSpanElement).style.display = this
      .soundsEnabled
      ? "block"
      : "none";
    (this.soundsBtnOnLabel as HTMLSpanElement).style.display = this
      .soundsEnabled
      ? "none"
      : "block";
  }

  playPieceConnectionSound() {
    if (this.soundsEnabled) {
      this.pieceConnectionSound.play();
    }
  }
}
