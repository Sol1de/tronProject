import './style.css'
import CanvasManager from './classes/CanvasManager'

// Configuration par défaut avec nombre optimal de chemins
let canvas: CanvasManager

const defaultConfig = {
  grid: {
    sizeWidth: 50,
    sizeHeight: 50,
    deadZoneWidth: 200,
    deadZoneHeight: 150,
    centerX: 300,
    centerY: 300,
    visible: false
  },
  animation: {
    mode: 'simultaneous' as 'simultaneous' | 'sequential' | 'static',
    speed: 'normal' as 'very-fast' | 'fast' | 'normal' | 'slow',
    duration: 2000,
    lineWidth: 2
  },
  paths: {
    numberOfPaths: 12, // Sera mis à jour dynamiquement
    color: '#ff6b35',
    tronColor: '#00bfff'
  }
}

let currentConfig = {
  grid: { ...defaultConfig.grid },
  animation: { ...defaultConfig.animation },
  paths: { ...defaultConfig.paths }
}

let isAnimating = false

document.querySelector<HTMLDivElement>('#app')!.innerHTML = /*html*/`
  <div class="flex h-screen bg-gray-50 text-gray-900">
    
    <!-- Panneau de Configuration à Gauche -->
    <div class="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
      <div class="space-y-6">
        
        <!-- Titre -->
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Tron Canvas</h1>
          <p class="text-sm text-gray-600">Configuration des paramètres</p>
        </div>
        
        <!-- Section Animation -->
        <div class="space-y-4">
          <div class="border-b border-gray-200 pb-2">
            <h3 class="text-lg font-semibold text-gray-800">Animation</h3>
          </div>
          
          <!-- Bouton Principal d'Animation -->
          <button id="launchAnimationBtn" class="w-full bg-gray-900 hover:bg-gray-700 text-white hover:text-white font-medium py-3 px-4 rounded-md transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:text-white">
            <span id="launchBtnText" class="text-black hover:text-white">Lancer l'Animation</span>
          </button>
          
          <!-- Mode d'Animation -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Mode d'Animation</label>
            <select id="animationMode" class="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent">
              <option value="simultaneous">Simultané</option>
              <option value="sequential">Séquentiel</option>
              <option value="static">Statique</option>
            </select>
          </div>
          
          <!-- Vitesse d'Animation -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Vitesse</label>
            <select id="animationSpeed" class="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent">
              <option value="very-fast">Très Rapide</option>
              <option value="fast">Rapide</option>
              <option value="normal" selected>Normal</option>
              <option value="slow">Lent</option>
            </select>
          </div>
          
          <!-- Durée d'Animation (ms) -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Durée (ms)</label>
            <div class="flex items-center space-x-3">
              <input type="range" id="animationDuration" min="500" max="5000" step="100" value="2000" class="flex-1 slider">
              <span id="durationValue" class="text-xs bg-gray-100 px-2 py-1 rounded min-w-[60px] text-center font-mono">2000ms</span>
            </div>
          </div>
          
          <!-- Épaisseur des Lignes -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Épaisseur</label>
            <div class="flex items-center space-x-3">
              <input type="range" id="lineWidth" min="1" max="8" step="1" value="2" class="flex-1 slider">
              <span id="lineWidthValue" class="text-xs bg-gray-100 px-2 py-1 rounded min-w-[40px] text-center font-mono">2px</span>
            </div>
          </div>
        </div>
        
        <!-- Section Chemins -->
        <div class="space-y-4">
          <div class="border-b border-gray-200 pb-2">
            <h3 class="text-lg font-semibold text-gray-800">Chemins</h3>
          </div>
          
          <!-- Nombre de Chemins -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Nombre de Chemins</label>
            <div class="flex items-center space-x-3">
              <input type="range" id="numberOfPaths" min="1" max="50" step="1" value="12" class="flex-1 slider">
              <span id="pathCountValue" class="text-xs bg-gray-100 px-2 py-1 rounded min-w-[40px] text-center font-mono">12</span>
            </div>
          </div>
          
          <!-- Couleur des Chemins -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Couleur Normale</label>
            <div class="flex items-center space-x-3">
              <input type="color" id="pathColor" value="#ff6b35" class="w-12 h-8 rounded border border-gray-300 cursor-pointer">
              <span class="text-xs text-gray-500">Couleur des chemins normaux</span>
            </div>
          </div>
          
          <!-- Couleur Tron -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Couleur Tron</label>
            <div class="flex items-center space-x-3">
              <input type="color" id="tronColor" value="#00bfff" class="w-12 h-8 rounded border border-gray-300 cursor-pointer">
              <span class="text-xs text-gray-500">Couleur des effets Tron</span>
            </div>
          </div>
        </div>
        
        <!-- Section Grille -->
        <div class="space-y-4">
          <div class="border-b border-gray-200 pb-2">
            <h3 class="text-lg font-semibold text-gray-800">Grille</h3>
          </div>
          
          <!-- Affichage Grille -->
          <div class="flex items-center space-x-2">
            <input type="checkbox" id="showGrid" class="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500">
            <label for="showGrid" class="text-sm text-gray-700">Afficher la grille</label>
          </div>
          
          <!-- Taille Grille Width -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Taille Grille (Largeur)</label>
            <div class="flex items-center space-x-3">
              <input type="range" id="gridSizeWidth" min="20" max="100" step="5" value="50" class="flex-1 slider">
              <span id="gridWidthValue" class="text-xs bg-gray-100 px-2 py-1 rounded min-w-[40px] text-center font-mono">50</span>
            </div>
          </div>
          
          <!-- Taille Grille Height -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Taille Grille (Hauteur)</label>
            <div class="flex items-center space-x-3">
              <input type="range" id="gridSizeHeight" min="20" max="100" step="5" value="50" class="flex-1 slider">
              <span id="gridHeightValue" class="text-xs bg-gray-100 px-2 py-1 rounded min-w-[40px] text-center font-mono">50</span>
            </div>
          </div>
          
          <!-- Dead Zone Width -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Zone Morte (Largeur)</label>
            <div class="flex items-center space-x-3">
              <input type="range" id="deadZoneWidth" min="100" max="400" step="10" value="200" class="flex-1 slider">
              <span id="deadZoneWidthValue" class="text-xs bg-gray-100 px-2 py-1 rounded min-w-[50px] text-center font-mono">200</span>
            </div>
          </div>
          
          <!-- Dead Zone Height -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Zone Morte (Hauteur)</label>
            <div class="flex items-center space-x-3">
              <input type="range" id="deadZoneHeight" min="100" max="300" step="10" value="150" class="flex-1 slider">
              <span id="deadZoneHeightValue" class="text-xs bg-gray-100 px-2 py-1 rounded min-w-[50px] text-center font-mono">150</span>
            </div>
          </div>
        </div>
        
        <!-- Section Utilitaires -->
        <div class="space-y-4">
          <div class="border-b border-gray-200 pb-2">
            <h3 class="text-lg font-semibold text-gray-800">Utilitaires</h3>
          </div>
          
          <!-- Actions Utilitaires -->
          <div class="grid grid-cols-1 gap-2">
            <button id="resetConfigBtn" class="bg-gray-900 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-md text-sm transition-colors">
              Reset Config
            </button>
          </div>
        </div>
        
      </div>
    </div>
    
    <!-- Zone Canvas à Droite -->
    <div class="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
      
      <!-- Informations -->
      <div class="text-center mb-6 max-w-2xl">
        <h2 class="text-xl font-bold text-gray-900 mb-2">Canvas Tron Pathfinding</h2>
        <p class="text-sm text-gray-600">
          Configurez les paramètres dans le panneau de gauche et cliquez sur "Lancer l'Animation" pour voir le résultat.
        </p>
        <div id="statusIndicator" class="mt-2 text-xs text-gray-500">
          Prêt à lancer une animation
        </div>
      </div>
      
      <!-- Canvas avec position relative pour le SVG overlay -->
      <div class="relative">
        <canvas id="canvas" width="600" height="600" class="bg-black border border-gray-300 rounded-lg shadow-lg"></canvas>
        
        <!-- SVG Logo Tron positionné au centre du canvas -->
        <div id="tron-logo">
          <svg width="1001" height="236" viewBox="0 0 1001 236" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M93 10V59.5L86 67H7.5L1 59.5V9L8 2H85.5L93 10ZM13 14V55H81V14H13Z" fill="#FCFEFF" class="svg-elem-1"></path>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M174 72V227.5L166.5 235H113.5L106 227.5V72C107 18.5 155.5 2 161.5 2H437C464.5 2 506 25.5 506 67H177.5C177.5 67 174 68 174 72ZM118 224V72C118 34.5 150 14 171 14H430.5C471.5 14 489 44 491 55H175.5C173 55 162 61 162 72V224H118Z" fill="#FCFEFF" class="svg-elem-2"></path>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M93 10V59.5L86 67H7.5L1 59.5V9L8 2H85.5L93 10ZM13 14V55H81V14H13Z" stroke="#5AAFF0" stroke-width="2" class="svg-elem-3"></path>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M174 72V227.5L166.5 235H113.5L106 227.5V72C107 18.5 155.5 2 161.5 2H437C464.5 2 506 25.5 506 67H177.5C177.5 67 174 68 174 72ZM118 224V72C118 34.5 150 14 171 14H430.5C471.5 14 489 44 491 55H175.5C173 55 162 61 162 72V224H118Z" stroke="#5AAFF0" stroke-width="2" class="svg-elem-4"></path>
            <path d="M504.894 87C502.432 109.844 491.356 125.382 477.721 135.381C463.84 145.56 447.29 150.007 434.462 150.501L433.5 150.538V152.923L433.803 153.217L505 222.422V234H430.924L337.5 137.595V94.3945L344.433 87H504.894ZM317.086 87L324 93.9141V227.086L317.086 234H264.914L258 227.086V93.9141L264.914 87H317.086ZM268 224H314V97H268V224ZM347 134.414L436.586 224H491.925L490.205 222.291L408.425 141H433C440.925 141 453.097 138.454 464.561 131.867C476.044 125.269 486.864 114.585 491.954 98.2979L492.36 97H347V134.414Z" fill="#FCFEFF" stroke="#5AAFF0" stroke-width="2" class="svg-elem-5"></path>
            <path d="M632 3C697.19 3 750 54.731 750 118.5C750 182.269 697.19 234 632 234C566.81 234 514 182.269 514 118.5C514 54.731 566.81 3 632 3ZM632.5 13C572.599 13 524 60.4358 524 119C524 177.564 592.599 225 632.5 225C692.401 225 741 177.564 741 119C741 60.4358 692.401 13 632.5 13ZM633 58C667.809 58 696 85.7731 696 120C696 154.227 667.809 182 633 182C598.191 182 570 154.227 570 120C570 85.7731 598.191 58 633 58ZM633 68C603.747 68 580 91.263 580 120C580 148.737 603.747 172 633 172C662.253 172 686 148.737 686 120C686 91.263 662.253 68 633 68Z" fill="#FCFEFF" stroke="#5AAFF0" stroke-width="2" class="svg-elem-6"></path>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M760 228V9L766.5 2H794L878 96V133L871 140H826V228L819 235H767L760 228ZM771 224H815V129H867V101L790 13H771V224Z" fill="#FCFEFF" class="svg-elem-7"></path>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M1000 8V227L993.5 234H966L882 140V103L889 96H934V8L941 1H993L1000 8ZM989 12H945V107H893V135L970 223H989V12Z" fill="#FCFEFF" class="svg-elem-8"></path>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M760 228V9L766.5 2H794L878 96V133L871 140H826V228L819 235H767L760 228ZM771 224H815V129H867V101L790 13H771V224Z" stroke="#5AAFF0" stroke-width="2" class="svg-elem-9"></path>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M1000 8V227L993.5 234H966L882 140V103L889 96H934V8L941 1H993L1000 8ZM989 12H945V107H893V135L970 223H989V12Z" stroke="#5AAFF0" stroke-width="2" class="svg-elem-10"></path>
          </svg>
        </div>
      </div>
      
      <!-- Status et aide -->
      <div class="mt-6 text-center text-xs text-gray-500 max-w-md">
        <p>Les paramètres sont mis à jour en arrière-plan. Cliquez sur "Lancer l'Animation" pour appliquer les changements.</p>
      </div>
      
    </div>
  </div>
`

