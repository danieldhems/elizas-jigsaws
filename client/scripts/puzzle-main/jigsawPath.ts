import { CONNECTOR_DIVISOR_FOR_CONTROL_POINT_HANDLE, CONNECTOR_MULTIPLIER_FOR_HUMP_SIZE } from "../constants";
import { ConnectorControlPoints } from "../types";

export default class JigsawPath {
  pieceSize: number;
  connectorSize: number;
  humpSize: number;
  halfConnectorSize: number;

  constructor(pieceSize: number, connectorSize: number) {
    this.pieceSize = pieceSize;
    this.connectorSize = connectorSize;
    this.humpSize = parseInt((this.connectorSize * CONNECTOR_MULTIPLIER_FOR_HUMP_SIZE).toFixed());
    this.halfConnectorSize = parseInt((this.connectorSize / CONNECTOR_DIVISOR_FOR_CONTROL_POINT_HANDLE).toFixed());

    // console.log("connectorSize", this.connectorSize);
    // console.log("humpSize", this.humpSize);
    // console.log("halfConnectorSize", this.halfConnectorSize);

    this.getPlug = this.getPlug.bind(this);
    this.getSocket = this.getSocket.bind(this);
    this.rotate = this.rotate.bind(this);
    this.getRotatedConnector = this.getRotatedConnector.bind(this);
  }

  getPlug() {
    // Assume 'top' is the default plug,
    // and all others are taken from the rotation of this one
    return {
      cp1: {
        x: 0 - this.halfConnectorSize,
        y: 0 - this.humpSize,
      },
      cp2: {
        x: this.connectorSize + this.halfConnectorSize,
        y: 0 - this.humpSize,
      },
      dest: {
        x: this.connectorSize,
        y: 0,
      },
    };
  }

  getSocket() {
    // Assume 'top' is the default socket,
    // and all others are taken from the rotation of this one
    return {
      cp1: {
        x: 0 - this.halfConnectorSize,
        y: this.humpSize,
      },
      cp2: {
        x: this.connectorSize + this.halfConnectorSize,
        y: this.humpSize,
      },
      dest: {
        x: this.connectorSize,
        y: 0,
      },
    };
  }

  rotate(point: { x: number; y: number }, deg: number) {
    if (deg < 0 || deg > 359) throw new Error("Invalid degree value provided");

    const rad = (deg * Math.PI) / 180;

    const origin = { x: 0, y: 0 };
    const { x: px, y: py } = point;

    const qx =
      origin.x +
      Math.cos(rad) * (px - origin.x) -
      Math.sin(rad) * (py - origin.y);
    const qy =
      origin.y +
      Math.sin(rad) * (px - origin.x) +
      Math.cos(rad) * (py - origin.y);

    return {
      x: qx,
      y: qy,
    };
  }

  getRotatedConnector(connector: ConnectorControlPoints, deg: number) {
    const rotatedCp1 = this.rotate(connector.cp1, deg);
    const rotatedCp2 = this.rotate(connector.cp2, deg);
    const rotatedDest = this.rotate(connector.dest, deg);
    return {
      cp1: rotatedCp1,
      cp2: rotatedCp2,
      dest: rotatedDest,
    };
  }

  drawConnectorGuides(
    ctx: CanvasRenderingContext2D,
    connector: ConnectorControlPoints
  ) {
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(connector.cp1.x, connector.cp1.y, 2, 0, 2 * Math.PI); // Control point one
    ctx.fill();

    // ctx.fillStyle = 'brown';
    ctx.beginPath();
    ctx.arc(connector.cp2.x, connector.cp2.y, 2, 0, 2 * Math.PI); // Control point one
    ctx.fill();

    ctx.beginPath();
    ctx.arc(connector.dest.x, connector.dest.y, 2, 0, 2 * Math.PI); // Control point one
    ctx.fill();
  }
}
