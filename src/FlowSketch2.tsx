import p5 from "p5"

const resolution = 1
const noiseScale = 0.001
const maxCurves = 4000
const maxCurveLength = 200
const maxFindAttempts = 1000
const colorPalette = [
  "#f2e8c9",
  "#f2d5c9",
  "#c9f2d5",
  "#c9f2e8",
  "#e8c9f2",
  "#d5c9f2",
  "#ff6b6b",
  "#f9c74f",
  "#90be6d",
  "#43aa8b",
  "#577590",
  "#277da1",
]

class Curve {
  p: p5
  path: p5.Vector[]
  color: p5.Color
  isFinished: boolean
  strokeW: number

  constructor(p: p5, startPos: p5.Vector) {
    this.p = p
    this.path = [startPos]
    this.isFinished = false
    this.color = p.color(p.random(colorPalette))
    this.strokeW = p.random(1, 4)
  }

  update(
    flowField: p5.Vector[][],
    collisionGrid: boolean[][],
    cols: number,
    rows: number
  ) {
    if (this.isFinished) return

    const lastPoint = this.path[this.path.length - 1]
    const gridX = this.p.constrain(
      this.p.floor(lastPoint.x / resolution),
      0,
      cols - 1
    )
    const gridY = this.p.constrain(
      this.p.floor(lastPoint.y / resolution),
      0,
      rows - 1
    )
    const force = flowField[gridX][gridY]
    const nextPoint = p5.Vector.add(lastPoint, force)

    if (this.checkCollision(nextPoint, collisionGrid, cols, rows)) {
      this.isFinished = true
      return
    }

    this.path.push(nextPoint)

    const nextGridX = this.p.floor(nextPoint.x / resolution)
    const nextGridY = this.p.floor(nextPoint.y / resolution)
    if (
      nextGridX >= 0 &&
      nextGridX < cols &&
      nextGridY >= 0 &&
      nextGridY < rows
    ) {
      collisionGrid[nextGridX][nextGridY] = true
    }

    if (this.path.length > maxCurveLength) {
      this.isFinished = true
    }
  }

  checkCollision(
    point: p5.Vector,
    collisionGrid: boolean[][],
    cols: number,
    rows: number
  ): boolean {
    if (
      point.x < 0 ||
      point.x > this.p.width ||
      point.y < 0 ||
      point.y > this.p.height
    ) {
      return true
    }

    const gridX = this.p.floor(point.x / resolution)
    const gridY = this.p.floor(point.y / resolution)

    if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
      if (collisionGrid[gridX][gridY]) {
        return true
      }
    }
    return false
  }

  display() {
    this.p.stroke(this.color)
    this.p.strokeWeight(this.strokeW)
    this.p.noFill()

    this.p.beginShape()
    for (const point of this.path) {
      this.p.vertex(point.x, point.y)
    }
    this.p.endShape()
  }
}

export const FlowSketch2 = (p: p5) => {
  let cols: number, rows: number
  let flowField: p5.Vector[][]
  let collisionGrid: boolean[][]
  let curves: Curve[] = []
  let findAttempts = 0

  const initializeFlowField = () => {
    cols = p.floor(p.width / resolution)
    rows = p.floor(p.height / resolution)
    flowField = new Array(cols)
    for (let x = 0; x < cols; x++) {
      flowField[x] = new Array(rows)
      for (let y = 0; y < rows; y++) {
        const angle = p.noise(x * noiseScale, y * noiseScale) * p.TWO_PI * 2
        const v = p5.Vector.fromAngle(angle)
        v.setMag(1)
        flowField[x][y] = v
      }
    }
  }

  const initializeCollisionGrid = () => {
    collisionGrid = new Array(cols)
    for (let x = 0; x < cols; x++) {
      collisionGrid[x] = new Array(rows).fill(false)
    }
  }

  const findEmptySpot = (): p5.Vector | null => {
    let attempts = 0
    while (attempts < 100) {
      const x = p.floor(p.random(cols))
      const y = p.floor(p.random(rows))
      if (!collisionGrid[x][y]) {
        return p.createVector(
          x * resolution + resolution / 2,
          y * resolution + resolution / 2
        )
      }
      attempts++
    }
    return null
  }

  p.setup = () => {
    p.createCanvas(800, 800)
    p.background(10, 10, 20)

    initializeFlowField()
    initializeCollisionGrid()
  }

  p.draw = () => {
    if (curves.length < maxCurves && findAttempts < maxFindAttempts) {
      const startPos = findEmptySpot()
      if (startPos) {
        const newCurve = new Curve(p, startPos)
        curves.push(newCurve)
        findAttempts = 0
      } else {
        findAttempts++
      }
    } else if (curves.length >= maxCurves || findAttempts >= maxFindAttempts) {
      console.log("Generation complete.")
      p.noLoop()
      return
    }

    for (const curve of curves) {
      curve.update(flowField, collisionGrid, cols, rows)
      curve.display()
    }
  }
}