// Fonction pour calculer et positionner le SVG dans la deadzone
function fitSvgInDeadzone(deadZone: {basePoint: {x: number, y: number}, deadZoneWidth: number, deadZoneHeight: number}): void {
  const tronLogo = document.getElementById('tron-logo')
  const tronSvg = tronLogo?.querySelector('svg') as SVGElement
  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  
  if (!tronLogo || !tronSvg || !canvas) return
  
  const svgOriginalWidth = 1001
  const svgOriginalHeight = 236
  const svgAspectRatio = svgOriginalWidth / svgOriginalHeight
  
  const availableWidth = deadZone.deadZoneWidth * 0.95
  const availableHeight = deadZone.deadZoneHeight * 0.95
  const deadzoneAspectRatio = availableWidth / availableHeight
  
  let finalWidth: number
  let finalHeight: number
  
  if (svgAspectRatio > deadzoneAspectRatio) {
    finalWidth = availableWidth
    finalHeight = availableWidth / svgAspectRatio
  } else {
    finalHeight = availableHeight
    finalWidth = availableHeight * svgAspectRatio
  }
  
  const centerX = deadZone.basePoint.x
  const centerY = deadZone.basePoint.y
  const left = centerX - finalWidth / 2
  const top = centerY - finalHeight / 2
  
  tronLogo.style.position = 'absolute'
  tronLogo.style.left = `${left}px`
  tronLogo.style.top = `${top}px`
  tronLogo.style.width = `${finalWidth}px`
  tronLogo.style.height = `${finalHeight}px`
  
  tronSvg.style.width = '100%'
  tronSvg.style.height = '100%'
  tronSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
}

