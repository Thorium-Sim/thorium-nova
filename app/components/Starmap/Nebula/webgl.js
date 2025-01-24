/*...........................................................................*/
export function buildAttribs(gl, layout) {
	var attribs = {};
	for (var key in layout) {
		attribs[key] = {
			buffer: new GLBuffer(gl),
			size: layout[key],
		};
	}
	return attribs;
}

/*...........................................................................*/
export function getExtensions(gl, extArray) {
	var ext = {};
	for (var i = 0; i < extArray.length; i++) {
		var e = gl.getExtension(extArray[i]);
		if (e === null) {
			throw "Extension " + extArray[i] + " not available.";
		}
		ext[extArray[i]] = e;
	}
	return ext;
}

/*...........................................................................*/
export function Framebuffer(gl, color, depth, ext) {
	this.initialize = () => {
		this.fb = gl.createFramebuffer();
		this.bind();
		if (color.length > 1) {
			var drawBuffers = [];
			for (let i = 0; i < color.length; i++) {
				drawBuffers.push(ext["COLOR_ATTACHMENT" + i + "_WEBGL"]);
			}
			ext.drawBuffersWEBGL(drawBuffers);
			for (let i = 0; i < color.length; i++) {
				gl.framebufferTexture2D(
					gl.FRAMEBUFFER,
					ext["COLOR_ATTACHMENT" + i + "_WEBGL"],
					gl.TEXTURE_2D,
					color[i].texture,
					0,
				);
			}
		} else {
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_2D,
				color[0].texture,
				0,
			);
		}
		if (depth !== undefined) {
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.DEPTH_ATTACHMENT,
				gl.TEXTURE_2D,
				depth.texture,
				0,
			);
		}
	};

	this.bind = () => {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
	};

	this.initialize();
}

/*...........................................................................*/
export function Texture(gl, index, data, width, height, options) {
	options = options || {};
	options.target = options.target || gl.TEXTURE_2D;
	options.mag = options.mag || gl.NEAREST;
	options.min = options.min || gl.NEAREST;
	options.wraps = options.wraps || gl.CLAMP_TO_EDGE;
	options.wrapt = options.wrapt || gl.CLAMP_TO_EDGE;
	options.internalFormat = options.internalFormat || gl.RGBA;
	options.format = options.format || gl.RGBA;
	options.type = options.type || gl.UNSIGNED_BYTE;

	this.initialize = () => {
		this.index = index;
		this.activate();
		this.texture = gl.createTexture();
		this.bind();
		gl.texImage2D(
			options.target,
			0,
			options.internalFormat,
			options.format,
			options.type,
			data,
		);
		gl.texParameteri(options.target, gl.TEXTURE_MAG_FILTER, options.mag);
		gl.texParameteri(options.target, gl.TEXTURE_MIN_FILTER, options.min);
		gl.texParameteri(options.target, gl.TEXTURE_WRAP_S, options.wraps);
		gl.texParameteri(options.target, gl.TEXTURE_WRAP_T, options.wrapt);
		if (options.mag !== gl.NEAREST || options.min !== gl.NEAREST) {
			gl.generateMipmap(options.target);
		}
	};

	this.bind = () => {
		gl.bindTexture(options.target, this.texture);
	};

	this.activate = () => {
		gl.activeTexture(gl.TEXTURE0 + this.index);
	};

	this.reset = () => {
		this.activate();
		this.bind();
		gl.texImage2D(
			options.target,
			0,
			options.internalFormat,
			width,
			height,
			0,
			options.format,
			options.type,
			data,
		);
	};

	this.initialize();
}

/*...........................................................................*/
export function GLBuffer(gl) {
	this.initialize = () => {
		this.buffer = gl.createBuffer();
	};

	this.bind = () => {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	};

	this.set = (data) => {
		this.bind();
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	};

	this.initialize();
}

