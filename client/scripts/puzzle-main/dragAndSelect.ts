import { EVENT_TYPES } from '../constants';
import { BoundingBox, MovableElement, PuzzlePieceSaveData } from '../types';
import Utils from '../utils';
import BaseMovable from './BaseMovable';
import GroupMovable from './GroupMovable';
import Pockets from './Pockets';
import Puzzly from './Puzzly';
import SingleMovable from './SingleMovable';

class DragAndSelect extends BaseMovable {
   Puzzly: Puzzly;
   Pockets: Pockets;
   playBoundary: HTMLDivElement | null;
   piecesContainer: HTMLDivElement | null;
   selectedPiecesContainer: HTMLDivElement | null;
   zoomLevel: number;
   // TODO: This should be an array of SingleMovable instances, not HTML elements.
   selectedPieces: SingleMovable[];
   selectedGroups: GroupMovable[];
   declare lastPosition: {
      top: number;
      left: number;
   };

   isMouseDown: boolean;
   isMouseDownHeld: boolean;
   hasMouseReleased: boolean;
   hasMouseMoved: boolean;
   isRightClick: boolean;
   isInterrogatingMouse: boolean;
   piecesSelected: boolean;
   selectedPiecesAreMoving: boolean;

   mouseHoldDetectionTime: number;
   mouseHoldDetectionMovementTolerance: number;
   mouseHoldStartX: number | null;
   mouseHoldStartY: number | null;

   drawBox: HTMLDivElement;
   drawBoxActive: boolean;
   drawBoxStartX: number | null;
   drawBoxStartY: number | null;
   timer: ReturnType<typeof setTimeout> | null;
   touchStartTime: number;
   touchEndTime: number;
   declare diffX: number;
   declare diffY: number;

   constructor(opts: Puzzly) {
      super(opts);
      this.Puzzly = opts;
      this.puzzleId = opts.puzzleId;
      this.Pockets = opts.Pockets;
      this.playBoundary = opts.playBoundary;
      this.piecesContainer = opts.piecesContainer;
      this.zoomLevel = opts.zoomLevel;
      this.selectedPieces = [];
      this.selectedGroups = [];

      this.isMouseDown = false;
      this.isMouseDownHeld = false;
      this.hasMouseReleased = false;
      this.hasMouseMoved = false;
      this.isRightClick = false;
      this.isInterrogatingMouse = false;
      this.selectedPiecesAreMoving = false;

      this.mouseHoldDetectionTime = 1000;
      this.mouseHoldDetectionMovementTolerance = 5;

      this.drawBox;

      this.timer = null;

      this.touchStartTime;
      this.touchEndTime;

      this.initiateDrawBox();

      window.addEventListener('mousedown', this.onMouseDown.bind(this));

      window.addEventListener('mousemove', this.onMouseMove.bind(this));
      window.addEventListener('mouseup', this.onMouseUp.bind(this));
      window.addEventListener(EVENT_TYPES.CHANGE_SCALE, this.setScale.bind(this));
      window.addEventListener('puzzly_pockets_pieces_added', e => {
         this.toggleDrawCursor();
         this.selectedPieces = [];
         this.selectedPiecesContainer?.remove();
         this.selectedPiecesContainer = null;
         window.dispatchEvent(new CustomEvent(EVENT_TYPES.DRAGANDSELECT_ACTIVE, { detail: false }));
      });
   }

   setScale(eventData: CustomEvent) {
      const value = eventData.detail;
      this.zoomLevel = value;
   }

   isMouseHoldInitiated() {
      this.isInterrogatingMouse = true;
      return new Promise((resolve, reject) => {
         this.timer = setTimeout(() => {
            if (!this.hasMouseMoved && !this.hasMouseReleased) {
               resolve(true);
            } else {
               reject('Mouse-hold conditions not met');
            }
         }, this.mouseHoldDetectionTime);
      });
   }

   isMouseHoldWithinTolerance(event: MouseEvent) {
      if (this.mouseHoldStartX && this.mouseHoldStartY) {
         return (
            Math.abs(this.mouseHoldStartX - event.clientX) <= this.mouseHoldDetectionMovementTolerance ||
            Math.abs(event.clientX - this.mouseHoldStartX) <= this.mouseHoldDetectionMovementTolerance ||
            Math.abs(this.mouseHoldStartY - event.clientY) <= this.mouseHoldDetectionMovementTolerance ||
            Math.abs(event.clientY - this.mouseHoldStartY) <= this.mouseHoldDetectionMovementTolerance
         );
      }
   }