// Fonction pour nettoyer/masquer le logo SVG
function hideTronLogo(): void {
  const tronLogo = document.getElementById('tron-logo')
  const tronSvg = tronLogo?.querySelector('svg')
  
  if (tronLogo && tronSvg) {
    tronLogo.classList.remove('show')
    tronSvg.classList.remove('active')
    
    const svgElements = tronSvg.querySelectorAll('[class*="svg-elem-"]')
    svgElements.forEach(element => {
      const el = element as HTMLElement
      el.style.animation = 'none'
      el.style.transition = 'none'
    })
  }
}

// Fonction pour déclencher l'animation du logo Tron
function triggerTronLogoAnimation(deadZone?: {basePoint: {x: number, y: number}, deadZoneWidth: number, deadZoneHeight: number}): void {
  const tronLogo = document.getElementById('tron-logo')
  const tronSvg = tronLogo?.querySelector('svg')
  
  if (!tronLogo || !tronSvg) return
  
  if (deadZone) {
    fitSvgInDeadzone(deadZone)
  }
  
  hideTronLogo()
  tronLogo.offsetHeight
  
  setTimeout(() => {
    const svgElements = tronSvg.querySelectorAll('[class*="svg-elem-"]')
    svgElements.forEach(element => {
      const el = element as HTMLElement
      el.style.animation = ''
      el.style.transition = ''
    })
    
    tronSvg.getBoundingClientRect()
    tronLogo.classList.add('show')
    
    setTimeout(() => {
      tronSvg.classList.add('active')
    }, 50)
    
  }, 200)
}

