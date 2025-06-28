import './style.css'
import CanvasManager from './classes/CanvasManager'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/`
  <div class="flex flex-col justify-center items-center h-screen gap-4">
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
      <button id="testTronBtn" class="bg-cyan-500 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded">
        🚀 Test Tron Animation
      </button>
    </div>
    
    <div class="flex gap-2 mb-4">
      <button id="tronSimultaneousBtn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm">
        Simultaneous
      </button>
      <button id="tronSequentialBtn" class="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm">
        Sequential
      </button>
      <button id="tronStaticBtn" class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm">
        Static Tron
      </button>
    </div>

    <div class="flex gap-2 mb-4">
      <button id="tronVeryFastBtn" class="bg-red-400 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm">
        ⚡ Very Fast
      </button>
      <button id="tronFastBtn" class="bg-orange-400 hover:bg-orange-600 text-white font-bold py-1 px-3 rounded text-sm">
        🚀 Fast
      </button>
      <button id="tronNormalBtn" class="bg-blue-400 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm">
        🚶 Normal
      </button>
      <button id="tronSlowBtn" class="bg-gray-400 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded text-sm">
        🐌 Slow
      </button>
      <button id="demonstrateSpeedsBtn" class="bg-purple-400 hover:bg-purple-600 text-white font-bold py-1 px-3 rounded text-sm">
        🎬 Demo Speeds
      </button>
    </div>
    
    <canvas id="canvas" width="600" height="600" class="bg-black border-2 border-white"></canvas>
    
    <div class="text-white text-sm max-w-md text-center">
      <p><strong>Auto Mode:</strong> Generate random paths from deadzone border to canvas border</p>
      <p><strong>Tron Mode:</strong> Animate paths with neon blue Tron-style effects</p>
      <p><strong>Speed Control:</strong> Test different animation speeds from very fast to slow</p>
    </div>
  </div>
`

const canvas = CanvasManager.initCanvas()
canvas.initGrid(50, 50, 200, 150, {x: 300, y: 300})
canvas.setupInteractivePathfinding()
canvas.drawRandomPaths()

// Event listeners pour les nouveaux boutons Tron
document.getElementById('testTronBtn')?.addEventListener('click', () => {
  console.log('🚀 Lancement de la démonstration Tron complète')
  canvas.demonstrateTronFeatures()
})

document.getElementById('tronSimultaneousBtn')?.addEventListener('click', () => {
  console.log('🎬 Test animation simultanée')
  canvas.testTronAnimation('simultaneous')
})

document.getElementById('tronSequentialBtn')?.addEventListener('click', () => {
  console.log('🎬 Test animation séquentielle')
  canvas.testTronAnimation('sequential')
})

document.getElementById('tronStaticBtn')?.addEventListener('click', () => {
  console.log('🎨 Test affichage statique Tron')
  canvas.testTronAnimation('static')
})

// Event listeners pour les nouvelles vitesses d'animation
document.getElementById('tronVeryFastBtn')?.addEventListener('click', () => {
  console.log('⚡ Test animation très rapide')
  canvas.testTronAnimation('very-fast')
})

document.getElementById('tronFastBtn')?.addEventListener('click', () => {
  console.log('🚀 Test animation rapide')
  canvas.testTronAnimation('fast')
})

document.getElementById('tronNormalBtn')?.addEventListener('click', () => {
  console.log('🚶 Test animation normale')
  canvas.testTronAnimation('normal')
})

document.getElementById('tronSlowBtn')?.addEventListener('click', () => {
  console.log('🐌 Test animation lente')
  canvas.testTronAnimation('slow')
})

document.getElementById('demonstrateSpeedsBtn')?.addEventListener('click', () => {
  console.log('🎬 Démonstration de toutes les vitesses')
  canvas.demonstrateAnimationSpeeds()
})

// Exemple d'utilisation avec durée personnalisée (utilisable dans la console)
// canvas.testTronAnimationWithDuration(3000) // Animation de 3 secondes