import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  HemisphereLight,
  DirectionalLight,
  Vector3,
  Group,
  sRGBEncoding,
} from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";

const renderer = new WebGLRenderer({alpha: true});

renderer.outputEncoding = sRGBEncoding;
renderer.setPixelRatio(window.devicePixelRatio);

interface Options {
  size: {width: number; height: number};
  camera?: {
    fov?: number;
    x?: number;
    y?: number;
    z?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
  };
}
const defaultValues: Options = {
  size: {width: 200, height: 200},
};
export function renderGLTFPreview(
  assetPath: string,
  {size, camera: cameraOptions}: Options = defaultValues,
): Promise<string> {
  return new Promise(resolve => {
    renderer.setSize(size.width, size.height);

    const scene = new Scene();
    // scene.background = new Color(0x666666);
    const camera = new PerspectiveCamera(
      cameraOptions?.fov ?? 45,
      size.width / size.height,
      0.1,
      1000,
    );

    camera.position.x = cameraOptions?.x ?? 0;
    camera.position.y = cameraOptions?.y ?? 0;
    camera.position.z = cameraOptions?.z ?? 3;
    camera.lookAt(new Vector3(0, 0, 0));

    camera.rotateX(cameraOptions?.rotateX ?? 0);
    camera.rotateY(cameraOptions?.rotateY ?? 0);
    camera.rotateZ(cameraOptions?.rotateZ ?? 0);
    const hemiLight = new HemisphereLight(0xffffff, 0xffffff, 0.6);
    hemiLight.position.set(0, 500, 0);
    scene.add(hemiLight);

    const dirLight = new DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(-1, 0.75, 1);
    dirLight.name = "dirlight";
    // scene.add(dirLight);

    const objectGroup = new Group();

    scene.add(objectGroup);

    const loader = new GLTFLoader();
    loader.load(assetPath, gltf => {
      const obj = gltf.scene;
      scene.add(obj);
      renderer.render(scene, camera);
      resolve(renderer.domElement.toDataURL("image/png"));
    });
  });
}

const cache = {};

// function useGLTFPreview(assetPath) {
//   if (cache[assetPath] && cache[assetPath].then) throw cache[assetPath];
//   if (!cache[assetPath]) {
//     const promise = renderGLTFPreview(assetPath).then(
//       res => (cache[assetPath] = res)
//     );
//     cache[assetPath] = promise;
//     throw promise;
//   }

//   return cache[assetPath];
// }
// function Preview() {
//   const assetPath =
//     "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf";
//   const src = useGLTFPreview(assetPath);
//   return <img src={src} alt="Hello" />;
// }
// export default function App() {
//   return (
//     <div className="App">
//       <React.Suspense fallback={"Loading"}>
//         <h1>Howdy!</h1>
//         <Preview />
//       </React.Suspense>
//     </div>
//   );
// }