// Fonction pour mettre à jour le statut
function updateStatus(message: string): void {
  const statusElement = document.getElementById('statusIndicator')
  if (statusElement) {
    statusElement.textContent = message
  }
}

// Fonction pour lancer l'animation avec la configuration actuelle
function launchAnimation(): void {
  if (isAnimating) {
    updateStatus('Animation en cours... Veuillez patienter')
    return
  }

  isAnimating = true
  updateStatus('Génération des chemins...')
  
  // Désactiver le bouton et changer son texte
  const launchBtn = document.getElementById('launchAnimationBtn') as HTMLButtonElement
  const launchBtnText = document.getElementById('launchBtnText')!
  launchBtn.disabled = true
  launchBtnText.textContent = 'Animation en cours...'
  
  // Effacer le canvas
  canvas.getRenderer().clear()
  
  // Appliquer la nouvelle configuration à la grille
  canvas.initGrid(
    currentConfig.grid.sizeWidth,
    currentConfig.grid.sizeHeight,
    currentConfig.grid.deadZoneWidth,
    currentConfig.grid.deadZoneHeight,
    { x: currentConfig.grid.centerX, y: currentConfig.grid.centerY }
  )
  
  // FORCER la régénération aléatoire des chemins à chaque lancement
  canvas.clearRandomPaths()
  canvas.setRandomPaths(currentConfig.paths.numberOfPaths)
  
  // Afficher la grille si demandé (avant l'animation)
  if (currentConfig.grid.visible) {
    canvas.drawGrid(true)
  }
  
  updateStatus('Lancement de l\'animation...')
  
  const deadZone = canvas.getGridManager().getDeadZone()
  
  // Callback à la fin de l'animation
  const onComplete = () => {
    isAnimating = false
    launchBtn.disabled = false
    launchBtnText.textContent = 'Lancer l\'Animation'
    updateStatus('Animation terminée - Prêt pour une nouvelle animation')
  }
  
      // Lancer l'animation selon le mode sélectionné avec les couleurs de la config
    switch (currentConfig.animation.mode) {
      case 'simultaneous':
        switch (currentConfig.animation.speed) {
          case 'very-fast':
            canvas.animateTronPathsVeryFast(currentConfig.animation.lineWidth, true, onComplete, currentConfig.paths.tronColor)
            break
          case 'fast':
            canvas.animateTronPathsFast(currentConfig.animation.lineWidth, true, onComplete, currentConfig.paths.tronColor)
            break
          case 'normal':
            canvas.animateTronPathsNormal(currentConfig.animation.lineWidth, true, onComplete, currentConfig.paths.tronColor)
            break
          case 'slow':
            canvas.animateTronPathsSlow(currentConfig.animation.lineWidth, true, onComplete, currentConfig.paths.tronColor)
            break
        }
        break
      
      case 'sequential':
        canvas.animateTronPathsSequentially(
          currentConfig.animation.lineWidth,
          currentConfig.animation.duration / currentConfig.paths.numberOfPaths,
          100,
          true,
          onComplete,
          currentConfig.paths.tronColor
        )
        break
      
      case 'static':
        canvas.drawTronPaths(currentConfig.animation.lineWidth, true, currentConfig.paths.tronColor)
        onComplete()
        break
    }
  
  // Déclencher l'animation du logo
  if (deadZone) {
    triggerTronLogoAnimation(deadZone)
  }
}

