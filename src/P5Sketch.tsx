import React, { useRef, useEffect } from "react"
import p5 from "p5"

type Sketch = (p: p5) => void

interface P5SketchProps {
  sketch: Sketch
}

const P5Sketch: React.FC<P5SketchProps> = ({ sketch }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const p5Instance = new p5(sketch, containerRef.current)

    return () => {
      p5Instance.remove()
    }
  }, [sketch])

  return <div ref={containerRef} />
}

export default P5Sketch
