/* istanbul ignore file */
import * as glm from "gl-matrix";
import rng from "rng";

const webgl = {
  /*...........................................................................*/
  buildAttribs: function buildAttribs(gl, layout) {
    var attribs = {};
    for (var key in layout) {
      attribs[key] = {
        buffer: new webgl.GLBuffer(gl),
        size: layout[key],
      };
    }
    return attribs;
  },

  /*...........................................................................*/
  getExtensions: function getExtensions(gl, extArray) {
    var ext = {};
    for (var i = 0; i < extArray.length; i++) {
      var e = gl.getExtension(extArray[i]);
      if (e === null) {
        throw new Error("Extension " + extArray[i] + " not available.");
      }
      ext[extArray[i]] = e;
    }
    return ext;
  },

  /*...........................................................................*/
  Framebuffer: function Framebuffer(gl, color, depth, ext) {
    var self = this;

    self.initialize = function () {
      self.fb = gl.createFramebuffer();
      self.bind();
      if (color.length > 1) {
        var drawBuffers = [];
        for (var i = 0; i < color.length; i++) {
          drawBuffers.push(ext["COLOR_ATTACHMENT" + i + "_WEBGL"]);
        }
        ext.drawBuffersWEBGL(drawBuffers);
        for (let i = 0; i < color.length; i++) {
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            ext["COLOR_ATTACHMENT" + i + "_WEBGL"],
            gl.TEXTURE_2D,
            color[i].texture,
            0
          );
        }
      } else {
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          color[0].texture,
          0
        );
      }
      if (depth !== undefined) {
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.DEPTH_ATTACHMENT,
          gl.TEXTURE_2D,
          depth.texture,
          0
        );
      }
    };

    self.bind = function () {
      gl.bindFramebuffer(gl.FRAMEBUFFER, self.fb);
    };

    self.initialize();
  },

  /*...........................................................................*/
  Texture: function Texture(gl, index, data, width, height, options) {
    options = options || {};
    options.target = options.target || gl.TEXTURE_2D;
    options.mag = options.mag || gl.NEAREST;
    options.min = options.min || gl.NEAREST;
    options.wraps = options.wraps || gl.CLAMP_TO_EDGE;
    options.wrapt = options.wrapt || gl.CLAMP_TO_EDGE;
    options.internalFormat = options.internalFormat || gl.RGBA;
    options.format = options.format || gl.RGBA;
    options.type = options.type || gl.UNSIGNED_BYTE;

    var self = this;

    self.initialize = function () {
      self.index = index;
      self.activate();
      self.texture = gl.createTexture();
      self.bind();
      gl.texImage2D(
        options.target,
        0,
        options.internalFormat,
        options.format,
        options.type,
        data
      );
      gl.texParameteri(options.target, gl.TEXTURE_MAG_FILTER, options.mag);
      gl.texParameteri(options.target, gl.TEXTURE_MIN_FILTER, options.min);
      gl.texParameteri(options.target, gl.TEXTURE_WRAP_S, options.wraps);
      gl.texParameteri(options.target, gl.TEXTURE_WRAP_T, options.wrapt);
      if (options.mag !== gl.NEAREST || options.min !== gl.NEAREST) {
        gl.generateMipmap(options.target);
      }
    };

    self.bind = function () {
      gl.bindTexture(options.target, self.texture);
    };

    self.activate = function () {
      gl.activeTexture(gl.TEXTURE0 + self.index);
    };

    self.reset = function () {
      self.activate();
      self.bind();
      gl.texImage2D(
        options.target,
        0,
        options.internalFormat,
        width,
        height,
        0,
        options.format,
        options.type,
        data
      );
    };

    self.initialize();
  },

  /*...........................................................................*/
  GLBuffer: function GLBuffer(gl) {
    var self = this;

    self.initialize = function () {
      self.buffer = gl.createBuffer();
    };

    self.bind = function () {
      gl.bindBuffer(gl.ARRAY_BUFFER, self.buffer);
    };

    self.set = function (data) {
      self.bind();
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    };

    self.initialize();
  },

  /*...........................................................................*/
  Renderable: function Renderable(gl, program, buffers, primitiveCount) {
    var self = this;

    self.primitiveCount = primitiveCount;

    self.initialize = function () {};

    self.render = function () {
      program.use();
      for (let name in buffers) {
        var buffer = buffers[name].buffer;
        var size = buffers[name].size;
        try {
          var location = program.attribs[name].location;
        } catch (e) {
          console.error("Could not find location for", name);
          throw e;
        }
        buffer.bind();
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3 * primitiveCount);
      for (let name in self.buffers) {
        gl.disableVertexAttribArray(program.attributes[name].location);
      }
    };

    self.initialize();
  },

  /*...........................................................................*/
  InstancedRenderable: function InstancedRenderable(
    gl,
    program,
    buffers,
    primitiveCount,
    instancedExt
  ) {
    var self = this;

    self.initialize = function () {};

    self.render = function () {
      program.use();
      for (let name in buffers) {
        var buffer = buffers[name].buffer;
        var size = buffers[name].size;
        try {
          var location = program.attribs[name].location;
        } catch (e) {
          console.error("Could not find location for", name);
          throw e;
        }
        buffer.bind();
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        instancedExt.vertexAttribDivisorANGLE(location, buffers[name].divisor);
      }
      instancedExt.drawArraysInstancedANGLE(
        gl.TRIANGLES,
        0,
        6 * 2 * 3,
        primitiveCount
      );
      for (let name in self.buffers) {
        gl.disableVertexAttribArray(program.attributes[name].location);
      }
    };

    self.initialize();
  },
  /*...........................................................................*/
  Program: function Program(gl, vertexSource, fragmentSource) {
    var self = this;

    self.initialize = function () {
      self.program = self.compileProgram(vertexSource, fragmentSource);
      self.attribs = self.gatherAttribs();
      self.uniforms = self.gatherUniforms();
    };

    self.use = function () {
      gl.useProgram(self.program);
    };

    self.compileProgram = function (vertexSource, fragmentSource) {
      var vertexShader = self.compileShader(vertexSource, gl.VERTEX_SHADER);
      var fragmentShader = self.compileShader(
        fragmentSource,
        gl.FRAGMENT_SHADER
      );
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        throw new Error("Failed to compile program.");
      }
      return program;
    };

    self.compileShader = function (source, type) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var err = gl.getShaderInfoLog(shader);
        var lineno = parseInt(err.split(":")[2], 10);
        var split = source.split("\n");
        for (var i in split) {
          var q = parseInt(i, 10);
          console.info(q + "  " + split[i]);

          if (i === lineno - 1) {
            console.warn(err);
          }
        }
        let typeString = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
        throw new Error("Failed to compile " + typeString + " shader.");
      }
      return shader;
    };

    self.setUniform = function (name, type) {
      var args = Array.prototype.slice.call(arguments, 2);
      self.use(); // Make this idempotent. At the context level, perhaps?
      try {
        var location = self.uniforms[name].location;
      } catch (e) {
        console.error(name);
        throw e;
      }
      gl["uniform" + type].apply(gl, [location].concat(args));
    };

    self.gatherUniforms = function () {
      var uniforms = {};
      var nUniforms = gl.getProgramParameter(self.program, gl.ACTIVE_UNIFORMS);
      for (var i = 0; i < nUniforms; i++) {
        var uniform = gl.getActiveUniform(self.program, i);
        uniforms[uniform.name] = {
          name: uniform.name,
          location: gl.getUniformLocation(self.program, uniform.name),
          type: uniform.type,
          size: uniform.size,
        };
      }
      return uniforms;
    };

    self.gatherAttribs = function () {
      var attribs = {};
      var nAttribs = gl.getProgramParameter(self.program, gl.ACTIVE_ATTRIBUTES);
      for (var i = 0; i < nAttribs; i++) {
        var attrib = gl.getActiveAttrib(self.program, i);
        attribs[attrib.name] = {
          name: attrib.name,
          location: gl.getAttribLocation(self.program, attrib.name),
          type: attrib.type,
          size: attrib.size,
        };
      }
      return attribs;
    };

    /*...........................................................................*/
    self.initialize();
  },

  /*...........................................................................*/
};