// Fonction pour calculer le nombre optimal de chemins
function calculateOptimalPaths(): number {
  if (!canvas) return 12
  
  // Réinitialiser temporairement la grille pour calculer
  canvas.initGrid(
    currentConfig.grid.sizeWidth,
    currentConfig.grid.sizeHeight,
    currentConfig.grid.deadZoneWidth,
    currentConfig.grid.deadZoneHeight,
    { x: currentConfig.grid.centerX, y: currentConfig.grid.centerY }
  )
  
  const canvasBorderPoints = canvas.getGridManager().getCanvasBorderPoints()
  const deadzoneBorderPoints = canvas.getGridManager().getDeadzoneBorderPoints()
  
  // Prendre le maximum entre les deux avec un minimum de 12
  return Math.max(canvasBorderPoints.length, deadzoneBorderPoints.length, 12)
}

// Fonction pour mettre à jour les valeurs par défaut après initialisation
function updateDefaultValues(): void {
  const optimalPathCount = calculateOptimalPaths()
  currentConfig.paths.numberOfPaths = optimalPathCount
  
  // Mettre à jour l'interface
  const pathSlider = document.getElementById('numberOfPaths') as HTMLInputElement
  const pathValue = document.getElementById('pathCountValue')!
  
  pathSlider.value = optimalPathCount.toString()
  pathSlider.max = Math.max(optimalPathCount * 2, 50).toString()
  pathValue.textContent = optimalPathCount.toString()
  
  updateStatus(`Prêt avec ${optimalPathCount} chemins optimaux`)
}

