/* eslint-disable @typescript-eslint/no-this-alias */
// @ts-nocheck
import {dirname, sep} from "node:path";
import {Buffer} from "node:buffer";
import {
  AnimationClip,
  Bone,
  Box3,
  BufferAttribute,
  BufferGeometry,
  type 
  Camera,
  ClampToEdgeWrapping,
  Color,
  DirectionalLight,
  DoubleSide,
  FrontSide,
  Group,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  Interpolant,
  InterpolateDiscrete,
  InterpolateLinear,
  Line,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  Loader,
  LoaderUtils,
  type 
  LoadingManager,
  Material,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  MirroredRepeatWrapping,
  NearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  NumberKeyframeTrack,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  PropertyBinding,
  Quaternion,
  QuaternionKeyframeTrack,
  RepeatWrapping,
  Skeleton,
  SkinnedMesh,
  Sphere,
  SpotLight,
  TangentSpaceNormalMap,
  Texture,
  TriangleFanDrawMode,
  TriangleStripDrawMode,
  Vector2,
  Vector3,
  VectorKeyframeTrack,
  sRGBEncoding,
} from "three";
import type {DRACOLoader} from "./DRACOLoader";
import {FileLoader} from "./FileLoader";

type ExcludeFunctionProps<T> = Omit<
  T,
  {[K in keyof T]-?: T[K] extends Function ? K : never}[keyof T]
>;

export interface GLTF {
  animations: AnimationClip[];
  scene: Group;
  scenes: Group[];
  cameras: Camera[];
  asset: {
    copyright?: string;
    generator?: string;
    version?: string;
    minVersion?: string;
    extensions?: any;
    extras?: any;
  };
  parser: GLTFParser;
  userData: any;
}

export interface GLTFLoaderPlugin {
  beforeRoot?: (() => Promise<void> | null) | undefined;
  afterRoot?: ((result: GLTF) => Promise<void> | null) | undefined;
  loadMesh?:
    | ((meshIndex: number) => Promise<Group | Mesh | SkinnedMesh> | null)
    | undefined;
  loadBufferView?:
    | ((bufferViewIndex: number) => Promise<ArrayBuffer> | null)
    | undefined;
  loadMaterial?:
    | ((materialIndex: number) => Promise<Material> | null)
    | undefined;
  loadTexture?: ((textureIndex: number) => Promise<Texture> | null) | undefined;
  getMaterialType?:
    | ((materialIndex: number) => typeof Material | null)
    | undefined;
  extendMaterialParams?:
    | ((
        materialIndex: number,
        materialParams: {[key: string]: any}
      ) => Promise<any> | null)
    | undefined;
  createNodeMesh?:
    | ((nodeIndex: number) => Promise<Group | Mesh | SkinnedMesh> | null)
    | undefined;
  createNodeAttachment?:
    | ((nodeIndex: number) => Promise<Object3D> | null)
    | undefined;
}

export class GLTFLoader extends Loader {
  dracoLoader: DRACOLoader = null;
  ktx2Loader = null;
  meshoptDecoder = null;

  pluginCallbacks = [];

  constructor(manager?: LoadingManager) {
    super(manager);

    this.register(parser => {
      return new GLTFMaterialsClearcoatExtension(parser);
    });

    this.register(parser => {
      return new GLTFTextureBasisUExtension(parser);
    });

    this.register(parser => {
      return new GLTFTextureWebPExtension(parser);
    });

    this.register(parser => {
      return new GLTFMaterialsSheenExtension(parser);
    });

    this.register(parser => {
      return new GLTFMaterialsTransmissionExtension(parser);
    });

    this.register(parser => {
      return new GLTFMaterialsVolumeExtension(parser);
    });

    this.register(parser => {
      return new GLTFMaterialsIorExtension(parser);
    });

    this.register(parser => {
      return new GLTFMaterialsSpecularExtension(parser);
    });

    this.register(parser => {
      return new GLTFLightsExtension(parser);
    });

    this.register(parser => {
      return new GLTFMeshoptCompression(parser);
    });
  }

  load(
    url: string,
    onLoad: (gltf: GLTF) => void,
    onProgress?: () => void,
    onError?: (err: Error) => void
  ) {

    let resourcePath;

    if (this.resourcePath !== "") {
      resourcePath = this.resourcePath;
    } else if (this.path !== "") {
      resourcePath = this.path;
    } else {
      if (!/^https?:\/\//.test(url) && !/^data:/.test(url)) {
        resourcePath = dirname(url) + sep;
      } else {
        resourcePath = LoaderUtils.extractUrlBase(url);
      }
    }

    // Tells the LoadingManager to track an extra item, which resolves after
    // the model is fully loaded. This means the count of items loaded will
    // be incorrect, but ensures manager.onLoad() does not fire early.
    this.manager.itemStart(url);
    const _onError = e => {
      if (onError) {
        onError(e);
      } else {
        console.error(e);
      }

      this.manager.itemError(url);
      this.manager.itemEnd(url);
    };

    const loader = new FileLoader(this.manager);

    loader.setPath(this.path);
    loader.setResponseType("arraybuffer");
    loader.setRequestHeader(this.requestHeader);
    loader.setWithCredentials(this.withCredentials);

    loader.load(
      url,
      data => {
        try {
          this.parse(
            data,
            resourcePath,
            gltf => {
              onLoad(gltf);

              this.manager.itemEnd(url);
            },
            _onError
          );
        } catch (e) {
          _onError(e);
        }
      },
      onProgress,
      _onError
    );
  }

  setDRACOLoader(dracoLoader: DRACOLoader): GLTFLoader {
    this.dracoLoader = dracoLoader;
    return this;
  }

  setDDSLoader() {
    throw new Error(
      'THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".'
    );
  }

  // setKTX2Loader( ktx2Loader: KTX2Loader ): GLTFLoader {
  //
  // 	this.ktx2Loader = ktx2Loader;
  // 	return this;
  //
  // }

  setMeshoptDecoder(meshoptDecoder): GLTFLoader {
    this.meshoptDecoder = meshoptDecoder;
    return this;
  }

  register(callback: (parser: GLTFParser) => GLTFLoaderPlugin): GLTFLoader {
    if (this.pluginCallbacks.indexOf(callback) === -1) {
      this.pluginCallbacks.push(callback);
    }

    return this;
  }

  unregister(callback: (parser: GLTFParser) => GLTFLoaderPlugin): GLTFLoader {
    if (this.pluginCallbacks.indexOf(callback) !== -1) {
      this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(callback), 1);
    }

    return this;
  }

  parse(
    data: Buffer | ArrayBuffer | string,
    path: string,
    onLoad: (gltf: GLTF) => void,
    onError?: (err: Error) => void
  ) {
    let content;
    const extensions = {};
    const plugins = {};

    if (typeof data === "string") {
      content = data;
    } else {
      if (data instanceof Buffer) {
        data = data.buffer;
      }

      const magic = LoaderUtils.decodeText(new Uint8Array(data.slice(0, 4)));

      if (magic === BINARY_EXTENSION_HEADER_MAGIC) {
        try {
          // @ts-ignore
          extensions[EXTENSIONS.KHR_BINARY_GLTF] = new GLTFBinaryExtension(
            data
          );
        } catch (error) {
          if (onError) onError(error);
          return;
        }

        content = extensions[EXTENSIONS.KHR_BINARY_GLTF].content;
      } else {
        content = LoaderUtils.decodeText(new Uint8Array(data));
      }
    }

    const json = JSON.parse(content);

    if (json.asset === undefined || json.asset.version[0] < 2) {
      if (onError) {
        // @ts-ignore
        onError(
          new Error(
            "THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."
          )
        );
      }
      return;
    }

    const parser = new GLTFParser(json, {
      path: path || this.resourcePath || "",
      crossOrigin: this.crossOrigin,
      requestHeader: this.requestHeader,
      manager: this.manager,
      ktx2Loader: this.ktx2Loader,
      meshoptDecoder: this.meshoptDecoder,
    });

    parser.fileLoader.setRequestHeader(this.requestHeader);

    for (let i = 0; i < this.pluginCallbacks.length; i++) {
      const plugin = this.pluginCallbacks[i](parser);
      plugins[plugin.name] = plugin;

      // Workaround to avoid determining as unknown extension
      // in addUnknownExtensionsToUserData().
      // Remove this workaround if we move all the existing
      // extension handlers to plugin system
      extensions[plugin.name] = true;
    }

    if (json.extensionsUsed) {
      for (let i = 0; i < json.extensionsUsed.length; ++i) {
        const extensionName = json.extensionsUsed[i];
        const extensionsRequired = json.extensionsRequired || [];

        switch (extensionName) {
          case EXTENSIONS.KHR_MATERIALS_UNLIT:
            extensions[extensionName] = new GLTFMaterialsUnlitExtension();
            break;

          case EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS:
            extensions[extensionName] =
              new GLTFMaterialsPbrSpecularGlossinessExtension();
            break;

          case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
            extensions[extensionName] = new GLTFDracoMeshCompressionExtension(
              json,
              this.dracoLoader
            );
            break;

          case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
            extensions[extensionName] = new GLTFTextureTransformExtension();
            break;

          case EXTENSIONS.KHR_MESH_QUANTIZATION:
            extensions[extensionName] = new GLTFMeshQuantizationExtension();
            break;

          default:
            if (
              extensionsRequired.indexOf(extensionName) >= 0 &&
              plugins[extensionName] === undefined
            ) {
              console.warn(
                'THREE.GLTFLoader: Unknown extension "' + extensionName + '".'
              );
            }
        }
      }
    }

    parser.setExtensions(extensions);
    parser.setPlugins(plugins);
    parser.parse(onLoad, onError);
  }

  parseAsync(data, path) {

    return new Promise((resolve, reject) => {
      this.parse(data, path, resolve, reject);
    });
  }
}

/* GLTFREGISTRY */

function GLTFRegistry() {
  let objects = {};

  return {
    get: key => {
      return objects[key];
    },

    add: (key, object) => {
      objects[key] = object;
    },

    remove: key => {
      delete objects[key];
    },

    removeAll: () => {
      objects = {};
    },
  };
}

/*********************************/
/********** EXTENSIONS ***********/
/*********************************/

const EXTENSIONS = {
  KHR_BINARY_GLTF: "KHR_binary_glTF",
  KHR_DRACO_MESH_COMPRESSION: "KHR_draco_mesh_compression",
  KHR_LIGHTS_PUNCTUAL: "KHR_lights_punctual",
  KHR_MATERIALS_CLEARCOAT: "KHR_materials_clearcoat",
  KHR_MATERIALS_IOR: "KHR_materials_ior",
  KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: "KHR_materials_pbrSpecularGlossiness",
  KHR_MATERIALS_SHEEN: "KHR_materials_sheen",
  KHR_MATERIALS_SPECULAR: "KHR_materials_specular",
  KHR_MATERIALS_TRANSMISSION: "KHR_materials_transmission",
  KHR_MATERIALS_UNLIT: "KHR_materials_unlit",
  KHR_MATERIALS_VOLUME: "KHR_materials_volume",
  KHR_TEXTURE_BASISU: "KHR_texture_basisu",
  KHR_TEXTURE_TRANSFORM: "KHR_texture_transform",
  KHR_MESH_QUANTIZATION: "KHR_mesh_quantization",
  EXT_TEXTURE_WEBP: "EXT_texture_webp",
  EXT_MESHOPT_COMPRESSION: "EXT_meshopt_compression",
};

/**
 * Punctual Lights Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
 */
class GLTFLightsExtension {
  parser: GLTFParser;
  name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;

  // Object3D instance caches
  cache = {refs: {}, uses: {}};

  constructor(parser) {
    this.parser = parser;
  }

