const PALETTES = [
  ["#ef2c25", "#0864c8", "#07942b", "#ffd11a", "#ff9411", "#f4a7a1", "#5c2117"],
  ["#fb3b34", "#4454c9", "#078832", "#ffc917", "#ff8a00", "#ff8f80", "#6c170f"],
  ["#e62822", "#0a57bd", "#0a9d31", "#f6c900", "#f27b16", "#f6b8b2", "#65261b"],
];

const BASE_TUBES = [
  {
    weight: 0.118,
    phase: 0.11,
    colors: [3, 2, 3, 1],
    cuts: [0, 0.28, 0.5, 0.74, 1],
    points: [
      [-0.1, 0.19],
      [0.09, 0.18],
      [0.2, 0.41],
      [0.34, 0.4],
      [0.44, 0.17],
      [0.62, 0.18],
      [0.74, 0.39],
      [1.1, 0.34],
    ],
  },
  {
    weight: 0.134,
    phase: 0.32,
    colors: [0, 5, 0, 4, 2],
    cuts: [0, 0.18, 0.39, 0.58, 0.82, 1],
    points: [
      [-0.12, 0.44],
      [0.07, 0.42],
      [0.16, 0.7],
      [0.34, 0.7],
      [0.43, 0.33],
      [0.57, 0.28],
      [0.68, 0.58],
      [0.88, 0.54],
      [1.12, 0.57],
    ],
  },
  {
    weight: 0.108,
    phase: 0.5,
    colors: [2, 1, 6, 3],
    cuts: [0, 0.25, 0.52, 0.68, 1],
    points: [
      [-0.13, 0.08],
      [0.04, 0.33],
      [0.22, 0.3],
      [0.28, 0.07],
      [0.45, 0.08],
      [0.5, 0.36],
      [0.67, 0.34],
      [0.8, 0.08],
      [1.12, 0.12],
    ],
  },
  {
    weight: 0.129,
    phase: 0.7,
    colors: [1, 1, 2, 4, 0],
    cuts: [0, 0.22, 0.46, 0.63, 0.8, 1],
    points: [
      [-0.11, 0.84],
      [0.05, 0.83],
      [0.12, 0.58],
      [0.3, 0.62],
      [0.37, 0.9],
      [0.55, 0.88],
      [0.66, 0.62],
      [0.83, 0.75],
      [1.12, 0.72],
    ],
  },
  {
    weight: 0.103,
    phase: 0.87,
    colors: [5, 0, 3],
    cuts: [0, 0.42, 0.66, 1],
    points: [
      [-0.1, 0.66],
      [0.08, 0.66],
      [0.13, 0.91],
      [0.29, 0.94],
      [0.4, 0.78],
      [0.54, 0.78],
      [0.58, 1.08],
    ],
  },
  {
    weight: 0.111,
    phase: 0.22,
    colors: [4, 3, 5, 2],
    cuts: [0, 0.2, 0.48, 0.77, 1],
    points: [
      [1.1, 0.2],
      [0.92, 0.19],
      [0.85, 0.45],
      [0.69, 0.43],
      [0.59, 0.69],
      [0.76, 0.92],
      [1.12, 0.93],
    ],
  },
];

let seed = 4127;
let paletteIndex = 0;
let animated = true;
let layerRotation = 0;
let bendMode = 0;
let cutOffset = 0;
let portraitMode = true;

function setup() {
  createCanvasForWindow();
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  cursor("default");
}

function draw() {
  randomSeed(seed);
  background("#fffdf8");
  const t = animated ? frameCount * 0.0025 : 0;
  const layerOrder = [2, 0, 5, 1, 4, 3];
  const order = rotatedOrder(layerOrder.length, layerRotation).map((i) => layerOrder[i]);

  for (const index of order) {
    drawTube(BASE_TUBES[index], index, t);
  }
}

function createCanvasForWindow() {
  const margin = 0.94;
  const ratio = portraitMode ? 0.76 : 1;
  let h = Math.floor(windowHeight * margin);
  let w = Math.floor(h * ratio);
  if (w > windowWidth * margin) {
    w = Math.floor(windowWidth * margin);
    h = Math.floor(w / ratio);
  }
  createCanvas(w, h);
}

function windowResized() {
  const margin = 0.94;
  const ratio = portraitMode ? 0.76 : 1;
  let h = Math.floor(windowHeight * margin);
  let w = Math.floor(h * ratio);
  if (w > windowWidth * margin) {
    w = Math.floor(windowWidth * margin);
    h = Math.floor(w / ratio);
  }
  resizeCanvas(w, h);
}

