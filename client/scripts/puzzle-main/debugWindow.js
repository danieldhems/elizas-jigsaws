debugWindowAddRow(label, readoutElementId){
  const row = document.createElement('div');
  row.classList.add('debug-info-row');
  row.classList.add('group');
  const rowLabelEl = document.createElement('div');
  rowLabelEl.classList.add('label');
  const rowLabelText = label + ':';
  rowLabelEl.innerText = rowLabelText;
  const rowReadoutEl = document.createElement('div');
  rowReadoutEl.classList.add('readout');
  const readoutId = `debug-readout--${readoutElementId}`;
  rowReadoutEl.setAttribute('id', readoutId);
  row.appendChild(rowLabelEl)
  row.appendChild(rowReadoutEl)
  this.debugInfoRows[readoutElementId] = rowReadoutEl;
  this.debugInfoWindow.appendChild(row)
}

debugInfoSetReadout(el, content){
  if(this.config.showDebugInfo){
    el.innerHTML = content;
  }
}

debugInfoClearReadout(id){
  this.debugInfoRows[id].innerHTML = '';
}

debugWindowInitialise(){
  this.debugInfoRows = [];
  this.debugWindowAddRow('Dragged element', 'draggedEl');
  this.debugWindowAddRow('Dragged element container', 'draggedElContainer');
  this.debugWindowAddRow('Dragged element top container', 'draggedElTopContainer');
  this.debugWindowAddRow('Target element', 'targetEl');
  this.debugWindowAddRow('Target element container', 'targetElContainer');
  this.debugWindowAddRow('Target element top container', 'targetElTopContainer');
  this.debugWindowAddRow('Last connection', 'lastConnection');
  this.config.debugInfoRows = this.debugInfoRows;
}