  _markDefs() {
    const parser = this.parser;
    const nodeDefs = this.parser.json.nodes || [];

    for (
      let nodeIndex = 0, nodeLength = nodeDefs.length;
      nodeIndex < nodeLength;
      nodeIndex++
    ) {
      const nodeDef = nodeDefs[nodeIndex];

      if (
        nodeDef.extensions &&
        nodeDef.extensions[this.name] &&
        nodeDef.extensions[this.name].light !== undefined
      ) {
        parser._addNodeRef(this.cache, nodeDef.extensions[this.name].light);
      }
    }
  }

  _loadLight(lightIndex) {
    const parser = this.parser;
    const cacheKey = "light:" + lightIndex;
    let dependency = parser.cache.get(cacheKey);

    if (dependency) return dependency;

    const json = parser.json;
    const extensions = (json.extensions && json.extensions[this.name]) || {};
    const lightDefs = extensions.lights || [];
    const lightDef = lightDefs[lightIndex];
    let lightNode;

    const color = new Color(0xffffff);

    if (lightDef.color !== undefined) color.fromArray(lightDef.color);

    const range = lightDef.range !== undefined ? lightDef.range : 0;

    switch (lightDef.type) {
      case "directional":
        lightNode = new DirectionalLight(color);
        lightNode.target.position.set(0, 0, -1);
        lightNode.add(lightNode.target);
        break;

      case "point":
        lightNode = new PointLight(color);
        lightNode.distance = range;
        break;

      case "spot":
        lightNode = new SpotLight(color);
        lightNode.distance = range;
        // Handle spotlight properties.
        lightDef.spot = lightDef.spot || {};
        lightDef.spot.innerConeAngle =
          lightDef.spot.innerConeAngle !== undefined
            ? lightDef.spot.innerConeAngle
            : 0;
        lightDef.spot.outerConeAngle =
          lightDef.spot.outerConeAngle !== undefined
            ? lightDef.spot.outerConeAngle
            : Math.PI / 4.0;
        lightNode.angle = lightDef.spot.outerConeAngle;
        lightNode.penumbra =
          1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
        lightNode.target.position.set(0, 0, -1);
        lightNode.add(lightNode.target);
        break;

      default:
        throw new Error(
          "THREE.GLTFLoader: Unexpected light type: " + lightDef.type
        );
    }

    // Some lights (e.g. spot) default to a position other than the origin. Reset the position
    // here, because node-level parsing will only override position if explicitly specified.
    lightNode.position.set(0, 0, 0);

    lightNode.decay = 2;

    if (lightDef.intensity !== undefined)
      lightNode.intensity = lightDef.intensity;

    lightNode.name = parser.createUniqueName(
      lightDef.name || "light_" + lightIndex
    );

    dependency = Promise.resolve(lightNode);

    parser.cache.add(cacheKey, dependency);

    return dependency;
  }

  createNodeAttachment(nodeIndex) {
    const parser = this.parser;
    const json = parser.json;
    const nodeDef = json.nodes[nodeIndex];
    const lightDef =
      (nodeDef.extensions && nodeDef.extensions[this.name]) || {};
    const lightIndex = lightDef.light;

    if (lightIndex === undefined) return null;

    return this._loadLight(lightIndex).then((light) => parser._getNodeRef(this.cache, lightIndex, light));
  }
}

/**
 * Unlit Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
 */
class GLTFMaterialsUnlitExtension {
  name = EXTENSIONS.KHR_MATERIALS_UNLIT;

  getMaterialType() {
    return MeshBasicMaterial;
  }

  extendParams(materialParams, materialDef, parser) {
    const pending = [];

    materialParams.color = new Color(1.0, 1.0, 1.0);
    materialParams.opacity = 1.0;

    const metallicRoughness = materialDef.pbrMetallicRoughness;

    if (metallicRoughness) {
      if (Array.isArray(metallicRoughness.baseColorFactor)) {
        const array = metallicRoughness.baseColorFactor;

        materialParams.color.fromArray(array);
        materialParams.opacity = array[3];
      }

      if (metallicRoughness.baseColorTexture !== undefined) {
        pending.push(
          parser.assignTexture(
            materialParams,
            "map",
            metallicRoughness.baseColorTexture
          )
        );
      }
    }

    return Promise.all(pending);
  }
}

/**
 * Clearcoat Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat
 */
class GLTFMaterialsClearcoatExtension {
  parser: GLTFParser;
  name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;

  constructor(parser) {
    this.parser = parser;
  }

  getMaterialType(materialIndex) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name])
      return null;

    return MeshPhysicalMaterial;
  }

  extendMaterialParams(materialIndex, materialParams) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const pending = [];

    const extension = materialDef.extensions[this.name];

    if (extension.clearcoatFactor !== undefined) {
      materialParams.clearcoat = extension.clearcoatFactor;
    }

    if (extension.clearcoatTexture !== undefined) {
      pending.push(
        parser.assignTexture(
          materialParams,
          "clearcoatMap",
          extension.clearcoatTexture
        )
      );
    }

    if (extension.clearcoatRoughnessFactor !== undefined) {
      materialParams.clearcoatRoughness = extension.clearcoatRoughnessFactor;
    }

    if (extension.clearcoatRoughnessTexture !== undefined) {
      pending.push(
        parser.assignTexture(
          materialParams,
          "clearcoatRoughnessMap",
          extension.clearcoatRoughnessTexture
        )
      );
    }

    if (extension.clearcoatNormalTexture !== undefined) {
      pending.push(
        parser.assignTexture(
          materialParams,
          "clearcoatNormalMap",
          extension.clearcoatNormalTexture
        )
      );

      if (extension.clearcoatNormalTexture.scale !== undefined) {
        const scale = extension.clearcoatNormalTexture.scale;

        materialParams.clearcoatNormalScale = new Vector2(scale, scale);
      }
    }

    return Promise.all(pending);
  }
}

/**
 * Sheen Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen
 */
class GLTFMaterialsSheenExtension {
  parser: GLTFParser;
  name = EXTENSIONS.KHR_MATERIALS_SHEEN;

  constructor(parser) {
    this.parser = parser;
  }

  getMaterialType(materialIndex) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name])
      return null;

    return MeshPhysicalMaterial;
  }

  extendMaterialParams(materialIndex, materialParams) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const pending = [];

    materialParams.sheenColor = new Color(0, 0, 0);
    materialParams.sheenRoughness = 0;
    materialParams.sheen = 1;

    const extension = materialDef.extensions[this.name];

    if (extension.sheenColorFactor !== undefined) {
      materialParams.sheenColor.fromArray(extension.sheenColorFactor);
    }

    if (extension.sheenRoughnessFactor !== undefined) {
      materialParams.sheenRoughness = extension.sheenRoughnessFactor;
    }

    if (extension.sheenColorTexture !== undefined) {
      pending.push(
        parser.assignTexture(
          materialParams,
          "sheenColorMap",
          extension.sheenColorTexture
        )
      );
    }

    if (extension.sheenRoughnessTexture !== undefined) {
      pending.push(
        parser.assignTexture(
          materialParams,
          "sheenRoughnessMap",
          extension.sheenRoughnessTexture
        )
      );
    }

    return Promise.all(pending);
  }
}

/**
 * Transmission Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission
 * Draft: https://github.com/KhronosGroup/glTF/pull/1698
 */
class GLTFMaterialsTransmissionExtension {
  name = EXTENSIONS.KHR_MATERIALS_TRANSMISSION;
  parser: GLTFParser;

  constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  getMaterialType(materialIndex) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name])
      return null;

    return MeshPhysicalMaterial;
  }

  extendMaterialParams(materialIndex, materialParams) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const pending = [];

    const extension = materialDef.extensions[this.name];

    if (extension.transmissionFactor !== undefined) {
      materialParams.transmission = extension.transmissionFactor;
    }

    if (extension.transmissionTexture !== undefined) {
      pending.push(
        parser.assignTexture(
          materialParams,
          "transmissionMap",
          extension.transmissionTexture
        )
      );
    }

    return Promise.all(pending);
  }
}

/**
 * Materials Volume Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_volume
 */
class GLTFMaterialsVolumeExtension {
  name = EXTENSIONS.KHR_MATERIALS_VOLUME;
  parser: GLTFParser;

  constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  getMaterialType(materialIndex) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name])
      return null;

    return MeshPhysicalMaterial;
  }

  extendMaterialParams(materialIndex, materialParams) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const pending = [];

    const extension = materialDef.extensions[this.name];

    materialParams.thickness =
      extension.thicknessFactor !== undefined ? extension.thicknessFactor : 0;

    if (extension.thicknessTexture !== undefined) {
      pending.push(
        parser.assignTexture(
          materialParams,
          "thicknessMap",
          extension.thicknessTexture
        )
      );
    }

    materialParams.attenuationDistance = extension.attenuationDistance || 0;

    const colorArray = extension.attenuationColor || [1, 1, 1];
    materialParams.attenuationColor = new Color(
      colorArray[0],
      colorArray[1],
      colorArray[2]
    );

    return Promise.all(pending);
  }
}

/**
 * Materials ior Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_ior
 */
class GLTFMaterialsIorExtension {
  name = EXTENSIONS.KHR_MATERIALS_IOR;
  parser: GLTFParser;

  constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  getMaterialType(materialIndex) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name])
      return null;

    return MeshPhysicalMaterial;
  }

  extendMaterialParams(materialIndex, materialParams) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const extension = materialDef.extensions[this.name];

    materialParams.ior = extension.ior !== undefined ? extension.ior : 1.5;

    return Promise.resolve();
  }
}

/**
 * Materials specular Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_specular
 */
class GLTFMaterialsSpecularExtension {
  name = EXTENSIONS.KHR_MATERIALS_SPECULAR;
  parser: GLTFParser;

  constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  getMaterialType(materialIndex) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name])
      return null;

    return MeshPhysicalMaterial;
  }

  extendMaterialParams(materialIndex, materialParams) {
    const parser = this.parser;
    const materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const pending = [];

    const extension = materialDef.extensions[this.name];

    materialParams.specularIntensity =
      extension.specularFactor !== undefined ? extension.specularFactor : 1.0;

    if (extension.specularTexture !== undefined) {
      pending.push(
        parser.assignTexture(
          materialParams,
          "specularIntensityMap",
          extension.specularTexture
        )
      );
    }

    const colorArray = extension.specularColorFactor || [1, 1, 1];
    materialParams.specularColor = new Color(
      colorArray[0],
      colorArray[1],
      colorArray[2]
    );

    if (extension.specularColorTexture !== undefined) {
      pending.push(
        parser
          .assignTexture(
            materialParams,
            "specularColorMap",
            extension.specularColorTexture
          )
          .then((texture) => {
            texture.encoding = sRGBEncoding;
          })
      );
    }

    return Promise.all(pending);
  }
}

/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
class GLTFTextureBasisUExtension {
  name = EXTENSIONS.KHR_TEXTURE_BASISU;
  parser: GLTFParser;

  constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  loadTexture(textureIndex) {
    const parser = this.parser;
    const json = parser.json;

    const textureDef = json.textures[textureIndex];

    if (!textureDef.extensions || !textureDef.extensions[this.name]) {
      return null;
    }

    const extension = textureDef.extensions[this.name];
    const source = json.images[extension.source];
    const loader = parser.options.ktx2Loader;

    if (!loader) {
      if (
        json.extensionsRequired &&
        json.extensionsRequired.indexOf(this.name) >= 0
      ) {
        throw new Error(
          "THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures"
        );
      } else {
        // Assumes that the extension is optional and that a fallback texture is present
        return null;
      }
    }

    return parser.loadTextureImage(textureIndex, source, loader);
  }
}

/**
 * WebP Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 */
class GLTFTextureWebPExtension {
  name = EXTENSIONS.EXT_TEXTURE_WEBP;
  parser: GLTFParser;
  isSupported = null;

  constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  loadTexture(textureIndex) {
    return Promise.resolve(null);
  }

  detectSupport() {
    if (!this.isSupported) {
      this.isSupported = new Promise((resolve) => {
        resolve(false);

        // const image = new Image();
        //
        // // Lossy test image. Support for lossy images doesn't guarantee support for all
        // // WebP images, unfortunately.
        // image.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
        //
        // image.onload = image.onerror = function () {
        //
        // 	resolve( image.height === 1 );
        //
        // };
      });
    }

    return this.isSupported;
  }
}

