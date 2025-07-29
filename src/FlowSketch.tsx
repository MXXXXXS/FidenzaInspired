import p5 from "p5"

const params = {
  NUM_PARTICLES: 2000,
  PARTICLE_SPEED: 2,
  STROKE_WEIGHT: 4,
  NOISE_SCALE: 0.001,

  COLOR_PALETTES: {
    Luxe: ["#ffc400", "#ff7b00", "#f93700", "#e50000", "#9e0000", "#4d2d00"],
    Ocean: [
      "#001219",
      "#005f73",
      "#0a9396",
      "#94d2bd",
      "#e9d8a6",
      "#ee9b00",
      "#ca6702",
    ],
    Monochrome: ["#000000", "#444444", "#888888", "#cccccc"],
  },
  SELECTED_PALETTE: "Luxe",
}

let particles: Particle[] = []
let flowfield: p5.Vector[]
const GRID_SCALE = 10

class Particle {
  p: p5
  cols: number
  rows: number
  pos: p5.Vector
  vel: p5.Vector
  acc: p5.Vector
  maxSpeed: number
  color: string
  palette: string[]

  constructor(p: p5, cols: number, rows: number, palette: string[]) {
    this.p = p
    this.cols = cols
    this.rows = rows
    this.palette = palette

    this.pos = p.createVector(0, 0)
    this.vel = p.createVector(0, 0)
    this.acc = p.createVector(0, 0)
    this.maxSpeed = params.PARTICLE_SPEED
    this.color = ""

    this.reset()
  }

  reset() {
    this.pos = this.p.createVector(
      this.p.random(this.p.width),
      this.p.random(this.p.height)
    )
    this.vel.mult(0)
    this.acc.mult(0)
    this.color = this.p.random(this.palette)
  }

  update() {
    this.vel.add(this.acc)
    this.vel.limit(this.maxSpeed)
    this.pos.add(this.vel)
    this.acc.mult(0)
    this.checkEdges()
  }
  applyForce(force: p5.Vector) {
    this.acc.add(force)
  }
  follow(vectors: p5.Vector[]) {
    let x = Math.floor(this.pos.x / GRID_SCALE)
    let y = Math.floor(this.pos.y / GRID_SCALE)
    let index = x + y * this.cols
    let force = vectors[index]
    if (force) {
      this.applyForce(force)
    }
  }
  show(pg: p5.Graphics) {
    pg.stroke(this.color)
    pg.strokeWeight(params.STROKE_WEIGHT)
    pg.point(this.pos.x, this.pos.y)
  }

  checkEdges() {
    if (
      this.pos.x > this.p.width ||
      this.pos.x < 0 ||
      this.pos.y > this.p.height ||
      this.pos.y < 0
    ) {
      this.reset()
    }
  }
}

function resetSketch(
  p: p5,
  pg: p5.Graphics,
  cols: number,
  rows: number,
  palette: string[]
) {
  pg.background(245, 245, 240)
  flowfield = new Array(cols * rows)
  let yoff = 0
  p.noiseSeed(Date.now())
  for (let y = 0; y < rows; y++) {
    let xoff = 0
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols
      let angle = p.noise(xoff, yoff) * p.TWO_PI * 4
      let v = p5.Vector.fromAngle(angle)
      v.setMag(1)
      flowfield[index] = v
      xoff += params.NOISE_SCALE
    }
    yoff += params.NOISE_SCALE
  }
  particles = []
  for (let i = 0; i < params.NUM_PARTICLES; i++) {
    particles.push(new Particle(p, cols, rows, palette))
  }
}

export const FlowSketch = (p: p5) => {
  let trailBuffer: p5.Graphics
  let cleanupShader: p5.Shader

  const vertShader = `
    precision highp float;
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;
    void main() {
      vTexCoord = aTexCoord;
      vec4 positionVec4 = vec4(aPosition, 1.0);
      positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
      gl_Position = positionVec4;
    }
  `

  const fragShader = `
    precision highp float;
    varying vec2 vTexCoord;
    uniform sampler2D uTexture;
    uniform vec4 uBackgroundColor; 
    uniform float uColorThreshold;

    void main() {
      vec4 texColor = texture2D(uTexture, vTexCoord);
      float colorDist = distance(texColor.rgb, uBackgroundColor.rgb);
      if (colorDist < uColorThreshold) {
        gl_FragColor = uBackgroundColor;
      } else {
        gl_FragColor = texColor;
      }
    }
  `

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL)
    p.pixelDensity(1)

    trailBuffer = p.createGraphics(p.width, p.height)
    cleanupShader = p.createShader(vertShader, fragShader)

    const palette =
      params.COLOR_PALETTES[
        params.SELECTED_PALETTE as keyof typeof params.COLOR_PALETTES
      ]
    const cols = p.floor(p.width / GRID_SCALE)
    const rows = p.floor(p.height / GRID_SCALE)

    resetSketch(p, trailBuffer, cols, rows, palette)

    let button = p.createButton("Regenerate")
    button.position(10, 10)
    button.mousePressed(() => resetSketch(p, trailBuffer, cols, rows, palette))
  }

  p.draw = () => {
    const bgColor = p.color(239, 234, 220)

    const fadeAlpha = 20

    trailBuffer.background(
      p.red(bgColor),
      p.green(bgColor),
      p.blue(bgColor),
      fadeAlpha
    )

    for (const particle of particles) {
      particle.follow(flowfield)
      particle.update()
      particle.show(trailBuffer)
    }

    p.shader(cleanupShader)
    cleanupShader.setUniform("uTexture", trailBuffer)
    cleanupShader.setUniform("uBackgroundColor", [
      p.red(bgColor) / 255.0,
      p.green(bgColor) / 255.0,
      p.blue(bgColor) / 255.0,
      1,
    ])
    cleanupShader.setUniform("uColorThreshold", fadeAlpha / 255)
    p.rect(0, 0, p.width, p.height)
  }
}