   initiateDrawBox() {
      this.drawBox = document.createElement('div');
      this.drawBox.id = 'drag-box';
      this.drawBox.style.position = 'fixed';
      this.drawBox.style.border = '1px solid #fefefe';
      this.drawBox.style.backgroundColor = '#cecece';
      this.drawBox.style.opacity = 0.3 + '';
      this.drawBox.style.display = 'none';
      document.body.appendChild(this.drawBox);
   }

   activateDrawBox(event: MouseEvent) {
      console.log('activating drawbox');
      this.drawBox.style.display = 'block';
      this.drawBox.style.top = event.clientY + 'px';
      this.drawBox.style.left = event.clientX + 'px';
      this.drawBoxActive = true;
      this.drawBoxStartY = event.clientY;
      this.drawBoxStartX = event.clientX;
   }

   deactivateDrawBox() {
      this.drawBox.style.display = 'none';
      this.drawBox.style.width = 0 + 'px';
      this.drawBox.style.height = 0 + 'px';
      this.drawBoxActive = false;
      this.drawBoxStartY = null;
      this.drawBoxStartX = null;
   }

   updateDrawBox(event: MouseEvent) {
      let top, left, width, height;

      if (this.drawBoxStartX && this.drawBoxStartY) {
         if (event.clientX > this.drawBoxStartX) {
            // Dragging right
            left = this.drawBoxStartX;
            width = event.clientX - this.drawBoxStartX;
         } else {
            // Dragging left
            left = event.clientX;
            width = this.drawBoxStartX - event.clientX;
         }

         if (event.clientY > this.drawBoxStartY) {
            // Dragging down
            top = this.drawBoxStartY;
            height = event.clientY - this.drawBoxStartY;
         } else {
            // Dragging up
            top = event.clientY;
            height = this.drawBoxStartY - event.clientY;
         }

         this.drawBox.style.top = top + 'px';
         this.drawBox.style.left = left + 'px';
         this.drawBox.style.width = width + 'px';
         this.drawBox.style.height = height + 'px';
      }
   }

   toggleDrawCursor() {
      document.body.style.cursor = this.drawBoxActive ? 'crosshair' : 'default';
   }

   setDrawCursor(state: number) {
      document.body.style.cursor = state === 1 ? 'crosshair' : 'default';
   }

   getCollidingPieces(rect: BoundingBox): SingleMovable[] {
      // Utils.drawBox(rect)

      console.log('zoom level', window.Zoom.zoomLevel);

      return window.Puzzly.getSingleInstances().filter((piece: SingleMovable) => {
         // Utils.drawBox(piece.element.getBoundingClientRect(), "red");
         return Utils.hasCollision(piece.element.getBoundingClientRect(), rect);
      });
   }

   getCollidingGroups(rect: BoundingBox): GroupMovable[] {
      const groups: GroupMovable[] = [];

      // Utils.drawBox(rect);

      window.Puzzly.getGroupInstances().forEach((group: GroupMovable) => {
         console.log('checking group for colliding piece', group);
         for (const piece of group.piecesInGroup) {
            const pieceRect = piece.element.getBoundingClientRect();
            Utils.drawBox(pieceRect, 'red');

            if (Utils.hasCollision(pieceRect, rect)) {
               groups.push(group);
               break;
            }
         }
      });

      return groups;
   }

   toggleHighlightPieces(pieces: MovableElement[]) {
      Array.from(pieces).forEach(element => {
         const el = element as MovableElement;
         const currentOpacity = el.style.opacity;
         el.style.opacity = currentOpacity === '1' ? '0.5' : '1';
      });
   }

   toggleHighlightGroups(groups: GroupMovable[]) {
      groups.forEach((group: GroupMovable) => {
         const currentOpacity = group.element.style.opacity;
         group.element.style.opacity = currentOpacity === '1' ? '0.5' : '1';
      });
   }