/**
 * meshopt BufferView Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
 */
class GLTFMeshoptCompression {
  name = EXTENSIONS.EXT_MESHOPT_COMPRESSION;
  parser: GLTFParser;

  constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  loadBufferView(index) {
    const json = this.parser.json;
    const bufferView = json.bufferViews[index];

    if (bufferView.extensions && bufferView.extensions[this.name]) {
      const extensionDef = bufferView.extensions[this.name];

      const buffer = this.parser.getDependency("buffer", extensionDef.buffer);
      const decoder = this.parser.options.meshoptDecoder;

      if (!decoder || !decoder.supported) {
        if (
          json.extensionsRequired &&
          json.extensionsRequired.indexOf(this.name) >= 0
        ) {
          throw new Error(
            "THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files"
          );
        } else {
          // Assumes that the extension is optional and that fallback buffer data is present
          return null;
        }
      }

      return Promise.all([buffer, decoder.ready]).then((res) => {
        const byteOffset = extensionDef.byteOffset || 0;
        const byteLength = extensionDef.byteLength || 0;

        const count = extensionDef.count;
        const stride = extensionDef.byteStride;

        const result = new ArrayBuffer(count * stride);
        const source = new Uint8Array(res[0], byteOffset, byteLength);

        decoder.decodeGltfBuffer(
          new Uint8Array(result),
          count,
          stride,
          source,
          extensionDef.mode,
          extensionDef.filter
        );
        return result;
      });
    } else {
      return null;
    }
  }
}

/* BINARY EXTENSION */
const BINARY_EXTENSION_HEADER_MAGIC = "glTF";
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = {JSON: 0x4e4f534a, BIN: 0x004e4942};

class GLTFBinaryExtension {
  name = EXTENSIONS.KHR_BINARY_GLTF;
  content = null;
  body = null;
  header;

  constructor(data) {
    const headerView = new DataView(data, 0, BINARY_EXTENSION_HEADER_LENGTH);

    this.header = {
      magic: LoaderUtils.decodeText(new Uint8Array(data.slice(0, 4))),
      version: headerView.getUint32(4, true),
      length: headerView.getUint32(8, true),
    };

    if (this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC) {
      throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
    } else if (this.header.version < 2.0) {
      throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
    }

    const chunkContentsLength =
      this.header.length - BINARY_EXTENSION_HEADER_LENGTH;
    const chunkView = new DataView(data, BINARY_EXTENSION_HEADER_LENGTH);
    let chunkIndex = 0;

    while (chunkIndex < chunkContentsLength) {
      const chunkLength = chunkView.getUint32(chunkIndex, true);
      chunkIndex += 4;

      const chunkType = chunkView.getUint32(chunkIndex, true);
      chunkIndex += 4;

      if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
        const contentArray = new Uint8Array(
          data,
          BINARY_EXTENSION_HEADER_LENGTH + chunkIndex,
          chunkLength
        );
        this.content = LoaderUtils.decodeText(contentArray);
      } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
        const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
        this.body = data.slice(byteOffset, byteOffset + chunkLength);
      }

      // Clients must ignore chunks with unknown types.

      chunkIndex += chunkLength;
    }

    if (this.content === null) {
      throw new Error("THREE.GLTFLoader: JSON content not found.");
    }
  }
}

/**
 * DRACO Mesh Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 */
class GLTFDracoMeshCompressionExtension {
  name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
  json: {[key: string]: any};
  dracoLoader: DRACOLoader;

  constructor(json, dracoLoader: DRACOLoader) {
    if (!dracoLoader) {
      throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");
    }

    this.json = json;
    this.dracoLoader = dracoLoader;
    this.dracoLoader.preload();
  }

  decodePrimitive(primitive, parser) {
    const json = this.json;
    const dracoLoader = this.dracoLoader;
    const bufferViewIndex = primitive.extensions[this.name].bufferView;
    const gltfAttributeMap = primitive.extensions[this.name].attributes;
    const threeAttributeMap = {};
    const attributeNormalizedMap = {};
    const attributeTypeMap = {};

    for (const attributeName in gltfAttributeMap) {
      const threeAttributeName =
        ATTRIBUTES[attributeName] || attributeName.toLowerCase();

      threeAttributeMap[threeAttributeName] = gltfAttributeMap[attributeName];
    }

    for (const attributeName in primitive.attributes) {
      const threeAttributeName =
        ATTRIBUTES[attributeName] || attributeName.toLowerCase();

      if (gltfAttributeMap[attributeName] !== undefined) {
        const accessorDef = json.accessors[primitive.attributes[attributeName]];
        const componentType = WEBGL_COMPONENT_TYPES[accessorDef.componentType];

        attributeTypeMap[threeAttributeName] = componentType.name;
        attributeNormalizedMap[threeAttributeName] =
          accessorDef.normalized === true;
      }
    }

    return parser
      .getDependency("bufferView", bufferViewIndex)
      .then((bufferView) => new Promise((resolve) => {
          dracoLoader.decodeDracoFile(
            bufferView,
            (geometry) => {
              for (const attributeName in geometry.attributes) {
                const attribute = geometry.attributes[attributeName];
                const normalized = attributeNormalizedMap[attributeName];

                if (normalized !== undefined) attribute.normalized = normalized;
              }

              resolve(geometry);
            },
            threeAttributeMap,
            attributeTypeMap
          );
        }));
  }
}

/**
 * Texture Transform Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_transform
 */
class GLTFTextureTransformExtension {
  name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;

  extendTexture(texture, transform) {
    if (transform.texCoord !== undefined) {
      console.warn(
        'THREE.GLTFLoader: Custom UV sets in "' +
          this.name +
          '" extension not yet supported.'
      );
    }

    if (
      transform.offset === undefined &&
      transform.rotation === undefined &&
      transform.scale === undefined
    ) {
      // See https://github.com/mrdoob/three.js/issues/21819.
      return texture;
    }

    texture = texture.clone();

    if (transform.offset !== undefined) {
      texture.offset.fromArray(transform.offset);
    }

    if (transform.rotation !== undefined) {
      texture.rotation = transform.rotation;
    }

    if (transform.scale !== undefined) {
      texture.repeat.fromArray(transform.scale);
    }

    texture.needsUpdate = true;

    return texture;
  }
}

/**
 * Specular-Glossiness Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Archived/KHR_materials_pbrSpecularGlossiness
 */

/**
 * A sub class of StandardMaterial with some of the functionality
 * changed via the `onBeforeCompile` callback
 * @pailhead
 */
class GLTFMeshStandardSGMaterial extends MeshStandardMaterial {
  isGLTFSpecularGlossinessMaterial = true;
  _extraUniforms;

  specularMap: Texture | null;
  specular: Color;
  glossinessMap: Texture | null;
  glossiness: number;

  constructor(params) {
    super();

    //various chunks that need replacing
    const specularMapParsFragmentChunk = [
      "#ifdef USE_SPECULARMAP",
      "	uniform sampler2D specularMap;",
      "#endif",
    ].join("\n");

    const glossinessMapParsFragmentChunk = [
      "#ifdef USE_GLOSSINESSMAP",
      "	uniform sampler2D glossinessMap;",
      "#endif",
    ].join("\n");

    const specularMapFragmentChunk = [
      "vec3 specularFactor = specular;",
      "#ifdef USE_SPECULARMAP",
      "	vec4 texelSpecular = texture2D( specularMap, vUv );",
      "	// reads channel RGB, compatible with a glTF Specular-Glossiness (RGBA) texture",
      "	specularFactor *= texelSpecular.rgb;",
      "#endif",
    ].join("\n");

    const glossinessMapFragmentChunk = [
      "float glossinessFactor = glossiness;",
      "#ifdef USE_GLOSSINESSMAP",
      "	vec4 texelGlossiness = texture2D( glossinessMap, vUv );",
      "	// reads channel A, compatible with a glTF Specular-Glossiness (RGBA) texture",
      "	glossinessFactor *= texelGlossiness.a;",
      "#endif",
    ].join("\n");

    const lightPhysicalFragmentChunk = [
      "PhysicalMaterial material;",
      "material.diffuseColor = diffuseColor.rgb * ( 1. - max( specularFactor.r, max( specularFactor.g, specularFactor.b ) ) );",
      "vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );",
      "float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );",
      "material.roughness = max( 1.0 - glossinessFactor, 0.0525 ); // 0.0525 corresponds to the base mip of a 256 cubemap.",
      "material.roughness += geometryRoughness;",
      "material.roughness = min( material.roughness, 1.0 );",
      "material.specularColor = specularFactor;",
    ].join("\n");

    const uniforms = {
      specular: {value: new Color().setHex(0xffffff)},
      glossiness: {value: 1},
      specularMap: {value: null},
      glossinessMap: {value: null},
    };

    this._extraUniforms = uniforms;

    this.onBeforeCompile = (shader) => {
      for (const uniformName in uniforms) {
        shader.uniforms[uniformName] = uniforms[uniformName];
      }

      shader.fragmentShader = shader.fragmentShader
        .replace("uniform float roughness;", "uniform vec3 specular;")
        .replace("uniform float metalness;", "uniform float glossiness;")
        .replace(
          "#include <roughnessmap_pars_fragment>",
          specularMapParsFragmentChunk
        )
        .replace(
          "#include <metalnessmap_pars_fragment>",
          glossinessMapParsFragmentChunk
        )
        .replace("#include <roughnessmap_fragment>", specularMapFragmentChunk)
        .replace("#include <metalnessmap_fragment>", glossinessMapFragmentChunk)
        .replace(
          "#include <lights_physical_fragment>",
          lightPhysicalFragmentChunk
        );
    };

    Object.defineProperties(this, {
      specular: {
        get: () => uniforms.specular.value,
        set: (v) => {
          uniforms.specular.value = v;
        },
      },

      specularMap: {
        get: () => uniforms.specularMap.value,
        set: function (v) {
          uniforms.specularMap.value = v;

          if (v) {
            this.defines.USE_SPECULARMAP = ""; // USE_UV is set by the renderer for specular maps
          } else {
            delete this.defines.USE_SPECULARMAP;
          }
        },
      },

      glossiness: {
        get: () => uniforms.glossiness.value,
        set: (v) => {
          uniforms.glossiness.value = v;
        },
      },

      glossinessMap: {
        get: () => uniforms.glossinessMap.value,
        set: function (v) {
          uniforms.glossinessMap.value = v;

          if (v) {
            this.defines.USE_GLOSSINESSMAP = "";
            this.defines.USE_UV = "";
          } else {
            delete this.defines.USE_GLOSSINESSMAP;
            delete this.defines.USE_UV;
          }
        },
      },
    });

    delete this.metalness;
    delete this.roughness;
    delete this.metalnessMap;
    delete this.roughnessMap;

    this.setValues(params);
  }

  copy(source) {
    super.copy(source);

    this.specularMap = source.specularMap;
    this.specular.copy(source.specular);
    this.glossinessMap = source.glossinessMap;
    this.glossiness = source.glossiness;
    delete this.metalness;
    delete this.roughness;
    delete this.metalnessMap;
    delete this.roughnessMap;
    return this;
  }
}

class GLTFMaterialsPbrSpecularGlossinessExtension {
  name = EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS;

  specularGlossinessParams = [
    "color",
    "map",
    "lightMap",
    "lightMapIntensity",
    "aoMap",
    "aoMapIntensity",
    "emissive",
    "emissiveIntensity",
    "emissiveMap",
    "bumpMap",
    "bumpScale",
    "normalMap",
    "normalMapType",
    "displacementMap",
    "displacementScale",
    "displacementBias",
    "specularMap",
    "specular",
    "glossinessMap",
    "glossiness",
    "alphaMap",
    "envMap",
    "envMapIntensity",
    "refractionRatio",
  ];