// Initialisation du canvas - NOIR au démarrage
canvas = CanvasManager.initCanvas()
canvas.initGrid(
  currentConfig.grid.sizeWidth,
  currentConfig.grid.sizeHeight,
  currentConfig.grid.deadZoneWidth,
  currentConfig.grid.deadZoneHeight,
  { x: currentConfig.grid.centerX, y: currentConfig.grid.centerY }
)
canvas.setupInteractivePathfinding()

// Calculer et appliquer les valeurs optimales après initialisation
updateDefaultValues()

// === EVENT LISTENERS ===

// Bouton principal d'animation
document.getElementById('launchAnimationBtn')?.addEventListener('click', launchAnimation)

// TOUS LES AUTRES EVENT LISTENERS - MISE À JOUR EN ARRIÈRE-PLAN SEULEMENT

// Mode d'animation
document.getElementById('animationMode')?.addEventListener('change', (e) => {
  currentConfig.animation.mode = (e.target as HTMLSelectElement).value as any
  updateStatus('Configuration mise à jour')
})

// Vitesse d'animation
document.getElementById('animationSpeed')?.addEventListener('change', (e) => {
  currentConfig.animation.speed = (e.target as HTMLSelectElement).value as any
  updateStatus('Configuration mise à jour')
})

// Durée d'animation
document.getElementById('animationDuration')?.addEventListener('input', (e) => {
  currentConfig.animation.duration = parseInt((e.target as HTMLInputElement).value)
  document.getElementById('durationValue')!.textContent = `${currentConfig.animation.duration}ms`
  updateStatus('Configuration mise à jour')
})

// Épaisseur des lignes
document.getElementById('lineWidth')?.addEventListener('input', (e) => {
  currentConfig.animation.lineWidth = parseInt((e.target as HTMLInputElement).value)
  document.getElementById('lineWidthValue')!.textContent = `${currentConfig.animation.lineWidth}px`
  updateStatus('Configuration mise à jour')
})

// Nombre de chemins
document.getElementById('numberOfPaths')?.addEventListener('input', (e) => {
  currentConfig.paths.numberOfPaths = parseInt((e.target as HTMLInputElement).value)
  document.getElementById('pathCountValue')!.textContent = `${currentConfig.paths.numberOfPaths}`
  updateStatus('Configuration mise à jour')
})

// Couleur des chemins
document.getElementById('pathColor')?.addEventListener('input', (e) => {
  currentConfig.paths.color = (e.target as HTMLInputElement).value
  updateStatus('Configuration mise à jour')
})

// Couleur Tron
document.getElementById('tronColor')?.addEventListener('input', (e) => {
  currentConfig.paths.tronColor = (e.target as HTMLInputElement).value
  updateStatus('Configuration mise à jour')
})

// Affichage grille
document.getElementById('showGrid')?.addEventListener('change', (e) => {
  currentConfig.grid.visible = (e.target as HTMLInputElement).checked
  updateStatus('Configuration mise à jour')
})

// Taille grille largeur
document.getElementById('gridSizeWidth')?.addEventListener('input', (e) => {
  currentConfig.grid.sizeWidth = parseInt((e.target as HTMLInputElement).value)
  document.getElementById('gridWidthValue')!.textContent = `${currentConfig.grid.sizeWidth}`
  // Recalculer les chemins optimaux quand la grille change
  updateDefaultValues()
})

// Taille grille hauteur
document.getElementById('gridSizeHeight')?.addEventListener('input', (e) => {
  currentConfig.grid.sizeHeight = parseInt((e.target as HTMLInputElement).value)
  document.getElementById('gridHeightValue')!.textContent = `${currentConfig.grid.sizeHeight}`
  // Recalculer les chemins optimaux quand la grille change
  updateDefaultValues()
})

