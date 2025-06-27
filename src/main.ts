import './style.css'
import CanvasManager from './canva.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/`
  <div class="flex justify-center items-center h-screen">
    <canvas id="canvas" width="600" height="600" class="bg-black"></canvas>
  </div>
`

const canvas = CanvasManager.initCanvas()

const {gridSizeWidth, gridSizeHeight, gridPoints, deadZone} = canvas.initGrid(50, 50, 200, 150, {x: 300, y: 300})

// Variables pour le pathfinding interactif
let startPoint: {x: number, y: number} | null = null
let endPoint: {x: number, y: number} | null = null

function redrawCanvas() {
  canvas.getContext().clearRect(0, 0, canvas.getWidth(), canvas.getHeight())
  canvas.drawGrid(gridPoints, gridSizeWidth, gridSizeHeight, deadZone)
}

function findNearestGridPoint(x: number, y: number): {x: number, y: number} | null {
  let nearest = null
  let minDistance = Infinity
  
  for (const point of gridPoints) {
    const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2))
    if (distance < minDistance && distance < 25) { // Tolérance de 25 pixels
      minDistance = distance
      nearest = point
    }
  }
  
  return nearest
}

// Gestion des clics sur le canvas
canvas.getCanvas().addEventListener('click', (event) => {
  const rect = canvas.getCanvas().getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const nearestPoint = findNearestGridPoint(x, y)
  
  if (nearestPoint) {
    if (!startPoint) {
      startPoint = nearestPoint
      canvas.drawCircle(startPoint.x, startPoint.y, 8, 'blue')
      console.log('Point de départ sélectionné:', startPoint)
    } else if (!endPoint) {
      endPoint = nearestPoint
      canvas.drawCircle(endPoint.x, endPoint.y, 8, 'red')
      console.log('Point d\'arrivée sélectionné:', endPoint)
      
      // Lancer l'algorithme A*
      const chemin = canvas.aStar(startPoint, endPoint, gridPoints, gridSizeWidth, gridSizeHeight, deadZone)
      
      if (chemin) {
        console.log('Chemin trouvé:', chemin)
        canvas.drawPath(chemin)
      } else {
        console.log('Aucun chemin trouvé!')
        alert('Aucun chemin trouvé entre ces deux points!')
      }
    } else {
      // Reset pour un nouveau chemin
      startPoint = nearestPoint
      endPoint = null
      redrawCanvas()
      canvas.drawCircle(startPoint.x, startPoint.y, 8, 'blue')
      console.log('Nouveau point de départ sélectionné:', startPoint)
    }
  }
})

// Bouton Reset
document.getElementById('resetBtn')?.addEventListener('click', () => {
  startPoint = null
  endPoint = null
  redrawCanvas()
  console.log('Canvas réinitialisé')
})

// Bouton Chemin Aléatoire
document.getElementById('randomPathBtn')?.addEventListener('click', () => {
  if (gridPoints.length < 2) return
  
  const randomStart = gridPoints[Math.floor(Math.random() * gridPoints.length)]
  const randomEnd = gridPoints[Math.floor(Math.random() * gridPoints.length)]
  
  if (randomStart !== randomEnd) {
    redrawCanvas()
    startPoint = randomStart
    endPoint = randomEnd
    
    canvas.drawCircle(startPoint.x, startPoint.y, 8, 'blue')
    canvas.drawCircle(endPoint.x, endPoint.y, 8, 'red')
    
    const chemin = canvas.aStar(startPoint, endPoint, gridPoints, gridSizeWidth, gridSizeHeight, deadZone)
    
    if (chemin) {
      console.log('Chemin aléatoire trouvé:', chemin)
      canvas.drawPath(chemin)
    } else {
      console.log('Aucun chemin aléatoire trouvé!')
    }
  }
})

// Bouton Effacer Chemin
document.getElementById('clearPathBtn')?.addEventListener('click', () => {
  redrawCanvas()
  if (startPoint) canvas.drawCircle(startPoint.x, startPoint.y, 8, 'blue')
  if (endPoint) canvas.drawCircle(endPoint.x, endPoint.y, 8, 'red')
})

// Dessiner la grille initiale
redrawCanvas()

// Démonstration automatique au démarrage
console.log('=== DÉMONSTRATION A* ===')
console.log('Grille:', gridSizeWidth, 'x', gridSizeHeight)
console.log('Points de grille disponibles:', gridPoints.length)
console.log('Zone morte:', deadZone)

// Exemple automatique
setTimeout(() => {
  const exampleStart = { x: 0, y: 0 }
  const exampleEnd = { x: 500, y: 500 }
  
  console.log('Test automatique du pathfinding...')
  const cheminExample = canvas.aStar(exampleStart, exampleEnd, gridPoints, gridSizeWidth, gridSizeHeight, deadZone)
  
  if (cheminExample) {
    console.log('Chemin d\'exemple trouvé:', cheminExample)
    canvas.drawPath(cheminExample, 'purple', 2)
    canvas.drawCircle(exampleStart.x, exampleStart.y, 6, 'purple')
    canvas.drawCircle(exampleEnd.x, exampleEnd.y, 6, 'purple')
  }
}, 500)