function drawTube(tube, tubeIndex, t) {
  const pts = deformedPoints(tube, tubeIndex, t);
  const sampled = resampleCatmull(pts, 42);
  const pal = PALETTES[paletteIndex];
  const weight = Math.min(width, height) * tube.weight;
  const cuts = buildCuts(sampled.length, tube, tubeIndex);
  const seamOverlap = 2;

  drawingContext.lineCap = "butt";
  drawingContext.lineJoin = "round";
  noFill();
  strokeWeight(weight);

  for (let i = 0; i < cuts.length - 1; i++) {
    const start = Math.max(0, cuts[i] - (i > 0 ? seamOverlap : 0));
    const end = Math.min(sampled.length - 1, cuts[i + 1] + (i < cuts.length - 2 ? seamOverlap : 0));
    stroke(pal[(tube.colors[i % tube.colors.length] + paletteIndex) % pal.length]);
    beginShape();
    for (let j = start; j <= end; j++) {
      vertex(sampled[j].x, sampled[j].y);
    }
    endShape();
  }
}

function deformedPoints(tube, tubeIndex, t) {
  const mouse = createVector(mouseX / width, mouseY / height);
  const activeMouse = mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;

  return tube.points.map(([x, y], pointIndex) => {
    const local = createVector(x, y);
    const wave = sin(t + tubeIndex * 1.9 + pointIndex * 0.83) * 0.012;
    const secondary = cos(t * 0.7 + pointIndex * 1.4 + tube.phase * 8) * 0.007;

    if (bendMode === 0) {
      local.y += wave;
      local.x += secondary * 0.5;
    } else if (bendMode === 1) {
      local.x += wave;
      local.y += secondary;
    } else {
      local.y += wave * (pointIndex % 2 === 0 ? 1 : -1);
      local.x += secondary * (tubeIndex % 2 === 0 ? 1 : -1);
    }

    if (activeMouse) {
      const distance = p5.Vector.dist(local, mouse);
      const pull = constrain(0.13 - distance, 0, 0.13) / 0.13;
      const direction = p5.Vector.sub(mouse, local).mult(0.033 * pull);
      local.add(direction);
    }

    return createVector(local.x * width, local.y * height);
  });
}

function resampleCatmull(points, steps) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    for (let s = 0; s < steps; s++) {
      const u = s / steps;
      out.push(catmullPoint(p0, p1, p2, p3, u));
    }
  }
  out.push(points[points.length - 1].copy());
  return out;
}

function catmullPoint(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  return createVector(x, y);
}

function buildCuts(total, tube, tubeIndex) {
  const cuts = tube.cuts.map((cut, i) => {
    if (i === 0) return 0;
    if (i === tube.cuts.length - 1) return total - 1;
    const drift = sin((cutOffset + tube.phase + i * 0.17) * TWO_PI) * 0.018;
    return Math.floor(constrain(cut + drift, 0.06, 0.94) * (total - 1));
  });
  return cuts.sort((a, b) => a - b);
}

function rotatedOrder(length, offset) {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = 0; i < offset; i++) {
    order.push(order.shift());
  }
  return order;
}

function mousePressed() {
  layerRotation = (layerRotation + 1) % BASE_TUBES.length;
}

function mouseDragged() {
  cutOffset += movedX * 0.0007 + movedY * 0.0003;
}

function keyPressed() {
  if (key === " ") animated = !animated;
  if (key === "r" || key === "R") seed = Math.floor(random(100000));
  if (key === "c" || key === "C") paletteIndex = (paletteIndex + 1) % PALETTES.length;
  if (key === "s" || key === "S") saveCanvas("quinta-obra-ballardo", "png");
  if (key === "f" || key === "F") {
    portraitMode = !portraitMode;
    windowResized();
  }
  if (keyCode === LEFT_ARROW) layerRotation = (layerRotation + BASE_TUBES.length - 1) % BASE_TUBES.length;
  if (keyCode === RIGHT_ARROW) layerRotation = (layerRotation + 1) % BASE_TUBES.length;
  if (keyCode === UP_ARROW) cutOffset += 0.04;
  if (keyCode === DOWN_ARROW) cutOffset -= 0.04;
  if (key === "1") bendMode = 0;
  if (key === "2") bendMode = 1;
  if (key === "3") bendMode = 2;
}
