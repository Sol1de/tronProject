import MathUtils from './MathUtils'
import type GridManager from './GridManager'
import type PathfindingEngine from './PathfindingEngine'
import type RandomPathGenerator from './RandomPathGenerator'
import type CanvasRenderer from './CanvasRenderer'
import type { Point, RandomPath, StatisticsData } from '../types'

export default class InteractionHandler {
  private canvas: HTMLCanvasElement
  private gridManager: GridManager
  private pathfindingEngine: PathfindingEngine
  private randomPathGenerator: RandomPathGenerator
  private renderer: CanvasRenderer
  private onRedraw: () => void
  private randomPaths: RandomPath[]

  constructor(
    canvas: HTMLCanvasElement,
    gridManager: GridManager,
    pathfindingEngine: PathfindingEngine,
    randomPathGenerator: RandomPathGenerator,
    renderer: CanvasRenderer,
    onRedraw: () => void,
    randomPaths: RandomPath[]
  ) {
    this.canvas = canvas
    this.gridManager = gridManager
    this.pathfindingEngine = pathfindingEngine
    this.randomPathGenerator = randomPathGenerator
    this.renderer = renderer
    this.onRedraw = onRedraw
    this.randomPaths = randomPaths
  }

  /**
   * Configure tous les gestionnaires d'événements
   */
  public setupEventHandlers(): void {
    this.setupButtons()
  }

  /**
   * Configure tous les boutons de l'interface
   */
  private setupButtons(): void {
    this.setupGenerateRandomPathsButton()
    this.setupClearRandomPathsButton()
    this.setupShowStatsButton()
  }

  /**
   * Bouton de génération de chemins automatiques
   */
  private setupGenerateRandomPathsButton(): void {
    document.getElementById('generateRandomPathsBtn')?.addEventListener('click', () => {
      // Effacer les chemins précédents
      this.randomPaths.length = 0
      
      // Générer de nouveaux chemins
      const newPaths = this.randomPathGenerator.generateRandomPaths()
      this.randomPaths.push(...newPaths)
      
      // Redessiner
      this.onRedraw()
      this.renderer.drawRandomPaths(this.randomPaths)
    })
  }

  /**
   * Bouton d'effacement des chemins automatiques
   */
  private setupClearRandomPathsButton(): void {
    document.getElementById('clearRandomPathsBtn')?.addEventListener('click', () => {
      this.randomPaths.length = 0
      this.onRedraw()
    })
  }

  /**
   * Bouton d'affichage des statistiques
   */
  private setupShowStatsButton(): void {
    document.getElementById('showStatsBtn')?.addEventListener('click', () => {
      const stats = this.getRandomPathsStats()
      const message = `📊 Statistiques des chemins aléatoires:
      
• Chemins créés: ${stats.totalPaths}
• Points deadzone disponibles: ${stats.deadzonePointsAvailable}
• Points deadzone utilisés: ${stats.deadzonePointsUsed}
• Points canvas disponibles: ${stats.canvasPointsAvailable}
• Points canvas utilisés: ${stats.canvasPointsUsed}

Consultez la console pour plus de détails.`
      
      alert(message)
      console.log('📊 Statistiques complètes:', stats)
      console.log('🔍 Chemins actuels:', this.randomPaths)
    })
  }

  /**
   * Calcule les statistiques des chemins aléatoires
   */
  private getRandomPathsStats(): StatisticsData {
    const deadzonePoints = this.gridManager.getDeadzoneBorderPoints()
    const canvasPoints = this.gridManager.getCanvasBorderPoints()
    
    return {
      totalPaths: this.randomPaths.length,
      deadzonePointsAvailable: deadzonePoints.filter(p => !p.isUsed).length,
      canvasPointsAvailable: canvasPoints.filter(p => !p.isUsed).length,
      deadzonePointsUsed: deadzonePoints.filter(p => p.isUsed).length,
      canvasPointsUsed: canvasPoints.filter(p => p.isUsed).length
    }
  }

  /**
   * Active les raccourcis clavier pour l'interface
   */
  public setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Ignorer si on tape dans un input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key.toLowerCase()) {
        case 'g':
          // Générer des chemins automatiques
          document.getElementById('generateRandomPathsBtn')?.click()
          break
        case 'c':
          // Effacer les chemins automatiques
          document.getElementById('clearRandomPathsBtn')?.click()
          break
        case 's':
          // Afficher les statistiques
          document.getElementById('showStatsBtn')?.click()
          break
        case 'escape':
          // Effacer tous les chemins
          document.getElementById('clearRandomPathsBtn')?.click()
          break
      }
    })
  }

  /**
   * Active les raccourcis clavier
   */
  public enableKeyboardShortcuts(): void {
    this.setupKeyboardShortcuts()
  }

  /**
   * Retourne des informations de debug sur l'état actuel
   */
  public getDebugInfo(): object {
    return {
      randomPathsCount: this.randomPaths.length,
      stats: this.getRandomPathsStats()
    }
  }
} 