/*...........................................................................*/
export function Renderable(gl, program, buffers, primitiveCount) {
	this.primitiveCount = primitiveCount;

	this.initialize = () => {};

	this.render = () => {
		program.use();
		for (const name in buffers) {
			var buffer = buffers[name].buffer;
			var size = buffers[name].size;
			var location = program.attribs[name].location;
			buffer.bind();
			gl.enableVertexAttribArray(location);
			gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
		}
		gl.drawArrays(gl.TRIANGLES, 0, 3 * primitiveCount);
		for (const name in this.buffers) {
			gl.disableVertexAttribArray(program.attributes[name].location);
		}
	};

	this.initialize();
}

/*...........................................................................*/
export function InstancedRenderable(
	gl,
	program,
	buffers,
	primitiveCount,
	instancedExt,
) {
	this.initialize = () => {};

	this.render = () => {
		program.use();
		for (const name in buffers) {
			var buffer = buffers[name].buffer;
			var size = buffers[name].size;
			var location = program.attribs[name].location;
			buffer.bind();
			gl.enableVertexAttribArray(location);
			gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
			instancedExt.vertexAttribDivisorANGLE(location, buffers[name].divisor);
		}
		instancedExt.drawArraysInstancedANGLE(
			gl.TRIANGLES,
			0,
			6 * 2 * 3,
			primitiveCount,
		);
		for (const name in this.buffers) {
			gl.disableVertexAttribArray(program.attributes[name].location);
		}
	};

	this.initialize();
}

export class Program {
	constructor(gl, vertexSource, fragmentSource) {
		this.gl = gl;
		this.program = this.compileProgram(vertexSource, fragmentSource);
		this.attribs = this.gatherAttribs();
		this.uniforms = this.gatherUniforms();
	}
	use() {
		this.gl.useProgram(this.program);
	}

	compileProgram(vertexSource, fragmentSource) {
		var vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
		var fragmentShader = this.compileShader(
			fragmentSource,
			this.gl.FRAGMENT_SHADER,
		);
		var program = this.gl.createProgram();
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);
		if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			throw "Failed to compile program.";
		}
		return program;
	}

	compileShader(source, type) {
		var shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			var err = this.gl.getShaderInfoLog(shader);
			var lineno = Number.parseInt(err.split(":")[2]);
			var split = source.split("\n");
			for (var i in split) {
				// eslint-disable-next-line
				var q = Number.parseInt(i);
				if (i === lineno - 1) {
					console.warn(err);
				}
			}
			const typeString = type === this.gl.VERTEX_SHADER ? "vertex" : "fragment";
			throw "Failed to compile " + typeString + " shader.";
		}
		return shader;
	}

	setUniform(name, type) {
		var args = Array.prototype.slice.call(arguments, 2);
		this.use(); // Make this idempotent. At the context level, perhaps?

		var location = this.uniforms[name].location;
		this.gl["uniform" + type].apply(this.gl, [location].concat(args));
	}

	gatherUniforms() {
		var uniforms = {};
		var nUniforms = this.gl.getProgramParameter(
			this.program,
			this.gl.ACTIVE_UNIFORMS,
		);
		for (var i = 0; i < nUniforms; i++) {
			var uniform = this.gl.getActiveUniform(this.program, i);
			uniforms[uniform.name] = {
				name: uniform.name,
				location: this.gl.getUniformLocation(this.program, uniform.name),
				type: uniform.type,
				size: uniform.size,
			};
		}
		return uniforms;
	}

	gatherAttribs() {
		var attribs = {};
		var nAttribs = this.gl.getProgramParameter(
			this.program,
			this.gl.ACTIVE_ATTRIBUTES,
		);
		for (var i = 0; i < nAttribs; i++) {
			var attrib = this.gl.getActiveAttrib(this.program, i);
			attribs[attrib.name] = {
				name: attrib.name,
				location: this.gl.getAttribLocation(this.program, attrib.name),
				type: attrib.type,
				size: attrib.size,
			};
		}
		return attribs;
	}
}