export default function generateTexture(seed) {
  var self = {};
  self.initialize = function () {
    // Initialize the offscreen rendering canvas.
    self.canvas = document.createElement("canvas");

    // Initialize the gl context.
    self.gl = self.canvas.getContext("webgl");
    self.gl.enable(self.gl.BLEND);
    self.gl.blendFuncSeparate(
      self.gl.SRC_ALPHA,
      self.gl.ONE_MINUS_SRC_ALPHA,
      self.gl.ZERO,
      self.gl.ONE
    );

    // Load the programs.
    self.pNebula = loadProgram(
      self.gl,
      `#version 100
      precision highp float;
      
      uniform mat4 uModel;
      uniform mat4 uView;
      uniform mat4 uProjection;
      
      attribute vec3 aPosition;
      varying vec3 pos;
      
      void main() {
          gl_Position = uProjection * uView * uModel * vec4(aPosition, 1);
          pos = (uModel * vec4(aPosition, 1)).xyz;
      }
      
      
      __split__
      
      
      #version 100
      precision highp float;
      
      uniform vec3 uColor;
      uniform vec3 uOffset;
      uniform float uScale;
      uniform float uIntensity;
      uniform float uFalloff;
      
      varying vec3 pos;
      
      __noise4d__
      
      float noise(vec3 p) {
          return 0.5 * cnoise(vec4(p, 0)) + 0.5;
      }
      
      float nebula(vec3 p) {
          const int steps = 6;
          float scale = pow(2.0, float(steps));
          vec3 displace;
          for (int i = 0; i < steps; i++) {
              displace = vec3(
                  noise(p.xyz * scale + displace),
                  noise(p.yzx * scale + displace),
                  noise(p.zxy * scale + displace)
              );
              scale *= 0.5;
          }
          return noise(p * scale + displace);
      }
      
      void main() {
          vec3 posn = normalize(pos) * uScale;
          float c = min(1.0, nebula(posn + uOffset) * uIntensity);
          c = pow(c, uFalloff);
          gl_FragColor = vec4(uColor, c);
      
      }
      `
    );

    // Create the nebula renderables.
    self.rNebula = buildBox(self.gl, self.pNebula);
  };

  self.render = function (params) {
    // We'll be returning a map of direction to texture.
    var textures = {};

    // Handle changes to resolution.
    self.canvas.width = self.canvas.height = params.resolution;
    self.gl.viewport(0, 0, params.resolution, params.resolution);

    // Initialize the nebula parameters.
    var rand = new rng.MT(hashcode(params.seed) + 2000);
    var nebulaParams = [];
    while (params.nebulae) {
      nebulaParams.push({
        scale: rand.random() * 0.5 + 0.25,
        color: [rand.random(), rand.random(), rand.random()],
        intensity: rand.random() * 0.2 + 0.9,
        falloff: rand.random() * 3.0 + 3.0,
        offset: [
          rand.random() * 2000 - 1000,
          rand.random() * 2000 - 1000,
          rand.random() * 2000 - 1000,
        ],
      });
      if (rand.random() < 0.5) {
        break;
      }
    }

    // Create a list of directions we'll be iterating over.
    var dirs = {
      front: {
        target: [0, 0, -1],
        up: [0, 1, 0],
      },
      back: {
        target: [0, 0, 1],
        up: [0, 1, 0],
      },
      left: {
        target: [-1, 0, 0],
        up: [0, 1, 0],
      },
      right: {
        target: [1, 0, 0],
        up: [0, 1, 0],
      },
      top: {
        target: [0, 1, 0],
        up: [0, 0, 1],
      },
      bottom: {
        target: [0, -1, 0],
        up: [0, 0, -1],
      },
    };

    // Define and initialize the model, view, and projection matrices.
    var model = glm.mat4.create();
    var view = glm.mat4.create();
    var projection = glm.mat4.create();
    glm.mat4.perspective(projection, Math.PI / 2, 1.0, 0.1, 256);

    // Iterate over the directions to render and create the textures.
    var keys = Object.keys(dirs);
    for (var i = 0; i < keys.length; i++) {
      // Clear the context.
      self.gl.clearColor(0, 0, 0, 1);
      self.gl.clear(self.gl.COLOR_BUFFER_BIT);

      // Look in the direction for this texture.
      var dir = dirs[keys[i]];
      glm.mat4.lookAt(view, [0, 0, 0], dir.target, dir.up);

      // Render the nebulae.
      self.pNebula.use();
      model = glm.mat4.create();
      for (let j = 0; j < nebulaParams.length; j++) {
        var p = nebulaParams[j];
        self.pNebula.setUniform("uModel", "Matrix4fv", false, model);
        self.pNebula.setUniform("uView", "Matrix4fv", false, view);
        self.pNebula.setUniform("uProjection", "Matrix4fv", false, projection);
        self.pNebula.setUniform("uScale", "1f", p.scale);
        self.pNebula.setUniform("uColor", "3fv", p.color);
        self.pNebula.setUniform("uIntensity", "1f", p.intensity);
        self.pNebula.setUniform("uFalloff", "1f", p.falloff);
        self.pNebula.setUniform("uOffset", "3fv", p.offset);
        self.rNebula.render();
      }

      // Create the texture.
      var c = document.createElement("canvas");
      c.width = c.height = params.resolution;
      var ctx = c.getContext("2d");
      ctx.drawImage(self.canvas, 0, 0);
      textures[keys[i]] = c;
    }

    return textures;
  };

  self.initialize();
  return self.render({seed, resolution: 256, nebulae: true});
}