  getMaterialType() {
    return GLTFMeshStandardSGMaterial;
  }

  extendParams(materialParams, materialDef, parser) {
    const pbrSpecularGlossiness = materialDef.extensions[this.name];

    materialParams.color = new Color(1.0, 1.0, 1.0);
    materialParams.opacity = 1.0;

    const pending = [];

    if (Array.isArray(pbrSpecularGlossiness.diffuseFactor)) {
      const array = pbrSpecularGlossiness.diffuseFactor;

      materialParams.color.fromArray(array);
      materialParams.opacity = array[3];
    }

    if (pbrSpecularGlossiness.diffuseTexture !== undefined) {
      pending.push(
        parser.assignTexture(
          materialParams,
          "map",
          pbrSpecularGlossiness.diffuseTexture
        )
      );
    }

    materialParams.emissive = new Color(0.0, 0.0, 0.0);
    materialParams.glossiness =
      pbrSpecularGlossiness.glossinessFactor !== undefined
        ? pbrSpecularGlossiness.glossinessFactor
        : 1.0;
    materialParams.specular = new Color(1.0, 1.0, 1.0);

    if (Array.isArray(pbrSpecularGlossiness.specularFactor)) {
      materialParams.specular.fromArray(pbrSpecularGlossiness.specularFactor);
    }

    if (pbrSpecularGlossiness.specularGlossinessTexture !== undefined) {
      const specGlossMapDef = pbrSpecularGlossiness.specularGlossinessTexture;
      pending.push(
        parser.assignTexture(materialParams, "glossinessMap", specGlossMapDef)
      );
      pending.push(
        parser.assignTexture(materialParams, "specularMap", specGlossMapDef)
      );
    }

    return Promise.all(pending);
  }

  createMaterial(materialParams) {
    const material = new GLTFMeshStandardSGMaterial(materialParams);
    material.fog = true;

    material.color = materialParams.color;

    material.map = materialParams.map === undefined ? null : materialParams.map;

    material.lightMap = null;
    material.lightMapIntensity = 1.0;

    material.aoMap =
      materialParams.aoMap === undefined ? null : materialParams.aoMap;
    material.aoMapIntensity = 1.0;

    material.emissive = materialParams.emissive;
    material.emissiveIntensity = 1.0;
    material.emissiveMap =
      materialParams.emissiveMap === undefined
        ? null
        : materialParams.emissiveMap;

    material.bumpMap =
      materialParams.bumpMap === undefined ? null : materialParams.bumpMap;
    material.bumpScale = 1;

    material.normalMap =
      materialParams.normalMap === undefined ? null : materialParams.normalMap;
    material.normalMapType = TangentSpaceNormalMap;

    if (materialParams.normalScale)
      material.normalScale = materialParams.normalScale;

    material.displacementMap = null;
    material.displacementScale = 1;
    material.displacementBias = 0;

    material.specularMap =
      materialParams.specularMap === undefined
        ? null
        : materialParams.specularMap;
    material.specular = materialParams.specular;

    material.glossinessMap =
      materialParams.glossinessMap === undefined
        ? null
        : materialParams.glossinessMap;
    material.glossiness = materialParams.glossiness;

    material.alphaMap = null;

    material.envMap =
      materialParams.envMap === undefined ? null : materialParams.envMap;
    material.envMapIntensity = 1.0;

    material.refractionRatio = 0.98;

    return material;
  }
}

/**
 * Mesh Quantization Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization
 */
class GLTFMeshQuantizationExtension {
  name = EXTENSIONS.KHR_MESH_QUANTIZATION;
}

/*********************************/
/********** INTERPOLATION ********/
/*********************************/

// Spline Interpolation
// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation
class GLTFCubicSplineInterpolant extends Interpolant {
  constructor(parameterPositions, sampleValues, sampleSize, resultBuffer) {
    super(parameterPositions, sampleValues, sampleSize, resultBuffer);
  }

  copySampleValue_(index) {
    // Copies a sample value to the result buffer. See description of glTF
    // CUBICSPLINE values layout in interpolate_() function below.

    const result = this.resultBuffer,
      values = this.sampleValues,
      valueSize = this.valueSize,
      offset = index * valueSize * 3 + valueSize;

    for (let i = 0; i !== valueSize; i++) {
      result[i] = values[offset + i];
    }

    return result;
  }

  beforeStart_ = this.copySampleValue_;
  afterEnd_ = this.copySampleValue_;

  interpolate_(i1, t0, t, t1) {
    const result = this.resultBuffer;
    const values = this.sampleValues;
    const stride = this.valueSize;

    const stride2 = stride * 2;
    const stride3 = stride * 3;

    const td = t1 - t0;

    const p = (t - t0) / td;
    const pp = p * p;
    const ppp = pp * p;

    const offset1 = i1 * stride3;
    const offset0 = offset1 - stride3;

    const s2 = -2 * ppp + 3 * pp;
    const s3 = ppp - pp;
    const s0 = 1 - s2;
    const s1 = s3 - pp + p;

    // Layout of keyframe output values for CUBICSPLINE animations:
    //   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
    for (let i = 0; i !== stride; i++) {
      const p0 = values[offset0 + i + stride]; // splineVertex_k
      const m0 = values[offset0 + i + stride2] * td; // outTangent_k * (t_k+1 - t_k)
      const p1 = values[offset1 + i + stride]; // splineVertex_k+1
      const m1 = values[offset1 + i] * td; // inTangent_k+1 * (t_k+1 - t_k)

      result[i] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;
    }

    return result;
  }
}

const _q = new Quaternion();

class GLTFCubicSplineQuaternionInterpolant extends GLTFCubicSplineInterpolant {
  interpolate_(i1, t0, t, t1) {
    const result = super.interpolate_(i1, t0, t, t1);

    _q.fromArray(result).normalize().toArray(result);

    return result;
  }
}

/*********************************/
/********** INTERNALS ************/
/*********************************/

/* CONSTANTS */

const WEBGL_CONSTANTS = {
  FLOAT: 5126,
  // FLOAT_MAT2: 35674,
  FLOAT_MAT3: 35675,
  FLOAT_MAT4: 35676,
  FLOAT_VEC2: 35664,
  FLOAT_VEC3: 35665,
  FLOAT_VEC4: 35666,
  LINEAR: 9729,
  REPEAT: 10497,
  SAMPLER_2D: 35678,
  POINTS: 0,
  LINES: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6,
  UNSIGNED_BYTE: 5121,
  UNSIGNED_SHORT: 5123,
};

const WEBGL_COMPONENT_TYPES = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
};

const WEBGL_FILTERS = {
  9728: NearestFilter,
  9729: LinearFilter,
  9984: NearestMipmapNearestFilter,
  9985: LinearMipmapNearestFilter,
  9986: NearestMipmapLinearFilter,
  9987: LinearMipmapLinearFilter,
};

const WEBGL_WRAPPINGS = {
  33071: ClampToEdgeWrapping,
  33648: MirroredRepeatWrapping,
  10497: RepeatWrapping,
};

const WEBGL_TYPE_SIZES = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

const ATTRIBUTES = {
  POSITION: "position",
  NORMAL: "normal",
  TANGENT: "tangent",
  TEXCOORD_0: "uv",
  TEXCOORD_1: "uv2",
  COLOR_0: "color",
  WEIGHTS_0: "skinWeight",
  JOINTS_0: "skinIndex",
};

const PATH_PROPERTIES = {
  scale: "scale",
  translation: "position",
  rotation: "quaternion",
  weights: "morphTargetInfluences",
};

const INTERPOLATION = {
  CUBICSPLINE: undefined, // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
  // keyframe track will be initialized with a default interpolation type, then modified.
  LINEAR: InterpolateLinear,
  STEP: InterpolateDiscrete,
};

const ALPHA_MODES = {
  OPAQUE: "OPAQUE",
  MASK: "MASK",
  BLEND: "BLEND",
};

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
 */
function createDefaultMaterial(cache) {
  if (cache["DefaultMaterial"] === undefined) {
    cache["DefaultMaterial"] = new MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x000000,
      metalness: 1,
      roughness: 1,
      transparent: false,
      depthTest: true,
      side: FrontSide,
    });
  }

  return cache["DefaultMaterial"];
}

function addUnknownExtensionsToUserData(knownExtensions, object, objectDef) {
  // Add unknown glTF extensions to an object's userData.

  for (const name in objectDef.extensions) {
    if (knownExtensions[name] === undefined) {
      object.userData.gltfExtensions = object.userData.gltfExtensions || {};
      object.userData.gltfExtensions[name] = objectDef.extensions[name];
    }
  }
}

/**
 * @param {Object3D|Material|BufferGeometry} object
 * @param {GLTF.definition} gltfDef
 */
function assignExtrasToUserData(object, gltfDef) {
  if (gltfDef.extras !== undefined) {
    if (typeof gltfDef.extras === "object") {
      Object.assign(object.userData, gltfDef.extras);
    } else {
      console.warn(
        "THREE.GLTFLoader: Ignoring primitive type .extras, " + gltfDef.extras
      );
    }
  }
}

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
 */
function addMorphTargets(
  geometry: BufferGeometry,
  targets,
  parser: GLTFParser
): Promise<BufferGeometry> {
  let hasMorphPosition = false;
  let hasMorphNormal = false;

  for (let i = 0, il = targets.length; i < il; i++) {
    const target = targets[i];

    if (target.POSITION !== undefined) hasMorphPosition = true;
    if (target.NORMAL !== undefined) hasMorphNormal = true;

    if (hasMorphPosition && hasMorphNormal) break;
  }

  if (!hasMorphPosition && !hasMorphNormal) return Promise.resolve(geometry);

  const pendingPositionAccessors = [];
  const pendingNormalAccessors = [];

  for (let i = 0, il = targets.length; i < il; i++) {
    const target = targets[i];

    if (hasMorphPosition) {
      const pendingAccessor =
        target.POSITION !== undefined
          ? parser.getDependency("accessor", target.POSITION)
          : geometry.attributes.position;

      pendingPositionAccessors.push(pendingAccessor);
    }

    if (hasMorphNormal) {
      const pendingAccessor =
        target.NORMAL !== undefined
          ? parser.getDependency("accessor", target.NORMAL)
          : geometry.attributes.normal;

      pendingNormalAccessors.push(pendingAccessor);
    }
  }

  return Promise.all([
    Promise.all(pendingPositionAccessors),
    Promise.all(pendingNormalAccessors),
  ]).then(accessors => {
    const morphPositions = accessors[0];
    const morphNormals = accessors[1];

    if (hasMorphPosition) geometry.morphAttributes.position = morphPositions;
    if (hasMorphNormal) geometry.morphAttributes.normal = morphNormals;
    geometry.morphTargetsRelative = true;

    return geometry;
  });
}

/**
 * @param {Mesh} mesh
 * @param {GLTF.Mesh} meshDef
 */
function updateMorphTargets(mesh, meshDef) {
  mesh.updateMorphTargets();

  if (meshDef.weights !== undefined) {
    for (let i = 0, il = meshDef.weights.length; i < il; i++) {
      mesh.morphTargetInfluences[i] = meshDef.weights[i];
    }
  }

  // .extras has user-defined data, so check that .extras.targetNames is an array.
  if (meshDef.extras && Array.isArray(meshDef.extras.targetNames)) {
    const targetNames = meshDef.extras.targetNames;

    if (mesh.morphTargetInfluences.length === targetNames.length) {
      mesh.morphTargetDictionary = {};

      for (let i = 0, il = targetNames.length; i < il; i++) {
        mesh.morphTargetDictionary[targetNames[i]] = i;
      }
    } else {
      console.warn(
        "THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names."
      );
    }
  }
}

function createPrimitiveKey(primitiveDef) {
  const dracoExtension =
    primitiveDef.extensions &&
    primitiveDef.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION];
  let geometryKey;

  if (dracoExtension) {
    geometryKey =
      "draco:" +
      dracoExtension.bufferView +
      ":" +
      dracoExtension.indices +
      ":" +
      createAttributesKey(dracoExtension.attributes);
  } else {
    geometryKey =
      primitiveDef.indices +
      ":" +
      createAttributesKey(primitiveDef.attributes) +
      ":" +
      primitiveDef.mode;
  }

  return geometryKey;
}

