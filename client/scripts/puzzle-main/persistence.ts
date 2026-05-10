import { EVENT_TYPES } from "../constants";
import Puzzly from "./Puzzly";
import {
  GroupMovableSaveState,
  PuzzlePiece,
  LocalStorageKeys,
  SavedProgress,
  SaveOptions,
  PuzzlePieceSaveData,
} from "../types";

const UPDATE_PIECE_ENDPOINT = "/api/puzzle/updatePiece";
const UPDATE_PIECES_ENDPOINT = "/api/puzzle/updatePieces";
const UPDATE_GROUP_ENDPOINT = "/api/puzzle/updateGroup";
const DELETE_GROUP_ENDPOINT = "/api/puzzle/deleteGroup";

export default class PersistenceOperations {
  puzzleId;
  localStorageStringReplaceKey = "{}";

  LOCAL_STORAGE_PUZZLY_PROGRESS_KEY: string;
  LOCAL_STORAGE_PUZZLY_LAST_SAVE_KEY: string;

  saveQueue = [];
  pendingRequests = [];

  pollingInterval = 2000;
  currentTime = Date.now();

  constructor({ puzzleId }: { puzzleId: Puzzly["puzzleId"] }) {
    this.puzzleId = puzzleId;

    this.LOCAL_STORAGE_PUZZLY_PROGRESS_KEY = `Puzzly_ID${this.localStorageStringReplaceKey}_progress`;
    this.LOCAL_STORAGE_PUZZLY_LAST_SAVE_KEY = `Puzzly_ID${this.localStorageStringReplaceKey}_lastSave`;
  }

  getPersistence(
    puzzleData: any
  ) {
    const progressKey = this.getUniqueLocalStorageKeyForPuzzle(
      LocalStorageKeys.Progress
    );
    const lastSaveKey = this.getUniqueLocalStorageKeyForPuzzle(
      LocalStorageKeys.LastSave
    );
    const hasLocalStorageSupport = window.localStorage;
    const progressInLocalStorage =
      hasLocalStorageSupport && localStorage.getItem(progressKey);
    const lastSaveInLocalStorage =
      hasLocalStorageSupport && localStorage.getItem(lastSaveKey);

    let availableStorage;
    const storage = {
      pieces: [],
      groups: [],
      latestSave: 0,
    } as SavedProgress;

    if (!puzzleData.lastSaveDate && !lastSaveInLocalStorage) {
      console.info("Puzzly: No saved data found");
      return;
    }

    if (puzzleData.pieces?.length) {
      if (
        lastSaveInLocalStorage &&
        parseInt(lastSaveInLocalStorage) > puzzleData.lastSaveTimeFromServer
      ) {
        availableStorage = "local";
      } else {
        availableStorage = "server";
      }
    } else if (lastSaveInLocalStorage && progressInLocalStorage?.length) {
      availableStorage = "local";
    }

    switch (availableStorage) {
      case "server":
        console.info(`[Puzzly] Restoring from server-side storage`);
        storage.pieces = puzzleData.pieces;
        if (puzzleData.groups) {
          storage.groups = puzzleData.groups;
        }
        storage.latestSave = puzzleData.lastSaveDate;
        break;
      case "local":
        if (progressInLocalStorage && lastSaveInLocalStorage) {
          console.info(`[Puzzly] Restoring from local storage`);
          storage.pieces = JSON.parse(progressInLocalStorage);
          if (puzzleData.groups) {
            storage.groups = puzzleData.groups;
          }
          storage.latestSave = parseInt(lastSaveInLocalStorage);
        }
        break;
    }

    return storage;
  }

  getUniqueLocalStorageKeyForPuzzle(key: LocalStorageKeys) {
    return this[key].replace(this.localStorageStringReplaceKey, this.puzzleId);
  }

  saveToLocalStorage(data: PuzzlePieceSaveData | PuzzlePieceSaveData[] | GroupMovableSaveState) {
    let time = Date.now();

    const progressKey = this.getUniqueLocalStorageKeyForPuzzle(
      LocalStorageKeys.Progress
    );
    const lastSaveKey = this.getUniqueLocalStorageKeyForPuzzle(
      LocalStorageKeys.LastSave
    );

    console.info(`[Puzzly] Saving to local storage, key ${progressKey}:`, data);
    localStorage.setItem(progressKey, JSON.stringify(data));
    console.info(`[Puzzly] Saving to local storage, key ${lastSaveKey}:`, time);
    localStorage.setItem(lastSaveKey, time.toString());
  }

