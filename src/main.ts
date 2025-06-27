import './style.css'
import CanvasManager from './canva.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/`
  <div class="flex justify-center items-center h-screen">
    <canvas id="canvas" width="600" height="600" class="bg-black"></canvas>
  </div>
`

const canvas = CanvasManager.initCanvas()

const {gridSizeWidth, gridSizeHeight, gridPoints, deadZone} = canvas.initGrid(50, 50, 200, 150, {x: 300, y: 300})

canvas.drawGrid(gridPoints, gridSizeWidth, gridSizeHeight, deadZone)