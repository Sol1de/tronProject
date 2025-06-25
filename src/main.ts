import './style.css'
import CanvasManager from './canva.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/`
  <div class="flex justify-center items-center h-screen">
    <canvas id="canvas" width="600" height="600" class="bg-black"></canvas>
  </div>
`
const canvas = CanvasManager.initCanvas()
const gridPoints = canvas.initGrid(100, 100, 100, 100)
canvas.drawGrid(gridPoints, 100, 100)