   getBoundingBoxForDragContainer(pieces: SingleMovable[], groups: GroupMovable[]) {
      let minX = 0,
         minY = 0,
         maxX = 0,
         maxY = 0;

      for (let i = 0, l = pieces.length; i < l; i++) {
         const piece = pieces[i];

         const box = Utils.getStyleBoundingBox(piece.element);

         const left = box.left;
         const top = box.top;
         const right = box.right;
         const bottom = box.bottom;

         if (i === 0) {
            minX = left;
            minY = top;
            maxX = right;
            maxY = bottom;
         } else {
            if (left < minX) {
               minX = left;
            }
            if (top < minY) {
               minY = top;
            }
            if (right > maxX) {
               maxX = right;
            }
            if (bottom > maxY) {
               maxY = bottom;
            }
         }
      }

      for (let i = 0, l = groups.length; i < l; i++) {
         const group = groups[i];
         const groupPosition = Utils.getStyleBoundingBox(group.element);

         group.piecesInGroup.forEach(piece => {
            const piecePositionOnStageY = groupPosition.top + piece.pieceData.positionInPuzzle.y;
            if (minY === 0 || piecePositionOnStageY < minY) {
               minY = piecePositionOnStageY;
            }

            const pieceHeight = piecePositionOnStageY + piece.pieceData.height;
            if (maxY === 0 || pieceHeight > maxY) {
               maxY = pieceHeight;
            }

            const piecePositionOnStageX = groupPosition.left + piece.pieceData.positionInPuzzle.x;
            if (minX === 0 || piecePositionOnStageX < minX) {
               minX = piecePositionOnStageX;
            }

            const pieceWidth = piecePositionOnStageX + piece.pieceData.width;
            if (maxX === 0 || pieceWidth > maxX) {
               maxX = pieceWidth;
            }
         });
      }

      return {
         top: minY,
         right: maxX,
         bottom: maxY,
         left: minX,
         width: maxX - minX,
         height: maxY - minY
      };
   }

   getContainerForMove(pieces: SingleMovable[], selectedGroups: GroupMovable[]) {
      const box = this.getBoundingBoxForDragContainer(pieces, selectedGroups);

      const b = document.createElement('div');
      b.id = 'selected-pieces-container';
      b.style.position = 'absolute';
      b.style.top = box.top + 'px';
      b.style.left = box.left + 'px';
      b.style.width = box.width + 'px';
      b.style.height = box.height + 'px';
      b.style.opacity = '.5';

      pieces.forEach(p => {
         const element = p.element;
         element.style.left = element.offsetLeft - box.left + 'px';
         element.style.top = element.offsetTop - box.top + 'px';
         b.appendChild(element);
      });

      selectedGroups.forEach((group: GroupMovable) => {
         group.element.style.left = group.element.offsetLeft - box.left + 'px';
         group.element.style.top = group.element.offsetTop - box.top + 'px';
         b.appendChild(group.element);
      });

      return b;
   }

   dropPieces(pieces: SingleMovable[]) {
      // Put pieces back in play area
      pieces.forEach(p => {
         p.element.style.left =
            p.element.offsetLeft + parseInt((this.selectedPiecesContainer as HTMLDivElement).style.left) + 'px';
         p.element.style.top =
            p.element.offsetTop + parseInt((this.selectedPiecesContainer as HTMLDivElement).style.top) + 'px';
         (this.piecesContainer as HTMLDivElement).appendChild(p.element);
      });
   }

   dropGroups(groups: GroupMovable[]) {
      // Put pieces back in play area
      groups.forEach((group: GroupMovable) => {
         group.element.style.left =
            parseInt(group.element.style.left) +
            parseInt((this.selectedPiecesContainer as HTMLDivElement).style.left) +
            'px';
         group.element.style.top =
            parseInt(group.element.style.top) +
            parseInt((this.selectedPiecesContainer as HTMLDivElement).style.top) +
            'px';
         (this.piecesContainer as HTMLDivElement).appendChild(group.element);
      });
   }