function createAttributesKey(attributes) {
  let attributesKey = "";

  const keys = Object.keys(attributes).sort();

  for (let i = 0, il = keys.length; i < il; i++) {
    attributesKey += keys[i] + ":" + attributes[keys[i]] + ";";
  }

  return attributesKey;
}

function getNormalizedComponentScale(constructor) {
  // Reference:
  // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data

  switch (constructor) {
    case Int8Array:
      return 1 / 127;

    case Uint8Array:
      return 1 / 255;

    case Int16Array:
      return 1 / 32767;

    case Uint16Array:
      return 1 / 65535;

    default:
      throw new Error(
        "THREE.GLTFLoader: Unsupported normalized accessor component type."
      );
  }
}

/* GLTF PARSER */

class GLTFParser {
  json: {[key: string]: any} = {};
  extensions = {};
  plugins = {};
  options: {[key: string]: any} = {};

  // @ts-ignore loader object cache
  cache = new GLTFRegistry();

  // associations between Three.js objects and glTF elements
  associations = new Map();

  // BufferGeometry caching
  primitiveCache = {};

  // Object3D instance caches
  meshCache = {refs: {}, uses: {}};
  cameraCache = {refs: {}, uses: {}};
  lightCache = {refs: {}, uses: {}};

  textureCache = {};

  // Track node names, to ensure no duplicates
  nodeNamesUsed = {};

  fileLoader: FileLoader;

  constructor(
    json: {[key: string]: any} = {},
    options: {[key: string]: any} = {}
  ) {
    this.json = json;
    this.options = options;

    this.fileLoader = new FileLoader(this.options.manager);
    this.fileLoader.setResponseType("arraybuffer");

    if (this.options.crossOrigin === "use-credentials") {
      this.fileLoader.setWithCredentials(true);
    }
  }

  setExtensions(extensions) {
    this.extensions = extensions;
  }

  setPlugins(plugins) {
    this.plugins = plugins;
  }

  parse(onLoad, onError) {
    const parser = this;
    const json = this.json;
    const extensions = this.extensions;

    // Clear the loader cache
    this.cache.removeAll();

    // Mark the special nodes/meshes in json for efficient parse
    this._invokeAll(ext => ext._markDefs && ext._markDefs());

    Promise.all(this._invokeAll(ext => ext.beforeRoot && ext.beforeRoot()))
      .then(() =>
        Promise.all([
          parser.getDependencies("scene"),
          parser.getDependencies("animation"),
          parser.getDependencies("camera"),
        ])
      )
      .then(dependencies => {
        const result = {
          scene: dependencies[0][json.scene || 0],
          scenes: dependencies[0],
          animations: dependencies[1],
          cameras: dependencies[2],
          asset: json.asset,
          parser,
          userData: {},
        };

        addUnknownExtensionsToUserData(extensions, result, json);

        assignExtrasToUserData(result, json);

        Promise.all(
          parser._invokeAll((ext) => ext.afterRoot && ext.afterRoot(result))
        ).then(() => {
          onLoad(result);
        });
      })
      .catch(onError);
  }

  /**
   * Marks the special nodes/meshes in json for efficient parse.
   */
  _markDefs() {
    const nodeDefs = this.json.nodes || [];
    const skinDefs = this.json.skins || [];
    const meshDefs = this.json.meshes || [];

    // Nothing in the node definition indicates whether it is a Bone or an
    // Object3D. Use the skins' joint references to mark bones.
    for (
      let skinIndex = 0, skinLength = skinDefs.length;
      skinIndex < skinLength;
      skinIndex++
    ) {
      const joints = skinDefs[skinIndex].joints;

      for (let i = 0, il = joints.length; i < il; i++) {
        nodeDefs[joints[i]].isBone = true;
      }
    }

    // Iterate over all nodes, marking references to shared resources,
    // as well as skeleton joints.
    for (
      let nodeIndex = 0, nodeLength = nodeDefs.length;
      nodeIndex < nodeLength;
      nodeIndex++
    ) {
      const nodeDef = nodeDefs[nodeIndex];

      if (nodeDef.mesh !== undefined) {
        this._addNodeRef(this.meshCache, nodeDef.mesh);

        // Nothing in the mesh definition indicates whether it is
        // a SkinnedMesh or Mesh. Use the node's mesh reference
        // to mark SkinnedMesh if node has skin.
        if (nodeDef.skin !== undefined) {
          meshDefs[nodeDef.mesh].isSkinnedMesh = true;
        }
      }

      if (nodeDef.camera !== undefined) {
        this._addNodeRef(this.cameraCache, nodeDef.camera);
      }
    }
  }

  /**
   * Counts references to shared node / Object3D resources. These resources
   * can be reused, or "instantiated", at multiple nodes in the scene
   * hierarchy. Mesh, Camera, and Light instances are instantiated and must
   * be marked. Non-scenegraph resources (like Materials, Geometries, and
   * Textures) can be reused directly and are not marked here.
   *
   * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
   */
  _addNodeRef(cache, index) {
    if (index === undefined) return;

    if (cache.refs[index] === undefined) {
      cache.refs[index] = cache.uses[index] = 0;
    }

    cache.refs[index]++;
  }

  /** Returns a reference to a shared resource, cloning it if necessary. */
  _getNodeRef(cache, index, object) {
    if (cache.refs[index] <= 1) return object;

    const ref = object.clone();

    // Propagates mappings to the cloned object, prevents mappings on the
    // original object from being lost.
    const updateMappings = (original, clone) => {
      const mappings = this.associations.get(original);
      if (mappings != null) {
        this.associations.set(clone, mappings);
      }

      for (const [i, child] of original.children.entries()) {
        updateMappings(child, clone.children[i]);
      }
    };

    updateMappings(object, ref);

    ref.name += "_instance_" + cache.uses[index]++;

    return ref;
  }

  _invokeOne(func) {
    const extensions = Object.values(this.plugins);
    extensions.push(this);

    for (let i = 0; i < extensions.length; i++) {
      const result = func(extensions[i]);

      if (result) return result;
    }

    return null;
  }

  _invokeAll(func) {
    const extensions = Object.values(this.plugins);
    extensions.unshift(this);

    const pending = [];

    for (let i = 0; i < extensions.length; i++) {
      const result = func(extensions[i]);

      if (result) pending.push(result);
    }

    return pending;
  }

  /**
   * Requests the specified dependency asynchronously, with caching.
   */
  getDependency(type: "scene" | "node", index: number): Promise<Object3D>;
  getDependency(
    type: "accessor",
    index: number
  ): Promise<BufferAttribute | InterleavedBufferAttribute>;
  getDependency(
    type: "mesh",
    index: number
  ): Promise<Group | Mesh | SkinnedMesh>;
  getDependency(
    type: "bufferView" | "buffer",
    index: number
  ): Promise<ArrayBuffer>;
  getDependency(type: "material", index: number): Promise<Material>;
  getDependency(type: "texture", index: number): Promise<Texture>;
  getDependency(type: "skin", index: number): Promise<any>;
  getDependency(type: "animation", index: number): Promise<AnimationClip>;
  getDependency(type: "camera", index: number): Promise<Camera>;
  getDependency(type: string, index: number): Promise<any> {
    const cacheKey = type + ":" + index;
    let dependency = this.cache.get(cacheKey);

    if (!dependency) {
      switch (type) {
        case "scene":
          dependency = this.loadScene(index);
          break;

        case "node":
          dependency = this.loadNode(index);
          break;

        case "mesh":
          dependency = this._invokeOne(
            ext => ext.loadMesh && ext.loadMesh(index)
          );
          break;

        case "accessor":
          dependency = this.loadAccessor(index);
          break;

        case "bufferView":
          dependency = this._invokeOne(
            ext => ext.loadBufferView && ext.loadBufferView(index)
          );
          break;

        case "buffer":
          dependency = this.loadBuffer(index);
          break;

        case "material":
          dependency = this._invokeOne(
            ext => ext.loadMaterial && ext.loadMaterial(index)
          );
          break;

        case "texture":
          dependency = this._invokeOne(
            ext => ext.loadTexture && ext.loadTexture(index)
          );
          break;

        case "skin":
          dependency = this.loadSkin(index);
          break;

        case "animation":
          dependency = this.loadAnimation(index);
          break;

        case "camera":
          dependency = this.loadCamera(index);
          break;

        default:
          throw new Error("Unknown type: " + type);
      }

      this.cache.add(cacheKey, dependency);
    }

    return dependency;
  }

