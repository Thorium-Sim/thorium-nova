import {Component} from "react";
import {createRef} from "react";
import SimplexNoise from "./simplexNoise";

/**
 * Vector
 */
function Vector(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

Vector.add = function (a, b) {
  return new Vector(a.x + b.x, a.y + b.y);
};

Vector.sub = function (a, b) {
  return new Vector(a.x - b.x, a.y - b.y);
};

Vector.prototype = {
  set: function (x, y) {
    if (typeof x === "object") {
      y = x.y;
      x = x.x;
    }
    this.x = x || 0;
    this.y = y || 0;
    return this;
  },

  add: function (v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  },

  sub: function (v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  },

  scale: function (s) {
    this.x *= s;
    this.y *= s;
    return this;
  },

  length: function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  },

  normalize: function () {
    var len = Math.sqrt(this.x * this.x + this.y * this.y);
    if (len) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  },

  angle: function () {
    return Math.atan2(this.y, this.x);
  },

  distanceTo: function (v) {
    var dx = v.x - this.x,
      dy = v.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  distanceToSq: function (v) {
    var dx = v.x - this.x,
      dy = v.y - this.y;
    return dx * dx + dy * dy;
  },

  clone: function () {
    return new Vector(this.x, this.y);
  },
};

/**
 * Point
 */
function Point(x, y, radius) {
  Vector.call(this, x, y);

  this.radius = radius || 7;

  this.vec = new Vector(random(1, -1), random(1, -1)).normalize();
  this._easeRadius = this.radius;
  this._currentRadius = this.radius;
}

Point.prototype = (function (o) {
  var s = new Vector(0, 0),
    p;
  for (p in o) {
    s[p] = o[p];
  }
  return s;
})({
  color: "rgb(255, 255, 255)",
  dragging: false,
  _latestDrag: null,
});

/**
 * Lightning
 */
function Lightning(startPoint, endPoint, step) {
  this.startPoint = startPoint || new Vector();
  this.endPoint = endPoint || new Vector();
  this.step = step || 45;

  this.children = [];
}

Lightning.prototype = {
  color: "rgba(128, 128, 255, 0.5)",
  speed: 0.05,
  amplitude: 2,
  lineWidth: 10,
  blur: 50,
  blurColor: "rgba(255, 255, 255, 0.5)",
  points: null,
  off: 0,
  _simplexNoise: new SimplexNoise(),
  // Case by child
  parent: null,
  startStep: 0,
  endStep: 0,

  length: function () {
    return this.startPoint.distanceTo(this.endPoint);
  },

  setChildNum: function (num) {
    var children = this.children,
      child,
      i,
      len;

    len = this.children.length;

    if (len > num) {
      for (i = num; i < len; i++) {
        children[i].dispose();
      }
      children.splice(num, len - num);
    } else {
      for (i = len; i < num; i++) {
        child = new Lightning();
        child._setAsChild(this);
        children.push(child);
      }
    }
  },

  update: function () {
    var startPoint = this.startPoint,
      endPoint = this.endPoint,
      length,
      normal,
      radian,
      sinv,
      cosv,
      points,
      off,
      waveWidth,
      n,
      av,
      ax,
      ay,
      bv,
      bx,
      by,
      m,
      x,
      y,
      children,
      child,
      i,
      len;

    if (this.parent) {
      if (this.endStep > this.parent.step) {
        this._updateStepsByParent();
      }

      startPoint.set(this.parent.points[this.startStep]);
      endPoint.set(this.parent.points[this.endStep]);
    }

    length = this.length();
    normal = Vector.sub(endPoint, startPoint)
      .normalize()
      .scale(length / this.step);
    radian = normal.angle();
    sinv = Math.sin(radian);
    cosv = Math.cos(radian);

    points = this.points = [];
    off = this.off += random(this.speed, this.speed * 0.2);
    waveWidth = (this.parent ? length * 1.5 : length) * this.amplitude;
    if (waveWidth > 750) waveWidth = 750;

    for (i = 0, len = this.step + 1; i < len; i++) {
      n = i / 60;
      av = waveWidth * this._noise(n - off, 0) * 0.5;
      ax = sinv * av;
      ay = cosv * av;

      bv = waveWidth * this._noise(n + off, 0) * 0.5;
      bx = sinv * bv;
      by = cosv * bv;

      m = Math.sin(Math.PI * (i / (len - 1)));

      x = startPoint.x + normal.x * i + (ax - bx) * m;
      y = startPoint.y + normal.y * i - (ay - by) * m;

      points.push(new Vector(x, y));
    }

    children = this.children;

    for (i = 0, len = children.length; i < len; i++) {
      child = children[i];
      child.color = this.color;
      child.speed = this.speed * 1.35;
      child.amplitude = this.amplitude;
      child.lineWidth = this.lineWidth * 0.75;
      child.blur = this.blur;
      child.blurColor = this.blurColor;
      children[i].update();
    }
  },

  draw: function (ctx) {
    var points = this.points,
      children = this.children,
      i,
      len,
      p,
      d;

    // Blur
    if (this.blur) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.shadowBlur = this.blur;
      ctx.shadowColor = this.blurColor;
      ctx.beginPath();
      for (i = 0, len = points.length; i < len; i++) {
        p = points[i];
        d = len > 1 ? p.distanceTo(points[i === len - 1 ? i - 1 : i + 1]) : 0;
        ctx.moveTo(p.x + d, p.y);
        ctx.arc(p.x, p.y, d, 0, Math.PI * 2, false);
      }
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.lineWidth = random(this.lineWidth, 0.5);
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    for (i = 0, len = points.length; i < len; i++) {
      p = points[i];
      ctx[i === 0 ? "moveTo" : "lineTo"](p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();

    // Draw children
    for (i = 0, len = this.children.length; i < len; i++) {
      children[i].draw(ctx);
    }
  },

  dispose: function () {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
    this._simplexNoise = null;
  },

  _noise: function (v) {
    var octaves = 6,
      fallout = 0.5,
      amp = 1,
      f = 1,
      sum = 0,
      i;

    for (i = 0; i < octaves; ++i) {
      amp *= fallout;
      sum += amp * (this._simplexNoise.noise2D(v * f, 0) + 1) * 0.5;
      f *= 2;
    }

    return sum;
  },

  _setAsChild: function (lightning) {
    if (!(lightning instanceof Lightning)) return;
    this.parent = lightning;

    var self = this,
      setTimer = function () {
        self._updateStepsByParent();
        self._timeoutId = setTimeout(setTimer, randint(1500));
      };

    self._timeoutId = setTimeout(setTimer, randint(1500));
  },

  _updateStepsByParent: function () {
    if (!this.parent) return;
    var parentStep = this.parent.step;
    this.startStep = randint(parentStep - 2);
    this.endStep =
      this.startStep + randint(parentStep - this.startStep - 2) + 2;
    this.step = this.endStep - this.startStep;
  },
};

// Helpers

function random(max, min) {
  if (typeof max !== "number") {
    return Math.random();
  } else if (typeof min !== "number") {
    min = 0;
  }
  return Math.random() * (max - min) + min;
}

function randint(max, min) {
  if (!max) return 0;
  return random(max + 1, min) | 0;
}

// Initialize

export default class Spark extends Component {
  constructor(props) {
    super(props);
    this.myRef = createRef();
    this.counter = 0;

    this.loop = () => {
      if (!this.animating || !this.canvasContext.save) return;
      this.canvasContext.save();
      this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.canvasContext.restore();

      this.lightning.startPoint.set(this.points[0]);
      this.lightning.endPoint.set(this.points[1]);
      this.lightning.step = Math.ceil(this.lightning.length() / 10);
      if (this.lightning.step < 5) this.lightning.step = 5;

      this.lightning.update();
      this.lightning.draw(this.canvasContext);

      if (this.counter > Math.random() * 200) {
        this.counter = 0;
        this.points = [
          new Point(
            random(this.canvas.width, 0),
            random(this.canvas.height, 0),
            this.lightning.lineWidth * 1.25
          ),
          new Point(
            random(this.canvas.width, 0),
            random(this.canvas.height, 0),
            this.lightning.lineWidth * 1.25
          ),
        ];
      }
      this.counter++;

      this.frame = requestAnimationFrame(this.loop);
    };
  }
  // Vars
  componentDidMount() {
    // Event Listeners
    this.canvas = this.myRef.current;

    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.canvasContext = this.canvas.getContext("2d");

      this.lightning = new Lightning();

      this.points = [
        new Point(
          random(this.canvas.width, 0),
          random(this.canvas.height, 0),
          this.lightning.lineWidth * 1.25
        ),
        new Point(
          random(this.canvas.width, 0),
          random(this.canvas.height, 0),
          this.lightning.lineWidth * 1.25
        ),
      ];

      this.lightning.startPoint.set(this.points[0]);
      this.lightning.endPoint.set(this.points[1]);
      this.lightning.setChildNum(3);

      // Start Update
    }
    this.animating = true;
    this.loop();
  }

  componentWillUnmount() {
    this.animating = false;
    cancelAnimationFrame(this.frame);
  }
  render() {
    return (
      <canvas
        ref={this.myRef}
        style={{
          zIndex: 10000,
          position: "fixed",
          top: "0px",
          left: "0px",
        }}
      />
    );
  }
}
