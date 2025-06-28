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
    
    <!-- Canvas avec position relative pour le SVG overlay -->
    <div class="relative">
      <canvas id="canvas" width="600" height="600" class="bg-black border-2 border-white"></canvas>
      
      <!-- SVG Logo Tron positionné au centre du canvas -->
      <div id="tron-logo">
        <svg width="1001" height="236" viewBox="0 0 1001 236" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M93 10V59.5L86 67H7.5L1 59.5V9L8 2H85.5L93 10ZM13 14V55H81V14H13Z" fill="#FCFEFF" class="svg-elem-1"></path>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M174 72V227.5L166.5 235H113.5L106 227.5V72C107 18.5 155.5 2 161.5 2H437C464.5 2 506 25.5 506 67H177.5C177.5 67 174 68 174 72ZM118 224V72C118 34.5 150 14 171 14H430.5C471.5 14 489 44 491 55H175.5C173 55 162 61 162 72V224H118Z" fill="#FCFEFF" class="svg-elem-2"></path>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M93 10V59.5L86 67H7.5L1 59.5V9L8 2H85.5L93 10ZM13 14V55H81V14H13Z" stroke="#5AAFF0" stroke-width="2" class="svg-elem-3"></path>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M174 72V227.5L166.5 235H113.5L106 227.5V72C107 18.5 155.5 2 161.5 2H437C464.5 2 506 25.5 506 67H177.5C177.5 67 174 68 174 72ZM118 224V72C118 34.5 150 14 171 14H430.5C471.5 14 489 44 491 55H175.5C173 55 162 61 162 72V224H118Z" stroke="#5AAFF0" stroke-width="2" class="svg-elem-4"></path>
          <path d="M504.894 87C502.432 109.844 491.356 125.382 477.721 135.381C463.84 145.56 447.29 150.007 434.462 150.501L433.5 150.538V152.923L433.803 153.217L505 222.422V234H430.924L337.5 137.595V94.3945L344.433 87H504.894ZM317.086 87L324 93.9141V227.086L317.086 234H264.914L258 227.086V93.9141L264.914 87H317.086ZM268 224H314V97H268V224ZM347 134.414L436.586 224H491.925L490.205 222.291L408.425 141H433C440.925 141 453.097 138.454 464.561 131.867C476.044 125.269 486.864 114.585 491.954 98.2979L492.36 97H347V134.414Z" fill="#FCFEFF" stroke="#5AAFF0" stroke-width="2" class="svg-elem-5"></path>
          <path d="M632 3C697.19 3 750 54.731 750 118.5C750 182.269 697.19 234 632 234C566.81 234 514 182.269 514 118.5C514 54.731 566.81 3 632 3ZM632.5 13C572.599 13 524 60.4358 524 119C524 177.564 572.599 225 632.5 225C692.401 225 741 177.564 741 119C741 60.4358 692.401 13 632.5 13ZM633 58C667.809 58 696 85.7731 696 120C696 154.227 667.809 182 633 182C598.191 182 570 154.227 570 120C570 85.7731 598.191 58 633 58ZM633 68C603.747 68 580 91.263 580 120C580 148.737 603.747 172 633 172C662.253 172 686 148.737 686 120C686 91.263 662.253 68 633 68Z" fill="#FCFEFF" stroke="#5AAFF0" stroke-width="2" class="svg-elem-6"></path>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M760 228V9L766.5 2H794L878 96V133L871 140H826V228L819 235H767L760 228ZM771 224H815V129H867V101L790 13H771V224Z" fill="#FCFEFF" class="svg-elem-7"></path>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M1000 8V227L993.5 234H966L882 140V103L889 96H934V8L941 1H993L1000 8ZM989 12H945V107H893V135L970 223H989V12Z" fill="#FCFEFF" class="svg-elem-8"></path>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M760 228V9L766.5 2H794L878 96V133L871 140H826V228L819 235H767L760 228ZM771 224H815V129H867V101L790 13H771V224Z" stroke="#5AAFF0" stroke-width="2" class="svg-elem-9"></path>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M1000 8V227L993.5 234H966L882 140V103L889 96H934V8L941 1H993L1000 8ZM989 12H945V107H893V135L970 223H989V12Z" stroke="#5AAFF0" stroke-width="2" class="svg-elem-10"></path>
        </svg>
      </div>
    </div>
    
    <div class="text-white text-sm max-w-md text-center">
      <p><strong>Auto Mode:</strong> Generate random paths from deadzone border to canvas border</p>
      <p><strong>Tron Mode:</strong> Animate paths with neon blue Tron-style effects</p>
      <p><strong>Speed Control:</strong> Test different animation speeds from very fast to slow</p>
    </div>
  </div>
