import P5Sketch from "./P5Sketch"
import "./App.css"
import { FlowSketch2 } from "./FlowSketch2"

function App() {
  return (
    <div className="App">
      <P5Sketch sketch={FlowSketch2} />
    </div>
  )
}

export default App