// Dead zone largeur
document.getElementById('deadZoneWidth')?.addEventListener('input', (e) => {
  currentConfig.grid.deadZoneWidth = parseInt((e.target as HTMLInputElement).value)
  document.getElementById('deadZoneWidthValue')!.textContent = `${currentConfig.grid.deadZoneWidth}`
  // Recalculer les chemins optimaux quand la deadzone change
  updateDefaultValues()
})

// Dead zone hauteur
document.getElementById('deadZoneHeight')?.addEventListener('input', (e) => {
  currentConfig.grid.deadZoneHeight = parseInt((e.target as HTMLInputElement).value)
  document.getElementById('deadZoneHeightValue')!.textContent = `${currentConfig.grid.deadZoneHeight}`
  // Recalculer les chemins optimaux quand la deadzone change
  updateDefaultValues()
})

// Reset config
document.getElementById('resetConfigBtn')?.addEventListener('click', () => {
  // Remettre les valeurs par défaut
  currentConfig.grid = { ...defaultConfig.grid }
  currentConfig.animation = { ...defaultConfig.animation }
  currentConfig.paths = { ...defaultConfig.paths }
  
  // Recalculer les optimaux et mettre à jour l'interface
  updateDefaultValues()
  
  // Mettre à jour tous les contrôles
  (document.getElementById('animationMode') as HTMLSelectElement).value = currentConfig.animation.mode;
  (document.getElementById('animationSpeed') as HTMLSelectElement).value = currentConfig.animation.speed;
  (document.getElementById('animationDuration') as HTMLInputElement).value = currentConfig.animation.duration.toString();
  (document.getElementById('lineWidth') as HTMLInputElement).value = currentConfig.animation.lineWidth.toString();
  (document.getElementById('pathColor') as HTMLInputElement).value = currentConfig.paths.color;
  (document.getElementById('tronColor') as HTMLInputElement).value = currentConfig.paths.tronColor;
  (document.getElementById('showGrid') as HTMLInputElement).checked = currentConfig.grid.visible;
  (document.getElementById('gridSizeWidth') as HTMLInputElement).value = currentConfig.grid.sizeWidth.toString();
  (document.getElementById('gridSizeHeight') as HTMLInputElement).value = currentConfig.grid.sizeHeight.toString();
  (document.getElementById('deadZoneWidth') as HTMLInputElement).value = currentConfig.grid.deadZoneWidth.toString();
  (document.getElementById('deadZoneHeight') as HTMLInputElement).value = currentConfig.grid.deadZoneHeight.toString();
  
  // Mettre à jour les valeurs affichées
  document.getElementById('durationValue')!.textContent = `${currentConfig.animation.duration}ms`;
  document.getElementById('lineWidthValue')!.textContent = `${currentConfig.animation.lineWidth}px`;
  document.getElementById('gridWidthValue')!.textContent = `${currentConfig.grid.sizeWidth}`;
  document.getElementById('gridHeightValue')!.textContent = `${currentConfig.grid.sizeHeight}`;
  document.getElementById('deadZoneWidthValue')!.textContent = `${currentConfig.grid.deadZoneWidth}`;
  document.getElementById('deadZoneHeightValue')!.textContent = `${currentConfig.grid.deadZoneHeight}`;
  
  updateStatus('Configuration réinitialisée')
})

// Exposer les fonctions globales
declare global {
  interface Window {
    triggerTronLogoAnimation: (deadZone?: {basePoint: {x: number, y: number}, deadZoneWidth: number, deadZoneHeight: number}) => void;
    hideTronLogo: () => void;
    currentConfig: typeof currentConfig;
  }
}
window.triggerTronLogoAnimation = triggerTronLogoAnimation
window.hideTronLogo = hideTronLogo
window.currentConfig = currentConfig

console.log('🚀 Interface Tron Canvas initialisée - Canvas noir au démarrage')