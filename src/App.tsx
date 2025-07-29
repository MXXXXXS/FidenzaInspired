import P5Sketch from "./P5Sketch"
import "./App.css"
import { FidenzaSketch } from "./FidenzaSketch"

function App() {
  return (
    <div className="App">
      <P5Sketch sketch={FidenzaSketch} />
    </div>
  )
}

export default App
