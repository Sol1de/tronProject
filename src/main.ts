import './style.css'
import CanvasManager from './canva.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/`
  <div class="flex flex-col justify-center items-center h-screen gap-4">
    <div class="flex gap-2 mb-4">
      <button id="resetBtn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Reset Points
      </button>
      <button id="randomPathBtn" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        Random Manual Path
      </button>
      <button id="clearPathBtn" class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
        Clear Manual Path
      </button>
    </div>
    
    <div class="flex gap-2 mb-4">
      <button id="generateRandomPathsBtn" class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
        Generate Auto Paths
      </button>
      <button id="clearRandomPathsBtn" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
        Clear Auto Paths
      </button>
      <button id="showStatsBtn" class="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
        Show Stats
      </button>
    </div>
    
    <canvas id="canvas" width="600" height="600" class="bg-black border-2 border-white"></canvas>
    
    <div class="text-white text-sm max-w-md text-center">
      <p><strong>Manual Mode:</strong> Click on grid points to create paths</p>
      <p><strong>Auto Mode:</strong> Generate random paths from deadzone border to canvas border</p>
    </div>
  </div>
`

const canvas = CanvasManager.initCanvas()
const gridConfig = canvas.initGrid(50, 50, 200, 150, {x: 300, y: 300})
canvas.setupInteractivePathfinding()

// Démonstration automatique des nouvelles fonctionnalités
setTimeout(() => {
  console.log('=== Test des nouvelles fonctionnalités ===')
  
  // Test 1: Affichage des points de bordure de la deadzone
  const deadzonePoints = canvas.getDeadzoneBorderPoints()
  console.log(`Points de bordure de la deadzone: ${deadzonePoints.length}`, deadzonePoints)
  
  // Test 2: Affichage des points de bordure du canvas
  const canvasPoints = canvas.getCanvasBorderPoints()
  console.log(`Points de bordure du canvas: ${canvasPoints.length}`, canvasPoints)
  
  // Test 3: Génération automatique de chemins aléatoires
  const randomPaths = canvas.setRandomPaths(10)
  console.log(`Chemins aléatoires générés: ${randomPaths.length}`, randomPaths)
  
  // Afficher les statistiques
  const stats = canvas.getRandomPathsStats()
  console.log('📊 Statistiques de génération:', stats)
  
  // Dessiner les chemins générés
  canvas.drawRandomPaths()
  
  console.log('=== Fin du test automatique ===')
  console.log('Utilisez les boutons pour tester manuellement les fonctionnalités')
  console.log('💡 Chaque chemin est numéroté pour faciliter le debug')
}, 1000)