function buildBox(gl, program) {
  var position = [
    -1,
    -1,
    -1,
    1,
    -1,
    -1,
    1,
    1,
    -1,
    -1,
    -1,
    -1,
    1,
    1,
    -1,
    -1,
    1,
    -1,

    1,
    -1,
    1,
    -1,
    -1,
    1,
    -1,
    1,
    1,
    1,
    -1,
    1,
    -1,
    1,
    1,
    1,
    1,
    1,

    1,
    -1,
    -1,
    1,
    -1,
    1,
    1,
    1,
    1,
    1,
    -1,
    -1,
    1,
    1,
    1,
    1,
    1,
    -1,

    -1,
    -1,
    1,
    -1,
    -1,
    -1,
    -1,
    1,
    -1,
    -1,
    -1,
    1,
    -1,
    1,
    -1,
    -1,
    1,
    1,

    -1,
    1,
    -1,
    1,
    1,
    -1,
    1,
    1,
    1,
    -1,
    1,
    -1,
    1,
    1,
    1,
    -1,
    1,
    1,

    -1,
    -1,
    1,
    1,
    -1,
    1,
    1,
    -1,
    -1,
    -1,
    -1,
    1,
    1,
    -1,
    -1,
    -1,
    -1,
    -1,
  ];
  var attribs = webgl.buildAttribs(gl, {aPosition: 3});
  attribs.aPosition.buffer.set(new Float32Array(position));
  var count = position.length / 9;
  var renderable = new webgl.Renderable(gl, program, attribs, count);
  return renderable;
}