  /**
   * Requests all dependencies of the specified type asynchronously, with caching.
   */
  getDependencies(type: string): Promise<any[]> {
    let dependencies = this.cache.get(type);

    if (!dependencies) {
      const defs = this.json[type + (type === "mesh" ? "es" : "s")] || [];

      // @ts-ignore
      dependencies = Promise.all(
        defs.map((def, index) => this.getDependency(type, index))
      );

      this.cache.add(type, dependencies);
    }

    return dependencies;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   */
  loadBuffer(bufferIndex: number): Promise<ArrayBuffer> {
    const bufferDef = this.json.buffers[bufferIndex];
    const loader = this.fileLoader;

    if (bufferDef.type && bufferDef.type !== "arraybuffer") {
      throw new Error(
        "THREE.GLTFLoader: " + bufferDef.type + " buffer type is not supported."
      );
    }

    // If present, GLB container is required to be the first buffer.
    if (bufferDef.uri === undefined && bufferIndex === 0) {
      return Promise.resolve(this.extensions[EXTENSIONS.KHR_BINARY_GLTF].body);
    }

    const options = this.options;

    return new Promise((resolve, reject) => {
      // @ts-ignore
      loader.load(
        LoaderUtils.resolveURL(bufferDef.uri, options.path),
        resolve,
        undefined,
        () => {
          reject(
            new Error(
              'THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".'
            )
          );
        }
      );
    });
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   */
  loadBufferView(bufferViewIndex: number): Promise<ArrayBuffer> {
    const bufferViewDef = this.json.bufferViews[bufferViewIndex];

    return this.getDependency("buffer", bufferViewDef.buffer).then(buffer => {
      const byteLength = bufferViewDef.byteLength || 0;
      const byteOffset = bufferViewDef.byteOffset || 0;
      return buffer.slice(byteOffset, byteOffset + byteLength);
    });
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
   */
  loadAccessor(
    accessorIndex: number
  ): Promise<BufferAttribute | InterleavedBufferAttribute> {
    const json = this.json;

    const accessorDef = this.json.accessors[accessorIndex];

    if (
      accessorDef.bufferView === undefined &&
      accessorDef.sparse === undefined
    ) {
      // Ignore empty accessors, which may be used to declare runtime
      // information about attributes coming from another source (e.g. Draco
      // compression extension).
      return Promise.resolve(null);
    }

    const pendingBufferViews = [];

    if (accessorDef.bufferView !== undefined) {
      pendingBufferViews.push(
        this.getDependency("bufferView", accessorDef.bufferView)
      );
    } else {
      pendingBufferViews.push(null);
    }

    if (accessorDef.sparse !== undefined) {
      pendingBufferViews.push(
        this.getDependency("bufferView", accessorDef.sparse.indices.bufferView)
      );
      pendingBufferViews.push(
        this.getDependency("bufferView", accessorDef.sparse.values.bufferView)
      );
    }

    return Promise.all(pendingBufferViews).then((bufferViews) => {
      const bufferView = bufferViews[0];

      const itemSize = WEBGL_TYPE_SIZES[accessorDef.type];
      const TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType];

      // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
      const elementBytes = TypedArray.BYTES_PER_ELEMENT;
      const itemBytes = elementBytes * itemSize;
      const byteOffset = accessorDef.byteOffset || 0;
      const byteStride =
        accessorDef.bufferView !== undefined
          ? json.bufferViews[accessorDef.bufferView].byteStride
          : undefined;
      const normalized = accessorDef.normalized === true;
      let array, bufferAttribute;

      // The buffer is not interleaved if the stride is the item size in bytes.
      if (byteStride && byteStride !== itemBytes) {
        // Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
        // This makes sure that IBA.count reflects accessor.count properly
        const ibSlice = Math.floor(byteOffset / byteStride);
        const ibCacheKey =
          "InterleavedBuffer:" +
          accessorDef.bufferView +
          ":" +
          accessorDef.componentType +
          ":" +
          ibSlice +
          ":" +
          accessorDef.count;
        let ib = this.cache.get(ibCacheKey);

        if (!ib) {
          array = new TypedArray(
            bufferView,
            ibSlice * byteStride,
            (accessorDef.count * byteStride) / elementBytes
          );

          // Integer parameters to IB/IBA are in array elements, not bytes.
          ib = new InterleavedBuffer(array, byteStride / elementBytes);

          this.cache.add(ibCacheKey, ib);
        }

        bufferAttribute = new InterleavedBufferAttribute(
          ib,
          itemSize,
          (byteOffset % byteStride) / elementBytes,
          normalized
        );
      } else {
        if (bufferView === null) {
          array = new TypedArray(accessorDef.count * itemSize);
        } else {
          array = new TypedArray(
            bufferView,
            byteOffset,
            accessorDef.count * itemSize
          );
        }

        bufferAttribute = new BufferAttribute(array, itemSize, normalized);
      }

      // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
      if (accessorDef.sparse !== undefined) {
        const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
        const TypedArrayIndices =
          WEBGL_COMPONENT_TYPES[accessorDef.sparse.indices.componentType];

        const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
        const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;

        const sparseIndices = new TypedArrayIndices(
          bufferViews[1],
          byteOffsetIndices,
          accessorDef.sparse.count * itemSizeIndices
        );
        const sparseValues = new TypedArray(
          bufferViews[2],
          byteOffsetValues,
          accessorDef.sparse.count * itemSize
        );

        if (bufferView !== null) {
          // Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
          bufferAttribute = new BufferAttribute(
            bufferAttribute.array.slice(),
            bufferAttribute.itemSize,
            bufferAttribute.normalized
          );
        }

        for (let i = 0, il = sparseIndices.length; i < il; i++) {
          const index = sparseIndices[i];

          bufferAttribute.setX(index, sparseValues[i * itemSize]);
          if (itemSize >= 2)
            bufferAttribute.setY(index, sparseValues[i * itemSize + 1]);
          if (itemSize >= 3)
            bufferAttribute.setZ(index, sparseValues[i * itemSize + 2]);
          if (itemSize >= 4)
            bufferAttribute.setW(index, sparseValues[i * itemSize + 3]);
          if (itemSize >= 5)
            throw new Error(
              "THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute."
            );
        }
      }

      return bufferAttribute;
    });
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
   */
  loadTexture(textureIndex: number): Promise<Texture> {
    const json = this.json;
    const options = this.options;
    const textureDef = json.textures[textureIndex];
    const source = json.images[textureDef.source];

    if (source.uri) {
      const handler = options.manager.getHandler(source.uri);
      if (handler !== null) loader = handler;
    }

    return Promise.resolve(null);
  }

  loadTextureImage(textureIndex: number, source, loader) {
    return null;
  }

  /**
   * Asynchronously assigns a texture to the given material parameters.
   * @param {Object} materialParams
   * @param {string} mapName
   * @param {Object} mapDef
   * @return {Promise<Texture>}
   */
  assignTexture(materialParams, mapName, mapDef) {

    return this.getDependency("texture", mapDef.index).then((texture) => {
      // Materials sample aoMap from UV set 1 and other maps from UV set 0 - this can't be configured
      // However, we will copy UV set 0 to UV set 1 on demand for aoMap
      if (
        mapDef.texCoord !== undefined &&
        mapDef.texCoord != 0 &&
        !(mapName === "aoMap" && mapDef.texCoord == 1)
      ) {
        console.warn(
          "THREE.GLTFLoader: Custom UV set " +
            mapDef.texCoord +
            " for texture " +
            mapName +
            " not yet supported."
        );
      }

      if (this.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]) {
        const transform =
          mapDef.extensions !== undefined
            ? mapDef.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]
            : undefined;

        if (transform) {
          const gltfReference = this.associations.get(texture);
          texture = this.extensions[
            EXTENSIONS.KHR_TEXTURE_TRANSFORM
          ].extendTexture(texture, transform);
          this.associations.set(texture, gltfReference);
        }
      }

      materialParams[mapName] = texture;

      return texture;
    });
  }

  /**
   * Assigns final material to a Mesh, Line, or Points instance. The instance
   * already has a material (generated from the glTF material options alone)
   * but reuse of the same glTF material may require multiple threejs materials
   * to accommodate different primitive types, defines, etc. New materials will
   * be created if necessary, and reused from a cache.
   * @param  {Object3D} mesh Mesh, Line, or Points instance.
   */
  assignFinalMaterial(mesh) {
    const geometry = mesh.geometry;
    let material = mesh.material;

    const useDerivativeTangents = geometry.attributes.tangent === undefined;
    const useVertexColors = geometry.attributes.color !== undefined;
    const useFlatShading = geometry.attributes.normal === undefined;

    if (mesh.isPoints) {
      const cacheKey = "PointsMaterial:" + material.uuid;

      let pointsMaterial = this.cache.get(cacheKey);

      if (!pointsMaterial) {
        pointsMaterial = new PointsMaterial();
        Material.prototype.copy.call(pointsMaterial, material);
        pointsMaterial.color.copy(material.color);
        pointsMaterial.map = material.map;
        pointsMaterial.sizeAttenuation = false; // glTF spec says points should be 1px

        this.cache.add(cacheKey, pointsMaterial);
      }

      material = pointsMaterial;
    } else if (mesh.isLine) {
      const cacheKey = "LineBasicMaterial:" + material.uuid;

      let lineMaterial = this.cache.get(cacheKey);

      if (!lineMaterial) {
        lineMaterial = new LineBasicMaterial();
        Material.prototype.copy.call(lineMaterial, material);
        lineMaterial.color.copy(material.color);

        this.cache.add(cacheKey, lineMaterial);
      }

      material = lineMaterial;
    }

    // Clone the material if it will be modified
    if (useDerivativeTangents || useVertexColors || useFlatShading) {
      let cacheKey = "ClonedMaterial:" + material.uuid + ":";

      if (material.isGLTFSpecularGlossinessMaterial)
        cacheKey += "specular-glossiness:";
      if (useDerivativeTangents) cacheKey += "derivative-tangents:";
      if (useVertexColors) cacheKey += "vertex-colors:";
      if (useFlatShading) cacheKey += "flat-shading:";

      let cachedMaterial = this.cache.get(cacheKey);

      if (!cachedMaterial) {
        cachedMaterial = material.clone();

        if (useVertexColors) cachedMaterial.vertexColors = true;
        if (useFlatShading) cachedMaterial.flatShading = true;

        if (useDerivativeTangents) {
          // https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995
          if (cachedMaterial.normalScale) cachedMaterial.normalScale.y *= -1;
          if (cachedMaterial.clearcoatNormalScale)
            cachedMaterial.clearcoatNormalScale.y *= -1;
        }

        this.cache.add(cacheKey, cachedMaterial);

        this.associations.set(cachedMaterial, this.associations.get(material));
      }

      material = cachedMaterial;
    }

    // workarounds for mesh and geometry

    if (
      material.aoMap &&
      geometry.attributes.uv2 === undefined &&
      geometry.attributes.uv !== undefined
    ) {
      geometry.setAttribute("uv2", geometry.attributes.uv);
    }

    mesh.material = material;
  }

  getMaterialType(/* materialIndex */) {
    return MeshStandardMaterial;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
   */
  loadMaterial(materialIndex: number): Promise<Material> {
    const json = this.json;
    const extensions = this.extensions;
    const materialDef = json.materials[materialIndex];

    let materialType;
    const materialParams: Partial<
      ExcludeFunctionProps<GLTFMeshStandardSGMaterial>
    > = {};
    const materialExtensions = materialDef.extensions || {};

    const pending = [];

    if (materialExtensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS]) {
      const sgExtension =
        extensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS];
      materialType = sgExtension.getMaterialType();
      pending.push(
        sgExtension.extendParams(materialParams, materialDef, this)
      );
    } else if (materialExtensions[EXTENSIONS.KHR_MATERIALS_UNLIT]) {
      const kmuExtension = extensions[EXTENSIONS.KHR_MATERIALS_UNLIT];
      materialType = kmuExtension.getMaterialType();
      pending.push(
        kmuExtension.extendParams(materialParams, materialDef, this)
      );
    } else {
      // Specification:
      // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material

      const metallicRoughness = materialDef.pbrMetallicRoughness || {};

      materialParams.color = new Color(1.0, 1.0, 1.0);
      materialParams.opacity = 1.0;

      if (Array.isArray(metallicRoughness.baseColorFactor)) {
        const array = metallicRoughness.baseColorFactor;

        materialParams.color.fromArray(array);
        materialParams.opacity = array[3];
      }

      if (metallicRoughness.baseColorTexture !== undefined) {
        pending.push(
          this.assignTexture(
            materialParams,
            "map",
            metallicRoughness.baseColorTexture
          )
        );
      }

      materialParams.metalness =
        metallicRoughness.metallicFactor !== undefined
          ? metallicRoughness.metallicFactor
          : 1.0;
      materialParams.roughness =
        metallicRoughness.roughnessFactor !== undefined
          ? metallicRoughness.roughnessFactor
          : 1.0;

      if (metallicRoughness.metallicRoughnessTexture !== undefined) {
        pending.push(
          this.assignTexture(
            materialParams,
            "metalnessMap",
            metallicRoughness.metallicRoughnessTexture
          )
        );
        pending.push(
          this.assignTexture(
            materialParams,
            "roughnessMap",
            metallicRoughness.metallicRoughnessTexture
          )
        );
      }

      materialType = this._invokeOne((ext) => ext.getMaterialType && ext.getMaterialType(materialIndex));

      pending.push(
        Promise.all(
          this._invokeAll((ext) => (
              ext.extendMaterialParams &&
              ext.extendMaterialParams(materialIndex, materialParams)
            ))
        )
      );
    }

    if (materialDef.doubleSided === true) {
      materialParams.side = DoubleSide;
    }

    const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

    if (alphaMode === ALPHA_MODES.BLEND) {
      materialParams.transparent = true;

      // See: https://github.com/mrdoob/three.js/issues/17706
      materialParams.depthWrite = false;
    } else {
      materialParams.transparent = false;

      if (alphaMode === ALPHA_MODES.MASK) {
        materialParams.alphaTest =
          materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;
      }
    }

    if (
      materialDef.normalTexture !== undefined &&
      materialType !== MeshBasicMaterial
    ) {
      pending.push(
        this.assignTexture(
          materialParams,
          "normalMap",
          materialDef.normalTexture
        )
      );

      materialParams.normalScale = new Vector2(1, 1);

      if (materialDef.normalTexture.scale !== undefined) {
        const scale = materialDef.normalTexture.scale;

        materialParams.normalScale.set(scale, scale);
      }
    }

    if (
      materialDef.occlusionTexture !== undefined &&
      materialType !== MeshBasicMaterial
    ) {
      pending.push(
        this.assignTexture(
          materialParams,
          "aoMap",
          materialDef.occlusionTexture
        )
      );

      if (materialDef.occlusionTexture.strength !== undefined) {
        materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;
      }
    }

    if (
      materialDef.emissiveFactor !== undefined &&
      materialType !== MeshBasicMaterial
    ) {
      materialParams.emissive = new Color().fromArray(
        materialDef.emissiveFactor
      );
    }

    if (
      materialDef.emissiveTexture !== undefined &&
      materialType !== MeshBasicMaterial
    ) {
      pending.push(
        this.assignTexture(
          materialParams,
          "emissiveMap",
          materialDef.emissiveTexture
        )
      );
    }

    return Promise.all(pending).then(() => {
      let material;

      if (materialType === GLTFMeshStandardSGMaterial) {
        material =
          extensions[
            EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS
          ].createMaterial(materialParams);
      } else {
        material = new materialType(materialParams);
      }

      if (materialDef.name) material.name = materialDef.name;

      // baseColorTexture, emissiveTexture, and specularGlossinessTexture use sRGB encoding.
      if (material.map) material.map.encoding = sRGBEncoding;
      if (material.emissiveMap) material.emissiveMap.encoding = sRGBEncoding;

      assignExtrasToUserData(material, materialDef);

      this.associations.set(material, {materials: materialIndex});

      if (materialDef.extensions)
        addUnknownExtensionsToUserData(extensions, material, materialDef);

      return material;
    });
  }