   onMouseDown(e: MouseEvent) {
      e.preventDefault();

      Utils.removeAllBoundingBoxIndicators();

      this.hasMouseReleased = false;
      this.isMouseDown = true;
      this.isRightClick = e.which === 3;

      this.mouseHoldStartX = e.clientX;
      this.mouseHoldStartY = e.clientY;

      this.touchStartTime = Date.now();

      const tagName = (e.target as HTMLElement).tagName;

      if ((this.selectedPieces.length || this.selectedGroups.length) && tagName !== 'use') {
         // If one or more pieces or groups have been selected and empty space has been clicked,
         // stop the drag
         this.stopDrag();
         return;
      }

      if (tagName !== 'use' && !this.isRightClick && !this.selectedPiecesContainer) {
         this.isMouseHoldInitiated()
            .then(() => {
               this.isMouseDownHeld = true;

               this.activateDrawBox(e);
               this.toggleDrawCursor();

               window.dispatchEvent(new CustomEvent(EVENT_TYPES.DRAGANDSELECT_ACTIVE, { detail: true }));
            })
            .catch(e => {
               this.stopDrag();
            });
      }
   }

   stopDrag() {
      this.isMouseDownHeld = false;

      if (this.selectedPieces.length > 0 || this.selectedGroups.length > 0) {
         this.dropPieces(this.selectedPieces);
         this.dropGroups(this.selectedGroups);
         this.toggleDrawCursor();

         this.selectedPieces = [];
         this.selectedGroups = [];

         this.drawBoxActive = false;
         (this.selectedPiecesContainer as HTMLDivElement).remove();
         this.selectedPiecesContainer = null;

         window.dispatchEvent(new CustomEvent(EVENT_TYPES.CLEAR_BRIDGE, { detail: false }));
      }

      this.dragAndSelectActive = false;

      window.dispatchEvent(new CustomEvent(EVENT_TYPES.DRAGANDSELECT_ACTIVE, { detail: false }));
   }

   onSelectedPiecesContainerMouseDown(event: MouseEvent) {
      if (this.selectedPiecesContainer) {
         this.diffX = event.clientX - parseInt(this.selectedPiecesContainer.style.left) * this.zoomLevel;
         this.diffY = event.clientY - parseInt(this.selectedPiecesContainer.style.top) * this.zoomLevel;

         this.selectedPiecesAreMoving = true;

         this.Puzzly.keepOnTop(this.selectedPiecesContainer);
      }
   }

   onMouseMove(event: MouseEvent) {
      event.preventDefault();

      if (this.isMouseDown && this.isInterrogatingMouse && !this.isMouseHoldWithinTolerance(event)) {
         this.hasMouseMoved = true;
         this.isInterrogatingMouse = false;
      }

      if (this.isMouseDown && this.drawBoxActive) {
         this.updateDrawBox(event);
      }

      if (this.isMouseDown && this.selectedPiecesContainer) {
         const newPosTop = event.clientY / this.zoomLevel - this.diffY / this.zoomLevel;
         const newPosLeft = event.clientX / this.zoomLevel - this.diffX / this.zoomLevel;

         this.selectedPiecesContainer.style.top = newPosTop + 'px';
         this.selectedPiecesContainer.style.left = newPosLeft + 'px';
      }
   }

   onMouseUp(event: MouseEvent) {
      event.preventDefault();

      this.touchEndTime = Date.now();

      this.hasMouseReleased = true;
      this.isMouseDown = false;
      this.isMouseDownHeld = false;
      this.hasMouseMoved = false;
      this.selectedPiecesAreMoving = false;

      this.mouseHoldStartX = null;
      this.mouseHoldStartY = null;

      if (this.timer) {
         clearTimeout(this.timer);
      }

      if (this.drawBoxActive) {
         // Selection box has been drawn
         // const dragBox1 = Utils.getStyleBoundingBox(this.drawBox);
         const dragBox1 = this.drawBox.getBoundingClientRect();

         this.selectedPieces = this.getCollidingPieces(dragBox1);
         this.selectedGroups = this.getCollidingGroups(dragBox1);

         console.log('selected pieces', this.selectedPieces);
         console.log('selected groups', this.selectedGroups);

         if (this.selectedPieces.length === 0 && this.selectedGroups.length === 0) {
            this.endDrag(event);
            return;
         }

         this.selectedPiecesContainer = this.getContainerForMove(this.selectedPieces, this.selectedGroups);

         (this.piecesContainer as HTMLDivElement).appendChild(this.selectedPiecesContainer);

         if (this.selectedPiecesContainer) {
            this.selectedPiecesContainer.addEventListener(
               'mousedown',
               this.onSelectedPiecesContainerMouseDown.bind(this)
            );
         }

         this.dragAndSelectActive = true;

         // Question: Are we using this?
         this.setLastPosition();

         this.toggleDrawCursor();
         this.deactivateDrawBox();

         window.dispatchEvent(
            new CustomEvent(EVENT_TYPES.PIECE_PICKUP, {
               detail: this.selectedPiecesContainer
            })
         );
         window.dispatchEvent(new CustomEvent(EVENT_TYPES.DRAGANDSELECT_ACTIVE, { detail: true }));
      } else if (this.selectedPiecesContainer) {
         // A group of selected pieces has been moved

         if (this.isDragOutOfBounds()) {
            this.reset();
         }

         this.endDrag(event);
      }
   }

