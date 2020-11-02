import {Frustum, PerspectiveCamera, Vector3} from "three";

var frustum = new Frustum();

var tmpPoint = new Vector3();

var vecNear = new Vector3();
var vecTopLeft = new Vector3();
var vecTopRight = new Vector3();
var vecDownRight = new Vector3();
var vecDownLeft = new Vector3();

var vectemp1 = new Vector3();
var vectemp2 = new Vector3();
var vectemp3 = new Vector3();

const tempVec = new Vector3();
export function getSelectedObjects(
  objects: {
    id: string;
    position: {
      x: number;
      y: number;
      z: number;
    };
  }[],
  camera: PerspectiveCamera,
  startPoint: Vector3,
  endPoint: Vector3
) {
  // Avoid invalid frustum
  const deep = Number.MAX_VALUE;

  if (startPoint.x === endPoint.x) {
    endPoint.x += Number.EPSILON;
  }

  if (startPoint.y === endPoint.y) {
    endPoint.y += Number.EPSILON;
  }

  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();

  tmpPoint.copy(startPoint);
  tmpPoint.x = Math.min(startPoint.x, endPoint.x);
  tmpPoint.y = Math.max(startPoint.y, endPoint.y);
  endPoint.x = Math.max(startPoint.x, endPoint.x);
  endPoint.y = Math.min(startPoint.y, endPoint.y);

  vecNear.setFromMatrixPosition(camera.matrixWorld);
  vecTopLeft.copy(tmpPoint);
  vecTopRight.set(endPoint.x, tmpPoint.y, 0);
  vecDownRight.copy(endPoint);
  vecDownLeft.set(tmpPoint.x, endPoint.y, 0);

  vecTopLeft.unproject(camera);
  vecTopRight.unproject(camera);
  vecDownRight.unproject(camera);
  vecDownLeft.unproject(camera);

  vectemp1.copy(vecTopLeft).sub(vecNear);
  vectemp2.copy(vecTopRight).sub(vecNear);
  vectemp3.copy(vecDownRight).sub(vecNear);
  vectemp1.normalize();
  vectemp2.normalize();
  vectemp3.normalize();

  vectemp1.multiplyScalar(deep);
  vectemp2.multiplyScalar(deep);
  vectemp3.multiplyScalar(deep);
  vectemp1.add(vecNear);
  vectemp2.add(vecNear);
  vectemp3.add(vecNear);

  var planes = frustum.planes;

  planes[0].setFromCoplanarPoints(vecNear, vecTopLeft, vecTopRight);
  planes[1].setFromCoplanarPoints(vecNear, vecTopRight, vecDownRight);
  planes[2].setFromCoplanarPoints(vecDownRight, vecDownLeft, vecNear);
  planes[3].setFromCoplanarPoints(vecDownLeft, vecTopLeft, vecNear);
  planes[4].setFromCoplanarPoints(vecTopRight, vecDownRight, vecDownLeft);
  planes[5].setFromCoplanarPoints(vectemp3, vectemp2, vectemp1);
  planes[5].normal.multiplyScalar(-1);

  const collection: string[] = [];

  // TODO: Once we get a 'Flatten Y diimension" button in place, update this.
  objects.forEach(object => {
    tempVec.set(object.position.x, 0, object.position.z);
    if (frustum.containsPoint(tempVec)) {
      collection.push(object.id);
    }
  });
  return collection;
}
