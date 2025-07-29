import p5 from "p5"

const params = {
  NUM_PARTICLES: 2000,
  PARTICLE_LIFESPAN: 80,
  PARTICLE_SPEED: 2,
  STROKE_WEIGHT: 3,
  NOISE_SCALE: 0.01,

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

function generate(p: p5, cols: number, rows: number, palette: string[]) {
  p.background(245, 245, 240)

  flowfield = new Array(cols * rows)
  let yoff = 0
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

  for (let step = 0; step < params.PARTICLE_LIFESPAN; step++) {
    for (const p of particles) {
      p.follow(flowfield)
      p.update()
      p.show()
    }
  }
}

class Particle {
  p: p5
  cols: number
  rows: number
  pos: p5.Vector
  vel: p5.Vector
  acc: p5.Vector
  maxSpeed: number
  color: string

  constructor(p: p5, cols: number, rows: number, palette: string[]) {
    this.p = p
    this.cols = cols
    this.rows = rows
    this.pos = p.createVector(p.random(p.width), p.random(p.height))
    this.vel = p.createVector(0, 0)
    this.acc = p.createVector(0, 0)
    this.maxSpeed = params.PARTICLE_SPEED
    this.color = p.random(palette)
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

  show() {
    this.p.stroke(this.color)
    this.p.strokeWeight(params.STROKE_WEIGHT)
    this.p.point(this.pos.x, this.pos.y)
  }

  checkEdges() {
    if (this.pos.x > this.p.width) this.pos.x = 0
    if (this.pos.x < 0) this.pos.x = this.p.width
    if (this.pos.y > this.p.height) this.pos.y = 0
    if (this.pos.y < 0) this.pos.y = this.p.height
  }
}

export const FidenzaSketch = (p: p5) => {
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight)

    const palette =
      params.COLOR_PALETTES[
        params.SELECTED_PALETTE as keyof typeof params.COLOR_PALETTES
      ]
    const cols = p.floor(p.width / GRID_SCALE)
    const rows = p.floor(p.height / GRID_SCALE)

    generate(p, cols, rows, palette)

    p.noLoop()
    let button = p.createButton("Regenerate")
    button.position(10, 10)
    button.mousePressed(() => generate(p, cols, rows, palette))
  }

  p.draw = () => {
    for (let i = 0; i < particles.length; i++) {
      particles[i].follow(flowfield)
      particles[i].update()
      particles[i].show()
    }
  }
}