  /** When Object3D instances are targeted by animation, they need unique names. */
  createUniqueName(originalName) {
    const sanitizedName = PropertyBinding.sanitizeNodeName(originalName || "");

    let name = sanitizedName;

    for (let i = 1; this.nodeNamesUsed[name]; ++i) {
      name = sanitizedName + "_" + i;
    }

    this.nodeNamesUsed[name] = true;

    return name;
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
   *
   * Creates BufferGeometries from primitives.
   *
   * @param {Array<GLTF.Primitive>} primitives
   * @return {Promise<Array<BufferGeometry>>}
   */
  loadGeometries(primitives) {
    const parser = this;
    const extensions = this.extensions;
    const cache = this.primitiveCache;

    function createDracoPrimitive(primitive) {
      return extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]
        .decodePrimitive(primitive, parser)
        .then((geometry) => addPrimitiveAttributes(geometry, primitive, parser));
    }

    const pending = [];

    for (let i = 0, il = primitives.length; i < il; i++) {
      const primitive = primitives[i];
      const cacheKey = createPrimitiveKey(primitive);

      // See if we've already created this geometry
      const cached = cache[cacheKey];

      if (cached) {
        // Use the cached geometry if it exists
        pending.push(cached.promise);
      } else {
        let geometryPromise;

        if (
          primitive.extensions &&
          primitive.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]
        ) {
          // Use DRACO geometry if available
          geometryPromise = createDracoPrimitive(primitive);
        } else {
          // Otherwise create a new geometry
          geometryPromise = addPrimitiveAttributes(
            new BufferGeometry(),
            primitive,
            parser
          );
        }

        // Cache this geometry
        cache[cacheKey] = {primitive: primitive, promise: geometryPromise};

        pending.push(geometryPromise);
      }
    }