   addPiecesToPocket(pocket: HTMLDivElement) {
      for (let i = 0, l = this.selectedPieces.length; i < l; i++) {
         const pieceInstance = this.getMovableInstanceFromElement(this.selectedPieces[i].element);
         this.Pockets.addSingleToPocket(pocket, pieceInstance as SingleMovable);
      }
   }

   endDrag(event: MouseEvent) {
      Utils.removeAllBoundingBoxIndicators();

      this.deactivateDrawBox();
      this.setDrawCursor(0);

      if (this.selectedPieces.length > 0 || this.selectedGroups.length > 0) {
         const eventBox = Utils.getEventBox(event);
         const pocket = Utils.getPocketByCollision(eventBox);
         if (pocket) {
            this.addPiecesToPocket(pocket);
         } else {
            this.dropPieces(this.selectedPieces);
            this.dropGroups(this.selectedGroups);

            const pieces = Array.from(this.selectedPieces).map((piece: SingleMovable) => {
               return this.getMovableInstanceFromElement(piece.element);
            });

            const pieceDataForSave: PuzzlePieceSaveData[] = [];

            pieces.forEach((piece: SingleMovable) => {
               pieceDataForSave.push(piece.getDataForSave());
               this.setLastPosition();
            });

            if (pieces) {
               fetch('/api/puzzle/updatePieces', {
                  method: 'PUT',
                  headers: {
                     'Content-Type': 'Application/json'
                  },
                  body: JSON.stringify({
                     pieces: pieceDataForSave,
                     puzzleId: this.puzzleId
                  })
               })
                  .then(res => res.json())
                  .then(response => {
                     // console.log('/api/puzzle/createPieces response', response);
                  });
            }

            if (this.selectedGroups.length) {
               this.selectedGroups.forEach(group => {
                  window.Puzzly.PersistenceOperations.saveGroup(group.getDataForSave());
               });
            }
         }

         this.dragAndSelectActive = false;
         this.save();
      }

      window.dispatchEvent(new CustomEvent(EVENT_TYPES.DRAGANDSELECT_ACTIVE, { detail: false }));
      window.dispatchEvent(new CustomEvent(EVENT_TYPES.CLEAR_BRIDGE));

      this.selectedPiecesContainer?.remove();
      this.selectedPiecesContainer = null;

      this.selectedPieces = [];
      this.selectedGroups = [];

      this.drawBoxActive = false;
   }

   isDragOutOfBounds() {
      const selectedPiecesRect = (this.selectedPiecesContainer as HTMLDivElement).getBoundingClientRect();
      const playBoundaryRect = (this.playBoundary as HTMLDivElement).getBoundingClientRect();

      return !Utils.isInside(selectedPiecesRect, playBoundaryRect);
   }

   setLastPosition() {
      if (this.selectedPiecesContainer) {
         this.lastPosition = {
            top: this.selectedPiecesContainer.offsetTop,
            left: this.selectedPiecesContainer.offsetLeft
         };
      }
   }

   reset() {
      const container = this.selectedPiecesContainer as HTMLDivElement;
      container.style.left = this.lastPosition.left + 'px';
      container.style.top = this.lastPosition.top + 'px';
   }

   save() {
      // TODO: Still would prefer to handle saving in a cleaner way
      const data = this.selectedPieces.map(piece => piece.getDataForSave());
      window.dispatchEvent(new CustomEvent(EVENT_TYPES.SAVE, { detail: data }));
   }
}

export default DragAndSelect;
