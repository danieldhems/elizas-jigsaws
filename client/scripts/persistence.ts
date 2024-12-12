import { EVENT_TYPES } from "./constants";
import GroupMovable from "./GroupMovable";
import Puzzly from "./Puzzly";
import SingleMovable from "./SingleMovable";
import {
  GroupData,
  GroupMovableSaveState,
  InstanceTypes,
  JigsawPieceData,
  LocalStorageKeys,
  SavedProgress,
  SaveOptions,
  SaveStates,
  SingleMovableSaveState,
} from "./types";

const PIECES_ENDPOINT = "/api/pieces";
const GROUPS_ENDPOINT = "/api/groups";

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

  saveToLocalStorage(data: SingleMovableSaveState | SingleMovableSaveState[] | GroupMovableSaveState) {
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

  async saveSinglePiece(piece: SingleMovableSaveState, options: SaveOptions) {
    console.log("saveSinglePiece", piece);

    const useLocalStorage = false;

    const requestMethod = piece._id ? "PUT" : "POST";

    const data: {
      payload?: SingleMovableSaveState,
      options?: {}
    } = {};
    data.payload = piece;
    data.options = options;

    if (useLocalStorage) {
      this.saveToLocalStorage(piece as SingleMovableSaveState);
    } else {
      // const isFirstSave = !payload[0]?._id;
      return fetch(PIECES_ENDPOINT, {
        method: requestMethod,
        headers: {
          "Content-Type": "Application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((response) => {
          if (Array.isArray(response.pieces)) {
            response.pieces.forEach((piece: any) => {
              window.dispatchEvent(
                new CustomEvent(EVENT_TYPES.PIECE_UPDATED, { detail: piece })
              );
            })
          }
          window.dispatchEvent(
            new CustomEvent(EVENT_TYPES.SAVE_SUCCESSFUL, { detail: response })
          );
        })
        .catch((error) => {
          console.error(error);
          this.saveToLocalStorage(data.payload as SingleMovableSaveState);
        });
    }
  }

  async saveMultiplePieces(pieces: SingleMovableSaveState[], options?: SaveOptions) {
    console.log('saveMultiplePieces', pieces)
    const useLocalStorage = false;

    const requestMethod = pieces[0]._id ? "PUT" : "POST";

    const data: {
      payload?: SingleMovableSaveState[],
      options?: {}
    } = {};
    data.payload = pieces;
    data.options = options;

    if (useLocalStorage) {
      this.saveToLocalStorage(pieces);
    } else {
      // const isFirstSave = !payload[0]?._id;
      return fetch(PIECES_ENDPOINT, {
        method: requestMethod,
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

    const requestMethod = groupData.id ? "PUT" : "POST";

    const data: {
      payload?: GroupMovableSaveState,
      options?: {}
    } = {};

    data.payload = groupData;
    data.options = options;

    if (useLocalStorage) {
      this.saveToLocalStorage(data.payload as GroupMovableSaveState);
    } else {
      return fetch(GROUPS_ENDPOINT, {
        method: 'PUT',
        headers: {
          "Content-Type": "Application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((response) => {
          if (Array.isArray(response.pieces)) {
            response.pieces.forEach((piece: any) => {
              window.dispatchEvent(
                new CustomEvent(EVENT_TYPES.PIECE_UPDATED, { detail: piece })
              );
            })
          }
          window.dispatchEvent(
            new CustomEvent(EVENT_TYPES.SAVE_SUCCESSFUL, { detail: response })
          );

          return response;
        })
        .catch((error) => {
          console.error(error);
          this.saveToLocalStorage(data.payload as GroupMovableSaveState);
        })
    }
  }

  async deleteGroup(group: GroupMovable) {
    return fetch(GROUPS_ENDPOINT, {
      method: 'DELETE',
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify({ id: group._id }),
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