    return Promise.all(pending);
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
   */
  loadMesh(meshIndex: number): Promise<Group | Mesh | SkinnedMesh> {
    const json = this.json;
    const extensions = this.extensions;

    const meshDef = json.meshes[meshIndex];
    const primitives = meshDef.primitives;

    const pending = [];

    for (let i = 0, il = primitives.length; i < il; i++) {
      const material =
        primitives[i].material === undefined
          ? createDefaultMaterial(this.cache)
          : this.getDependency("material", primitives[i].material);

      pending.push(material);
    }

    pending.push(this.loadGeometries(primitives));

    return Promise.all(pending).then(results => {
      const materials = results.slice(0, results.length - 1);
      const geometries = results[results.length - 1];

      const meshes = [];

      for (let i = 0, il = geometries.length; i < il; i++) {
        const geometry = geometries[i];
        const primitive = primitives[i];

        // 1. create Mesh

        let mesh;

        const material = materials[i];

        if (
          primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
          primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
          primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
          primitive.mode === undefined
        ) {
          // .isSkinnedMesh isn't in glTF spec. See ._markDefs()
          mesh =
            meshDef.isSkinnedMesh === true
              ? new SkinnedMesh(geometry, material)
              : new Mesh(geometry, material);

          if (
            mesh.isSkinnedMesh === true &&
            !mesh.geometry.attributes.skinWeight.normalized
          ) {
            // we normalize floating point skin weight array to fix malformed assets (see #15319)
            // it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
            mesh.normalizeSkinWeights();
          }

          if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP) {
            mesh.geometry = toTrianglesDrawMode(
              mesh.geometry,
              TriangleStripDrawMode
            );
          } else if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN) {
            mesh.geometry = toTrianglesDrawMode(
              mesh.geometry,
              TriangleFanDrawMode
            );
          }
        } else if (primitive.mode === WEBGL_CONSTANTS.LINES) {
          mesh = new LineSegments(geometry, material);
        } else if (primitive.mode === WEBGL_CONSTANTS.LINE_STRIP) {
          mesh = new Line(geometry, material);
        } else if (primitive.mode === WEBGL_CONSTANTS.LINE_LOOP) {
          mesh = new LineLoop(geometry, material);
        } else if (primitive.mode === WEBGL_CONSTANTS.POINTS) {
          mesh = new Points(geometry, material);
        } else {
          throw new Error(
            "THREE.GLTFLoader: Primitive mode unsupported: " + primitive.mode
          );
        }

        if (Object.keys(mesh.geometry.morphAttributes).length > 0) {
          updateMorphTargets(mesh, meshDef);
        }

        mesh.name = this.createUniqueName(
          meshDef.name || "mesh_" + meshIndex
        );

        assignExtrasToUserData(mesh, meshDef);

        if (primitive.extensions)
          addUnknownExtensionsToUserData(extensions, mesh, primitive);

        this.assignFinalMaterial(mesh);

        meshes.push(mesh);
      }

      for (let i = 0, il = meshes.length; i < il; i++) {
        this.associations.set(meshes[i], {
          meshes: meshIndex,
          primitives: i,
        });
      }

      if (meshes.length === 1) {
        return meshes[0];
      }

      const group = new Group();

      this.associations.set(group, {meshes: meshIndex});

      for (let i = 0, il = meshes.length; i < il; i++) {
        group.add(meshes[i]);
      }

      return group;
    });
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
   */
  loadCamera(cameraIndex: number): Promise<Camera> {
    let camera;
    const cameraDef = this.json.cameras[cameraIndex];
    const params = cameraDef[cameraDef.type];

    if (!params) {
      console.warn("THREE.GLTFLoader: Missing camera parameters.");
      return;
    }

    if (cameraDef.type === "perspective") {
      camera = new PerspectiveCamera(
        MathUtils.radToDeg(params.yfov),
        params.aspectRatio || 1,
        params.znear || 1,
        params.zfar || 2e6
      );
    } else if (cameraDef.type === "orthographic") {
      camera = new OrthographicCamera(
        -params.xmag,
        params.xmag,
        params.ymag,
        -params.ymag,
        params.znear,
        params.zfar
      );
    }

    if (cameraDef.name) camera.name = this.createUniqueName(cameraDef.name);

    assignExtrasToUserData(camera, cameraDef);

    return Promise.resolve(camera);
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
   */
  loadSkin(skinIndex: number): Promise<any> {
    const skinDef = this.json.skins[skinIndex];

    const skinEntry: any = {joints: skinDef.joints};

    if (skinDef.inverseBindMatrices === undefined) {
      return Promise.resolve(skinEntry);
    }

    return this.getDependency("accessor", skinDef.inverseBindMatrices).then(
      accessor => {
        skinEntry.inverseBindMatrices = accessor;

        return skinEntry;
      }
    );
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
   */
  loadAnimation(animationIndex: number): Promise<AnimationClip> {
    const json = this.json;

    const animationDef = json.animations[animationIndex];

    const pendingNodes = [];
    const pendingInputAccessors = [];
    const pendingOutputAccessors = [];
    const pendingSamplers = [];
    const pendingTargets = [];

    for (let i = 0, il = animationDef.channels.length; i < il; i++) {
      const channel = animationDef.channels[i];
      const sampler = animationDef.samplers[channel.sampler];
      const target = channel.target;
      const name = target.node;
      const input =
        animationDef.parameters !== undefined
          ? animationDef.parameters[sampler.input]
          : sampler.input;
      const output =
        animationDef.parameters !== undefined
          ? animationDef.parameters[sampler.output]
          : sampler.output;

      pendingNodes.push(this.getDependency("node", name));
      pendingInputAccessors.push(this.getDependency("accessor", input));
      pendingOutputAccessors.push(this.getDependency("accessor", output));
      pendingSamplers.push(sampler);
      pendingTargets.push(target);
    }

    return Promise.all([
      Promise.all(pendingNodes),
      Promise.all(pendingInputAccessors),
      Promise.all(pendingOutputAccessors),
      Promise.all(pendingSamplers),
      Promise.all(pendingTargets),
    ]).then(dependencies => {
      const nodes = dependencies[0];
      const inputAccessors = dependencies[1];
      const outputAccessors = dependencies[2];
      const samplers = dependencies[3];
      const targets = dependencies[4];

      const tracks = [];

      for (let i = 0, il = nodes.length; i < il; i++) {
        const node = nodes[i];
        const inputAccessor = inputAccessors[i];
        const outputAccessor = outputAccessors[i];
        const sampler = samplers[i];
        const target = targets[i];

        if (node === undefined) continue;

        node.updateMatrix();
        node.matrixAutoUpdate = true;

        let TypedKeyframeTrack;

        switch (PATH_PROPERTIES[target.path]) {
          case PATH_PROPERTIES.weights:
            TypedKeyframeTrack = NumberKeyframeTrack;
            break;

          case PATH_PROPERTIES.rotation:
            TypedKeyframeTrack = QuaternionKeyframeTrack;
            break;

          case PATH_PROPERTIES.translation:
          case PATH_PROPERTIES.scale:
          default:
            TypedKeyframeTrack = VectorKeyframeTrack;
            break;
        }

        const targetName = node.name ? node.name : node.uuid;

        const interpolation =
          sampler.interpolation !== undefined
            ? INTERPOLATION[sampler.interpolation]
            : InterpolateLinear;

        const targetNames = [];

        if (PATH_PROPERTIES[target.path] === PATH_PROPERTIES.weights) {
          node.traverse((object) => {
            if (object.morphTargetInfluences) {
              targetNames.push(object.name ? object.name : object.uuid);
            }
          });
        } else {
          targetNames.push(targetName);
        }

        let outputArray = outputAccessor.array;

        if (outputAccessor.normalized) {
          const scale = getNormalizedComponentScale(outputArray.constructor);
          const scaled = new Float32Array(outputArray.length);

          for (let j = 0, jl = outputArray.length; j < jl; j++) {
            scaled[j] = outputArray[j] * scale;
          }

          outputArray = scaled;
        }

        for (let j = 0, jl = targetNames.length; j < jl; j++) {
          const track = new TypedKeyframeTrack(
            targetNames[j] + "." + PATH_PROPERTIES[target.path],
            inputAccessor.array,
            outputArray,
            interpolation
          );

          // Override interpolation with custom factory method.
          if (sampler.interpolation === "CUBICSPLINE") {
            track.createInterpolant =
              function InterpolantFactoryMethodGLTFCubicSpline(result) {
                // A CUBICSPLINE keyframe in glTF has three output values for each input value,
                // representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
                // must be divided by three to get the interpolant's sampleSize argument.

                const interpolantType =
                  this instanceof QuaternionKeyframeTrack
                    ? GLTFCubicSplineQuaternionInterpolant
                    : GLTFCubicSplineInterpolant;

                return new interpolantType(
                  this.times,
                  this.values,
                  this.getValueSize() / 3,
                  result
                );
              };

            // Mark as CUBICSPLINE. `track.getInterpolation()` doesn't support custom interpolants.
            track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline =
              true;
          }

          tracks.push(track);
        }
      }

      const name = animationDef.name
        ? animationDef.name
        : "animation_" + animationIndex;

      return new AnimationClip(name, undefined, tracks);
    });
  }

  createNodeMesh(nodeIndex) {
    const json = this.json;
    const nodeDef = json.nodes[nodeIndex];

    if (nodeDef.mesh === undefined) return null;

    return this.getDependency("mesh", nodeDef.mesh).then((mesh) => {
      const node = this._getNodeRef(this.meshCache, nodeDef.mesh, mesh);

      // if weights are provided on the node, override weights on the mesh.
      if (nodeDef.weights !== undefined) {
        node.traverse(o => {
          if (!o.isMesh) return;

          for (let i = 0, il = nodeDef.weights.length; i < il; i++) {
            o.morphTargetInfluences[i] = nodeDef.weights[i];
          }
        });
      }

      return node;
    });
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
   */
  loadNode(nodeIndex: number): Promise<Object3D> {
    const json = this.json;
    const extensions = this.extensions;

    const nodeDef = json.nodes[nodeIndex];

    // reserve node's name before its dependencies, so the root has the intended name.
    const nodeName = nodeDef.name ? this.createUniqueName(nodeDef.name) : "";

    return (() => {
      const pending = [];

      const meshPromise = this._invokeOne((ext) => ext.createNodeMesh && ext.createNodeMesh(nodeIndex));

      if (meshPromise) {
        pending.push(meshPromise);
      }

      if (nodeDef.camera !== undefined) {
        pending.push(
          this
            .getDependency("camera", nodeDef.camera)
            .then((camera) => this._getNodeRef(
                this.cameraCache,
                nodeDef.camera,
                camera
              ))
        );
      }

      this
        ._invokeAll(ext => {
          return (
            ext.createNodeAttachment && ext.createNodeAttachment(nodeIndex)
          );
        })
        .forEach(promise => {
          pending.push(promise);
        });

      return Promise.all(pending);
    })().then(objects => {
      let node;

      // .isBone isn't in glTF spec. See ._markDefs
      if (nodeDef.isBone === true) {
        node = new Bone();
      } else if (objects.length > 1) {
        node = new Group();
      } else if (objects.length === 1) {
        node = objects[0];
      } else {
        node = new Object3D();
      }

      if (node !== objects[0]) {
        for (let i = 0, il = objects.length; i < il; i++) {
          node.add(objects[i]);
        }
      }

      if (nodeDef.name) {
        node.userData.name = nodeDef.name;
        node.name = nodeName;
      }

      assignExtrasToUserData(node, nodeDef);

      if (nodeDef.extensions)
        addUnknownExtensionsToUserData(extensions, node, nodeDef);

      if (nodeDef.matrix !== undefined) {
        const matrix = new Matrix4();
        matrix.fromArray(nodeDef.matrix);
        node.applyMatrix4(matrix);
      } else {
        if (nodeDef.translation !== undefined) {
          node.position.fromArray(nodeDef.translation);
        }

        if (nodeDef.rotation !== undefined) {
          node.quaternion.fromArray(nodeDef.rotation);
        }

        if (nodeDef.scale !== undefined) {
          node.scale.fromArray(nodeDef.scale);
        }
      }

      if (!this.associations.has(node)) {
        this.associations.set(node, {});
      }

      this.associations.get(node).nodes = nodeIndex;

      return node;
    });
  }

  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
   */
  loadScene(sceneIndex: number): Promise<Group> {
    const json = this.json;
    const extensions = this.extensions;
    const sceneDef = this.json.scenes[sceneIndex];

    // Loader returns Group, not Scene.
    // See: https://github.com/mrdoob/three.js/issues/18342#issuecomment-578981172
    const scene = new Group();
    if (sceneDef.name) scene.name = this.createUniqueName(sceneDef.name);

    assignExtrasToUserData(scene, sceneDef);

    if (sceneDef.extensions)
      addUnknownExtensionsToUserData(extensions, scene, sceneDef);

    const nodeIds = sceneDef.nodes || [];

    const pending = [];

    for (let i = 0, il = nodeIds.length; i < il; i++) {
      pending.push(buildNodeHierarchy(nodeIds[i], scene, json, this));
    }

    return Promise.all(pending).then(() => {
      // Removes dangling associations, associations that reference a node that
      // didn't make it into the scene.
      const reduceAssociations = node => {
        const reducedAssociations = new Map();

        for (const [key, value] of this.associations) {
          if (key instanceof Material || key instanceof Texture) {
            reducedAssociations.set(key, value);
          }
        }

        node.traverse(node => {
          const mappings = this.associations.get(node);

          if (mappings != null) {
            reducedAssociations.set(node, mappings);
          }
        });

        return reducedAssociations;
      };

      this.associations = reduceAssociations(scene);

      return scene;
    });
  }
}

function buildNodeHierarchy(nodeId, parentObject, json, parser) {
  const nodeDef = json.nodes[nodeId];

  return parser
    .getDependency("node", nodeId)
    .then(node => {
      if (nodeDef.skin === undefined) return node;

      // build skeleton here as well

      let skinEntry;

      return parser
        .getDependency("skin", nodeDef.skin)
        .then(skin => {
          skinEntry = skin;

          const pendingJoints = [];

          for (let i = 0, il = skinEntry.joints.length; i < il; i++) {
            pendingJoints.push(
              parser.getDependency("node", skinEntry.joints[i])
            );
          }

          return Promise.all(pendingJoints);
        })
        .then(jointNodes => {
          node.traverse(mesh => {
            if (!mesh.isMesh) return;

            const bones = [];
            const boneInverses = [];

            for (let j = 0, jl = jointNodes.length; j < jl; j++) {
              const jointNode = jointNodes[j];

              if (jointNode) {
                bones.push(jointNode);

                const mat = new Matrix4();

                if (skinEntry.inverseBindMatrices !== undefined) {
                  mat.fromArray(skinEntry.inverseBindMatrices.array, j * 16);
                }

                boneInverses.push(mat);
              } else {
                console.warn(
                  'THREE.GLTFLoader: Joint "%s" could not be found.',
                  skinEntry.joints[j]
                );
              }
            }

            mesh.bind(new Skeleton(bones, boneInverses), mesh.matrixWorld);
          });

          return node;
        });
    })
    .then(node => {
      // build node hierachy

      parentObject.add(node);

      const pending = [];

      if (nodeDef.children) {
        const children = nodeDef.children;

        for (let i = 0, il = children.length; i < il; i++) {
          const child = children[i];
          pending.push(buildNodeHierarchy(child, node, json, parser));
        }
      }

      return Promise.all(pending);
    });
}

/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 */
function computeBounds(geometry, primitiveDef, parser) {
  const attributes = primitiveDef.attributes;

  const box = new Box3();

  if (attributes.POSITION !== undefined) {
    const accessor = parser.json.accessors[attributes.POSITION];

    const min = accessor.min;
    const max = accessor.max;

    // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

    if (min !== undefined && max !== undefined) {
      box.set(
        new Vector3(min[0], min[1], min[2]),
        new Vector3(max[0], max[1], max[2])
      );

      if (accessor.normalized) {
        const boxScale = getNormalizedComponentScale(
          WEBGL_COMPONENT_TYPES[accessor.componentType]
        );
        box.min.multiplyScalar(boxScale);
        box.max.multiplyScalar(boxScale);
      }
    } else {
      console.warn(
        "THREE.GLTFLoader: Missing min/max properties for accessor POSITION."
      );

      return;
    }
  } else {
    return;
  }

  const targets = primitiveDef.targets;

  if (targets !== undefined) {
    const maxDisplacement = new Vector3();
    const vector = new Vector3();

    for (let i = 0, il = targets.length; i < il; i++) {
      const target = targets[i];

      if (target.POSITION !== undefined) {
        const accessor = parser.json.accessors[target.POSITION];
        const min = accessor.min;
        const max = accessor.max;

        // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

        if (min !== undefined && max !== undefined) {
          // we need to get max of absolute components because target weight is [-1,1]
          vector.setX(Math.max(Math.abs(min[0]), Math.abs(max[0])));
          vector.setY(Math.max(Math.abs(min[1]), Math.abs(max[1])));
          vector.setZ(Math.max(Math.abs(min[2]), Math.abs(max[2])));

          if (accessor.normalized) {
            const boxScale = getNormalizedComponentScale(
              WEBGL_COMPONENT_TYPES[accessor.componentType]
            );
            vector.multiplyScalar(boxScale);
          }

          // Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
          // to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
          // are used to implement key-frame animations and as such only two are active at a time - this results in very large
          // boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.
          maxDisplacement.max(vector);
        } else {
          console.warn(
            "THREE.GLTFLoader: Missing min/max properties for accessor POSITION."
          );
        }
      }
    }

    // As per comment above this box isn't conservative, but has a reasonable size for a very large number of morph targets.
    box.expandByVector(maxDisplacement);
  }

  geometry.boundingBox = box;

  const sphere = new Sphere();

  box.getCenter(sphere.center);
  sphere.radius = box.min.distanceTo(box.max) / 2;

  geometry.boundingSphere = sphere;
}

function addPrimitiveAttributes(
  geometry: BufferGeometry,
  primitiveDef,
  parser: GLTFParser
): Promise<BufferGeometry> {
  const attributes = primitiveDef.attributes;

  const pending = [];

  function assignAttributeAccessor(accessorIndex, attributeName) {
    return parser.getDependency("accessor", accessorIndex).then(accessor => {
      geometry.setAttribute(attributeName, accessor);
    });
  }

  for (const gltfAttributeName in attributes) {
    const threeAttributeName =
      ATTRIBUTES[gltfAttributeName] || gltfAttributeName.toLowerCase();

    // Skip attributes already provided by e.g. Draco extension.
    if (threeAttributeName in geometry.attributes) continue;

    pending.push(
      assignAttributeAccessor(attributes[gltfAttributeName], threeAttributeName)
    );
  }

  if (primitiveDef.indices !== undefined && !geometry.index) {
    const accessor = parser
      .getDependency("accessor", primitiveDef.indices)
      .then(accessor => {
        // @ts-ignore
        geometry.setIndex(accessor);
      });

    pending.push(accessor);
  }

  assignExtrasToUserData(geometry, primitiveDef);

  computeBounds(geometry, primitiveDef, parser);

  return Promise.all(pending).then(() => {
    return primitiveDef.targets !== undefined
      ? addMorphTargets(geometry, primitiveDef.targets, parser)
      : geometry;
  });
}

function toTrianglesDrawMode(
  geometry: BufferGeometry,
  drawMode: number
): BufferGeometry {
  let index = geometry.getIndex();

  // generate index if not present

  if (index === null) {
    const indices = [];

    const position = geometry.getAttribute("position");

    if (position !== undefined) {
      for (let i = 0; i < position.count; i++) {
        indices.push(i);
      }

      geometry.setIndex(indices);
      index = geometry.getIndex();
    } else {
      console.error(
        "THREE.GLTFLoader.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."
      );
      return geometry;
    }
  }

  //

  const numberOfTriangles = index.count - 2;
  const newIndices = [];

  if (drawMode === TriangleFanDrawMode) {
    // gl.TRIANGLE_FAN

    for (let i = 1; i <= numberOfTriangles; i++) {
      newIndices.push(index.getX(0));
      newIndices.push(index.getX(i));
      newIndices.push(index.getX(i + 1));
    }
  } else {
    // gl.TRIANGLE_STRIP

    for (let i = 0; i < numberOfTriangles; i++) {
      if (i % 2 === 0) {
        newIndices.push(index.getX(i));
        newIndices.push(index.getX(i + 1));
        newIndices.push(index.getX(i + 2));
      } else {
        newIndices.push(index.getX(i + 2));
        newIndices.push(index.getX(i + 1));
        newIndices.push(index.getX(i));
      }
    }
  }

  if (newIndices.length / 3 !== numberOfTriangles) {
    console.error(
      "THREE.GLTFLoader.toTrianglesDrawMode(): Unable to generate correct amount of triangles."
    );
  }

  // build final geometry

  const newGeometry = geometry.clone();
  newGeometry.setIndex(newIndices);

  return newGeometry;
}