  async saveInnerPieceVisibility(visible: boolean) {
    fetch(`/api/toggleVisibility/${this.puzzleId}`, {
      method: "put",
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify({ piecesVisible: visible }),
    });
  }

  isIntegration() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("integration") === "true";
  }

  async saveSinglePiece(pieceSaveData: PuzzlePieceSaveData, options: SaveOptions) {
    // console.log("saveSinglePiece", piece);

    const useLocalStorage = false;

    if (useLocalStorage) {
      this.saveToLocalStorage(pieceSaveData);
    } else {
      // const isFirstSave = !payload[0]?._id;
      return fetch(UPDATE_PIECE_ENDPOINT, {
        method: 'PUT',
        headers: {
          "Content-Type": "Application/json",
        },
        body: JSON.stringify(pieceSaveData),
      })
        .then((response) => response.json())
        .then((response) => {
          window.dispatchEvent(
            new CustomEvent(EVENT_TYPES.SAVE_SUCCESSFUL, { detail: response })
          );
        })
        .catch((error) => {
          console.error(error);
          this.saveToLocalStorage(pieceSaveData);
        });
    }
  }

  async saveMultiplePieces(pieces: PuzzlePieceSaveData[], options?: SaveOptions) {
    // console.log('saveMultiplePieces', pieces)
    const useLocalStorage = false;

    const data: {
      payload?: {
        puzzleId: string;
        pieces: PuzzlePieceSaveData[],
      };
      options?: {}
    } = {};

    data.payload = {
      puzzleId: window.Puzzly._id,
      pieces
    };

    data.options = options;

    if (useLocalStorage) {
      this.saveToLocalStorage(pieces);
    } else {
      return fetch(UPDATE_PIECES_ENDPOINT, {
        method: 'PUT',
        headers: {
          "Content-Type": "Application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((response) => {
          console.log('response', response)
          response.data.pieces.forEach((piece: any) => {
            window.dispatchEvent(
              new CustomEvent(EVENT_TYPES.PIECE_UPDATED, { detail: piece })
            );
          })
          window.dispatchEvent(
            new CustomEvent(EVENT_TYPES.SAVE_SUCCESSFUL, { detail: response.data })
          );
        })
        .catch((error) => {
          console.error(error);
          this.saveToLocalStorage(pieces);
        });
    }
  }

  async saveGroup(groupData: GroupMovableSaveState, options: SaveOptions) {
    // console.log("saveGroup", groupData);

    const useLocalStorage = false;

    const data: {
      group: GroupMovableSaveState,
      options?: {}
    } = {
      group: groupData,
      options,
    };

    if (useLocalStorage) {
      this.saveToLocalStorage(data.group as GroupMovableSaveState);
    } else {
      return fetch(UPDATE_GROUP_ENDPOINT, {
        method: 'PUT',
        headers: {
          "Content-Type": "Application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((response) => {
          // TODO: Do we still need this?
          // if (Array.isArray(response.pieces)) {
          //   response.pieces.forEach((piece: any) => {
          //     window.dispatchEvent(
          //       new CustomEvent(EVENT_TYPES.PIECE_UPDATED, { detail: piece })
          //     );
          //   })
          // }
          window.dispatchEvent(
            new CustomEvent(EVENT_TYPES.SAVE_SUCCESSFUL, { detail: response })
          );

          return response;
        })
        .catch((error) => {
          console.error(error);
          this.saveToLocalStorage(data.group as GroupMovableSaveState);
        })
    }
  }

  async deleteGroup(groupId: string, puzzleId: string) {
    return fetch(DELETE_GROUP_ENDPOINT, {
      method: 'DELETE',
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify({ groupId, puzzleId }),
    })
      .then((response) => response.json())
      .then((response) => {
        return response;
      })
      .catch((error) => {
        console.error(error);
      })
  }
}