function hashcode(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash += (i + 1) * char;
  }
  return hash;
}

const noise4d = `//
// GLSL textureless classic 4D noise "cnoise",
// with an RSL-style periodic variant "pnoise".
// Author:  Stefan Gustavson (stefan.gustavson@liu.se)
// Version: 2011-08-22
//
// Many thanks to Ian McEwan of Ashima Arts for the
// ideas for permutation and gradient selection.
//
// Copyright (c) 2011 Stefan Gustavson. All rights reserved.
// Distributed under the MIT license. See LICENSE file.
// https://github.com/ashima/webgl-noise
//

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 fade(vec4 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float cnoise(vec4 P)
{
  vec4 Pi0 = floor(P); // Integer part for indexing
  vec4 Pi1 = Pi0 + 1.0; // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec4 Pf0 = fract(P); // Fractional part for interpolation
  vec4 Pf1 = Pf0 - 1.0; // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = vec4(Pi0.zzzz);
  vec4 iz1 = vec4(Pi1.zzzz);
  vec4 iw0 = vec4(Pi0.wwww);
  vec4 iw1 = vec4(Pi1.wwww);

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 ixy00 = permute(ixy0 + iw0);
  vec4 ixy01 = permute(ixy0 + iw1);
  vec4 ixy10 = permute(ixy1 + iw0);
  vec4 ixy11 = permute(ixy1 + iw1);

  vec4 gx00 = ixy00 * (1.0 / 7.0);
  vec4 gy00 = floor(gx00) * (1.0 / 7.0);
  vec4 gz00 = floor(gy00) * (1.0 / 6.0);
  gx00 = fract(gx00) - 0.5;
  gy00 = fract(gy00) - 0.5;
  gz00 = fract(gz00) - 0.5;
  vec4 gw00 = vec4(0.75) - abs(gx00) - abs(gy00) - abs(gz00);
  vec4 sw00 = step(gw00, vec4(0.0));
  gx00 -= sw00 * (step(0.0, gx00) - 0.5);
  gy00 -= sw00 * (step(0.0, gy00) - 0.5);

  vec4 gx01 = ixy01 * (1.0 / 7.0);
  vec4 gy01 = floor(gx01) * (1.0 / 7.0);
  vec4 gz01 = floor(gy01) * (1.0 / 6.0);
  gx01 = fract(gx01) - 0.5;
  gy01 = fract(gy01) - 0.5;
  gz01 = fract(gz01) - 0.5;
  vec4 gw01 = vec4(0.75) - abs(gx01) - abs(gy01) - abs(gz01);
  vec4 sw01 = step(gw01, vec4(0.0));
  gx01 -= sw01 * (step(0.0, gx01) - 0.5);
  gy01 -= sw01 * (step(0.0, gy01) - 0.5);

  vec4 gx10 = ixy10 * (1.0 / 7.0);
  vec4 gy10 = floor(gx10) * (1.0 / 7.0);
  vec4 gz10 = floor(gy10) * (1.0 / 6.0);
  gx10 = fract(gx10) - 0.5;
  gy10 = fract(gy10) - 0.5;
  gz10 = fract(gz10) - 0.5;
  vec4 gw10 = vec4(0.75) - abs(gx10) - abs(gy10) - abs(gz10);
  vec4 sw10 = step(gw10, vec4(0.0));
  gx10 -= sw10 * (step(0.0, gx10) - 0.5);
  gy10 -= sw10 * (step(0.0, gy10) - 0.5);

  vec4 gx11 = ixy11 * (1.0 / 7.0);
  vec4 gy11 = floor(gx11) * (1.0 / 7.0);
  vec4 gz11 = floor(gy11) * (1.0 / 6.0);
  gx11 = fract(gx11) - 0.5;
  gy11 = fract(gy11) - 0.5;
  gz11 = fract(gz11) - 0.5;
  vec4 gw11 = vec4(0.75) - abs(gx11) - abs(gy11) - abs(gz11);
  vec4 sw11 = step(gw11, vec4(0.0));
  gx11 -= sw11 * (step(0.0, gx11) - 0.5);
  gy11 -= sw11 * (step(0.0, gy11) - 0.5);

  vec4 g0000 = vec4(gx00.x,gy00.x,gz00.x,gw00.x);
  vec4 g1000 = vec4(gx00.y,gy00.y,gz00.y,gw00.y);
  vec4 g0100 = vec4(gx00.z,gy00.z,gz00.z,gw00.z);
  vec4 g1100 = vec4(gx00.w,gy00.w,gz00.w,gw00.w);
  vec4 g0010 = vec4(gx10.x,gy10.x,gz10.x,gw10.x);
  vec4 g1010 = vec4(gx10.y,gy10.y,gz10.y,gw10.y);
  vec4 g0110 = vec4(gx10.z,gy10.z,gz10.z,gw10.z);
  vec4 g1110 = vec4(gx10.w,gy10.w,gz10.w,gw10.w);
  vec4 g0001 = vec4(gx01.x,gy01.x,gz01.x,gw01.x);
  vec4 g1001 = vec4(gx01.y,gy01.y,gz01.y,gw01.y);
  vec4 g0101 = vec4(gx01.z,gy01.z,gz01.z,gw01.z);
  vec4 g1101 = vec4(gx01.w,gy01.w,gz01.w,gw01.w);
  vec4 g0011 = vec4(gx11.x,gy11.x,gz11.x,gw11.x);
  vec4 g1011 = vec4(gx11.y,gy11.y,gz11.y,gw11.y);
  vec4 g0111 = vec4(gx11.z,gy11.z,gz11.z,gw11.z);
  vec4 g1111 = vec4(gx11.w,gy11.w,gz11.w,gw11.w);

  vec4 norm00 = taylorInvSqrt(vec4(dot(g0000, g0000), dot(g0100, g0100), dot(g1000, g1000), dot(g1100, g1100)));
  g0000 *= norm00.x;
  g0100 *= norm00.y;
  g1000 *= norm00.z;
  g1100 *= norm00.w;

  vec4 norm01 = taylorInvSqrt(vec4(dot(g0001, g0001), dot(g0101, g0101), dot(g1001, g1001), dot(g1101, g1101)));
  g0001 *= norm01.x;
  g0101 *= norm01.y;
  g1001 *= norm01.z;
  g1101 *= norm01.w;

  vec4 norm10 = taylorInvSqrt(vec4(dot(g0010, g0010), dot(g0110, g0110), dot(g1010, g1010), dot(g1110, g1110)));
  g0010 *= norm10.x;
  g0110 *= norm10.y;
  g1010 *= norm10.z;
  g1110 *= norm10.w;

  vec4 norm11 = taylorInvSqrt(vec4(dot(g0011, g0011), dot(g0111, g0111), dot(g1011, g1011), dot(g1111, g1111)));
  g0011 *= norm11.x;
  g0111 *= norm11.y;
  g1011 *= norm11.z;
  g1111 *= norm11.w;

  float n0000 = dot(g0000, Pf0);
  float n1000 = dot(g1000, vec4(Pf1.x, Pf0.yzw));
  float n0100 = dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw));
  float n1100 = dot(g1100, vec4(Pf1.xy, Pf0.zw));
  float n0010 = dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w));
  float n1010 = dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w));
  float n0110 = dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w));
  float n1110 = dot(g1110, vec4(Pf1.xyz, Pf0.w));
  float n0001 = dot(g0001, vec4(Pf0.xyz, Pf1.w));
  float n1001 = dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w));
  float n0101 = dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w));
  float n1101 = dot(g1101, vec4(Pf1.xy, Pf0.z, Pf1.w));
  float n0011 = dot(g0011, vec4(Pf0.xy, Pf1.zw));
  float n1011 = dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw));
  float n0111 = dot(g0111, vec4(Pf0.x, Pf1.yzw));
  float n1111 = dot(g1111, Pf1);

  vec4 fade_xyzw = fade(Pf0);
  vec4 n_0w = mix(vec4(n0000, n1000, n0100, n1100), vec4(n0001, n1001, n0101, n1101), fade_xyzw.w);
  vec4 n_1w = mix(vec4(n0010, n1010, n0110, n1110), vec4(n0011, n1011, n0111, n1111), fade_xyzw.w);
  vec4 n_zw = mix(n_0w, n_1w, fade_xyzw.z);
  vec2 n_yzw = mix(n_zw.xy, n_zw.zw, fade_xyzw.y);
  float n_xyzw = mix(n_yzw.x, n_yzw.y, fade_xyzw.x);
  return 2.2 * n_xyzw;
}

// Classic Perlin noise, periodic version
float pnoise(vec4 P, vec4 rep)
{
  vec4 Pi0 = mod(floor(P), rep); // Integer part modulo rep
  vec4 Pi1 = mod(Pi0 + 1.0, rep); // Integer part + 1 mod rep
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec4 Pf0 = fract(P); // Fractional part for interpolation
  vec4 Pf1 = Pf0 - 1.0; // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = vec4(Pi0.zzzz);
  vec4 iz1 = vec4(Pi1.zzzz);
  vec4 iw0 = vec4(Pi0.wwww);
  vec4 iw1 = vec4(Pi1.wwww);

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 ixy00 = permute(ixy0 + iw0);
  vec4 ixy01 = permute(ixy0 + iw1);
  vec4 ixy10 = permute(ixy1 + iw0);
  vec4 ixy11 = permute(ixy1 + iw1);

  vec4 gx00 = ixy00 * (1.0 / 7.0);
  vec4 gy00 = floor(gx00) * (1.0 / 7.0);
  vec4 gz00 = floor(gy00) * (1.0 / 6.0);
  gx00 = fract(gx00) - 0.5;
  gy00 = fract(gy00) - 0.5;
  gz00 = fract(gz00) - 0.5;
  vec4 gw00 = vec4(0.75) - abs(gx00) - abs(gy00) - abs(gz00);
  vec4 sw00 = step(gw00, vec4(0.0));
  gx00 -= sw00 * (step(0.0, gx00) - 0.5);
  gy00 -= sw00 * (step(0.0, gy00) - 0.5);

  vec4 gx01 = ixy01 * (1.0 / 7.0);
  vec4 gy01 = floor(gx01) * (1.0 / 7.0);
  vec4 gz01 = floor(gy01) * (1.0 / 6.0);
  gx01 = fract(gx01) - 0.5;
  gy01 = fract(gy01) - 0.5;
  gz01 = fract(gz01) - 0.5;
  vec4 gw01 = vec4(0.75) - abs(gx01) - abs(gy01) - abs(gz01);
  vec4 sw01 = step(gw01, vec4(0.0));
  gx01 -= sw01 * (step(0.0, gx01) - 0.5);
  gy01 -= sw01 * (step(0.0, gy01) - 0.5);

  vec4 gx10 = ixy10 * (1.0 / 7.0);
  vec4 gy10 = floor(gx10) * (1.0 / 7.0);
  vec4 gz10 = floor(gy10) * (1.0 / 6.0);
  gx10 = fract(gx10) - 0.5;
  gy10 = fract(gy10) - 0.5;
  gz10 = fract(gz10) - 0.5;
  vec4 gw10 = vec4(0.75) - abs(gx10) - abs(gy10) - abs(gz10);
  vec4 sw10 = step(gw10, vec4(0.0));
  gx10 -= sw10 * (step(0.0, gx10) - 0.5);
  gy10 -= sw10 * (step(0.0, gy10) - 0.5);

  vec4 gx11 = ixy11 * (1.0 / 7.0);
  vec4 gy11 = floor(gx11) * (1.0 / 7.0);
  vec4 gz11 = floor(gy11) * (1.0 / 6.0);
  gx11 = fract(gx11) - 0.5;
  gy11 = fract(gy11) - 0.5;
  gz11 = fract(gz11) - 0.5;
  vec4 gw11 = vec4(0.75) - abs(gx11) - abs(gy11) - abs(gz11);
  vec4 sw11 = step(gw11, vec4(0.0));
  gx11 -= sw11 * (step(0.0, gx11) - 0.5);
  gy11 -= sw11 * (step(0.0, gy11) - 0.5);

  vec4 g0000 = vec4(gx00.x,gy00.x,gz00.x,gw00.x);
  vec4 g1000 = vec4(gx00.y,gy00.y,gz00.y,gw00.y);
  vec4 g0100 = vec4(gx00.z,gy00.z,gz00.z,gw00.z);
  vec4 g1100 = vec4(gx00.w,gy00.w,gz00.w,gw00.w);
  vec4 g0010 = vec4(gx10.x,gy10.x,gz10.x,gw10.x);
  vec4 g1010 = vec4(gx10.y,gy10.y,gz10.y,gw10.y);
  vec4 g0110 = vec4(gx10.z,gy10.z,gz10.z,gw10.z);
  vec4 g1110 = vec4(gx10.w,gy10.w,gz10.w,gw10.w);
  vec4 g0001 = vec4(gx01.x,gy01.x,gz01.x,gw01.x);
  vec4 g1001 = vec4(gx01.y,gy01.y,gz01.y,gw01.y);
  vec4 g0101 = vec4(gx01.z,gy01.z,gz01.z,gw01.z);
  vec4 g1101 = vec4(gx01.w,gy01.w,gz01.w,gw01.w);
  vec4 g0011 = vec4(gx11.x,gy11.x,gz11.x,gw11.x);
  vec4 g1011 = vec4(gx11.y,gy11.y,gz11.y,gw11.y);
  vec4 g0111 = vec4(gx11.z,gy11.z,gz11.z,gw11.z);
  vec4 g1111 = vec4(gx11.w,gy11.w,gz11.w,gw11.w);

  vec4 norm00 = taylorInvSqrt(vec4(dot(g0000, g0000), dot(g0100, g0100), dot(g1000, g1000), dot(g1100, g1100)));
  g0000 *= norm00.x;
  g0100 *= norm00.y;
  g1000 *= norm00.z;
  g1100 *= norm00.w;

  vec4 norm01 = taylorInvSqrt(vec4(dot(g0001, g0001), dot(g0101, g0101), dot(g1001, g1001), dot(g1101, g1101)));
  g0001 *= norm01.x;
  g0101 *= norm01.y;
  g1001 *= norm01.z;
  g1101 *= norm01.w;

  vec4 norm10 = taylorInvSqrt(vec4(dot(g0010, g0010), dot(g0110, g0110), dot(g1010, g1010), dot(g1110, g1110)));
  g0010 *= norm10.x;
  g0110 *= norm10.y;
  g1010 *= norm10.z;
  g1110 *= norm10.w;

  vec4 norm11 = taylorInvSqrt(vec4(dot(g0011, g0011), dot(g0111, g0111), dot(g1011, g1011), dot(g1111, g1111)));
  g0011 *= norm11.x;
  g0111 *= norm11.y;
  g1011 *= norm11.z;
  g1111 *= norm11.w;

  float n0000 = dot(g0000, Pf0);
  float n1000 = dot(g1000, vec4(Pf1.x, Pf0.yzw));
  float n0100 = dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw));
  float n1100 = dot(g1100, vec4(Pf1.xy, Pf0.zw));
  float n0010 = dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w));
  float n1010 = dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w));
  float n0110 = dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w));
  float n1110 = dot(g1110, vec4(Pf1.xyz, Pf0.w));
  float n0001 = dot(g0001, vec4(Pf0.xyz, Pf1.w));
  float n1001 = dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w));
  float n0101 = dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w));
  float n1101 = dot(g1101, vec4(Pf1.xy, Pf0.z, Pf1.w));
  float n0011 = dot(g0011, vec4(Pf0.xy, Pf1.zw));
  float n1011 = dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw));
  float n0111 = dot(g0111, vec4(Pf0.x, Pf1.yzw));
  float n1111 = dot(g1111, Pf1);

  vec4 fade_xyzw = fade(Pf0);
  vec4 n_0w = mix(vec4(n0000, n1000, n0100, n1100), vec4(n0001, n1001, n0101, n1101), fade_xyzw.w);
  vec4 n_1w = mix(vec4(n0010, n1010, n0110, n1110), vec4(n0011, n1011, n0111, n1111), fade_xyzw.w);
  vec4 n_zw = mix(n_0w, n_1w, fade_xyzw.z);
  vec2 n_yzw = mix(n_zw.xy, n_zw.zw, fade_xyzw.y);
  float n_xyzw = mix(n_yzw.x, n_yzw.y, fade_xyzw.x);
  return 2.2 * n_xyzw;
}
`;

function loadProgram(gl, source) {
  source = source.replace("__noise4d__", noise4d);
  source = source.split("__split__");
  var program = new webgl.Program(gl, source[0], source[1]);
  return program;
}
