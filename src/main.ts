import './style.css'
import CanvasManager from './canva.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/`
  <div class="flex justify-center items-center h-screen">
    <canvas id="canvas" width="600" height="600" class="bg-black"></canvas>
  </div>
`
const canvas = CanvasManager.initCanvas()
canvas.drawLine(canvas.getWidth()/2, canvas.getHeight()/2, 600, 600, 'green', 1)
canvas.drawCircle(canvas.getWidth()/2, canvas.getHeight()/2, 10, 'red')
canvas.drawRectangle(canvas.getWidth()/2-5, canvas.getHeight()/2-5, 10, 10, 'blue')