`

// Fonction pour calculer et positionner le SVG dans la deadzone
function fitSvgInDeadzone(deadZone: {basePoint: {x: number, y: number}, deadZoneWidth: number, deadZoneHeight: number}): void {
  const tronLogo = document.getElementById('tron-logo')
  const tronSvg = tronLogo?.querySelector('svg') as SVGElement
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  
  if (!tronLogo || !tronSvg || !canvas) return
  
  // Dimensions originales du SVG
  const svgOriginalWidth = 1001
  const svgOriginalHeight = 236
  const svgAspectRatio = svgOriginalWidth / svgOriginalHeight
  
  // Dimensions de la deadzone avec une marge de sécurité
  const availableWidth = deadZone.deadZoneWidth * 0.7  // 70% pour plus de sécurité
  const availableHeight = deadZone.deadZoneHeight * 0.7
  const deadzoneAspectRatio = availableWidth / availableHeight
  
  let finalWidth: number
  let finalHeight: number
  
  // Calcul du ratio optimal pour fitting sans déformation
  if (svgAspectRatio > deadzoneAspectRatio) {
    // SVG plus large que la deadzone proportionnellement -> contrainte par la largeur
    finalWidth = availableWidth
    finalHeight = availableWidth / svgAspectRatio
    console.log('📐 SVG contrainte par la largeur')
  } else {
    // SVG plus haut que la deadzone proportionnellement -> contrainte par la hauteur  
    finalHeight = availableHeight
    finalWidth = availableHeight * svgAspectRatio
    console.log('📐 SVG contrainte par la hauteur')
  }
  
  // Position centrée dans la deadzone (coordonnées relatives au canvas)
  // Le canvas est à (0,0) dans son conteneur relatif
  const centerX = deadZone.basePoint.x
  const centerY = deadZone.basePoint.y
  const left = centerX - finalWidth / 2
  const top = centerY - finalHeight / 2
  
  // Application des styles au conteneur (position absolue relative au conteneur du canvas)
  tronLogo.style.position = 'absolute'
  tronLogo.style.left = `${left}px`
  tronLogo.style.top = `${top}px`
  tronLogo.style.width = `${finalWidth}px`
  tronLogo.style.height = `${finalHeight}px`
  
  // S'assurer que le SVG remplisse complètement son conteneur
  tronSvg.style.width = '100%'
  tronSvg.style.height = '100%'
  tronSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  
  console.log(`📊 Deadzone: ${deadZone.deadZoneWidth}x${deadZone.deadZoneHeight} au centre (${deadZone.basePoint.x}, ${deadZone.basePoint.y})`)
  console.log(`📊 Espace disponible: ${availableWidth.toFixed(1)}x${availableHeight.toFixed(1)}`)
  console.log(`📊 SVG calculé: ${finalWidth.toFixed(1)}x${finalHeight.toFixed(1)}`)
  console.log(`📊 Position finale: (${left.toFixed(1)}, ${top.toFixed(1)})`)
  console.log(`📊 Ratio SVG: ${svgAspectRatio.toFixed(2)} vs Ratio deadzone: ${deadzoneAspectRatio.toFixed(2)}`)
}

// Fonction pour déclencher l'animation du logo Tron
function triggerTronLogoAnimation(deadZone?: {basePoint: {x: number, y: number}, deadZoneWidth: number, deadZoneHeight: number}): void {
  console.log('🎨 Déclenchement de l\'animation du logo Tron')
  const tronLogo = document.getElementById('tron-logo')
  const tronSvg = tronLogo?.querySelector('svg')
  
  if (!tronLogo || !tronSvg) return
  
  // Calculer et positionner le SVG si les paramètres de deadzone sont fournis
  if (deadZone) {
    fitSvgInDeadzone(deadZone)
  }
  
  // Masquer d'abord le logo (pour le cas où il était déjà visible)
  tronLogo.classList.remove('show')
  tronSvg.classList.remove('active')
  
  // Afficher le logo et déclencher l'animation immédiatement
  setTimeout(() => {
    tronLogo.classList.add('show')
    tronSvg.classList.add('active')
    console.log('✨ Animation SVG démarrée et visible')
  }, 100) // Délai minimal pour s'assurer que les classes sont bien supprimées
}

const canvas = CanvasManager.initCanvas()
canvas.initGrid(50, 50, 200, 150, {x: 300, y: 300})
canvas.setupInteractivePathfinding()
canvas.drawRandomPaths()

// Event listeners pour les nouveaux boutons Tron avec animation du logo
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

// Event listeners pour les nouvelles vitesses d'animation avec logo
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

// Exposer la fonction pour qu'elle soit accessible depuis CanvasManager
declare global {
  interface Window {
    triggerTronLogoAnimation: (deadZone?: {basePoint: {x: number, y: number}, deadZoneWidth: number, deadZoneHeight: number}) => void;
  }
}
window.triggerTronLogoAnimation = triggerTronLogoAnimation

// Exemple d'utilisation avec durée personnalisée (utilisable dans la console)
// canvas.testTronAnimationWithDuration(3000) // Animation de 3 secondes