import MathUtils from '../utils/MathUtils'
import type GridManager from '../grid/GridManager'
import type PathfindingEngine from '../pathfinding/PathfindingEngine'
import type RandomPathGenerator from '../pathfinding/RandomPathGenerator'
import type CanvasRenderer from '../rendering/CanvasRenderer'
import type { Point, RandomPath, StatisticsData } from '../types'

export default class InteractionHandler {
  private startPoint: Point | null = null
  private endPoint: Point | null = null

  constructor(
    private canvas: HTMLCanvasElement,
    private gridManager: GridManager,
    private pathfindingEngine: PathfindingEngine,
    private randomPathGenerator: RandomPathGenerator,
    private renderer: CanvasRenderer,
    private onRedraw: () => void,
    private randomPaths: RandomPath[]
  ) {}

  /**
   * Configure tous les gestionnaires d'événements
   */
  public setupEventHandlers(): void {
    this.setupCanvasClick()
    this.setupButtons()
  }

  /**
   * Configure le gestionnaire de clic sur le canvas
   */
  private setupCanvasClick(): void {
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this))
  }

  /**
   * Gère les clics sur le canvas pour la création de chemins manuels
   */
  private handleCanvasClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const nearestPoint = this.gridManager.findNearestGridPoint(x, y)
    
    if (nearestPoint) {
      if (!this.startPoint) {
        // Premier clic : définir le point de départ
        this.startPoint = nearestPoint
        this.onRedraw()
        this.renderer.drawSpecialPoints(this.startPoint)
      } else if (!this.endPoint) {
        // Deuxième clic : définir le point d'arrivée et calculer le chemin
        this.endPoint = nearestPoint
        this.onRedraw()
        this.renderer.drawSpecialPoints(this.startPoint, this.endPoint)
        
        const path = this.pathfindingEngine.aStar(this.startPoint, this.endPoint)
        if (path) {
          this.renderer.drawPath(path)
        } else {
          console.log('Aucun chemin trouvé!')
          alert('Aucun chemin trouvé!')
        }
      } else {
        // Troisième clic : réinitialiser avec un nouveau point de départ
        this.startPoint = nearestPoint
        this.endPoint = null
        this.onRedraw()
        this.renderer.drawSpecialPoints(this.startPoint)
      }
    }
  }

  /**
   * Configure tous les boutons de l'interface
   */
  private setupButtons(): void {
    this.setupResetButton()
    this.setupRandomPathButton()
    this.setupClearPathButton()
    this.setupGenerateRandomPathsButton()
    this.setupClearRandomPathsButton()
    this.setupShowStatsButton()
  }

  /**
   * Bouton de réinitialisation des points
   */
  private setupResetButton(): void {
    document.getElementById('resetBtn')?.addEventListener('click', () => {
      this.startPoint = null
      this.endPoint = null
      this.onRedraw()
    })
  }

  /**
   * Bouton de génération de chemin aléatoire manuel
   */
  private setupRandomPathButton(): void {
    document.getElementById('randomPathBtn')?.addEventListener('click', () => {
      const gridPoints = this.gridManager.getGridPoints()
      if (gridPoints.length < 2) return
      
      const randomStart = gridPoints[Math.floor(Math.random() * gridPoints.length)]
      const randomEnd = gridPoints[Math.floor(Math.random() * gridPoints.length)]
      
      if (!MathUtils.arePointsEqual(randomStart, randomEnd)) {
        this.startPoint = randomStart
        this.endPoint = randomEnd
        this.onRedraw()
        
                 this.renderer.drawSpecialPoints(this.startPoint || undefined, this.endPoint || undefined)
         
         const path = this.pathfindingEngine.aStar(this.startPoint, this.endPoint)
         if (path) {
           this.renderer.drawPath(path)
         }
       }
     })
   }

   /**
    * Bouton d'effacement du chemin manuel
   */
  private setupClearPathButton(): void {
    document.getElementById('clearPathBtn')?.addEventListener('click', () => {
      this.onRedraw()
      this.renderer.drawSpecialPoints(this.startPoint || undefined, this.endPoint || undefined)
    })
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
      this.renderer.drawSpecialPoints(this.startPoint || undefined, this.endPoint || undefined)
    })
  }

  /**
   * Bouton d'effacement des chemins automatiques
   */
  private setupClearRandomPathsButton(): void {
    document.getElementById('clearRandomPathsBtn')?.addEventListener('click', () => {
      this.randomPaths.length = 0
      this.onRedraw()
      this.renderer.drawSpecialPoints(this.startPoint || undefined, this.endPoint || undefined)
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
   * Obtient le point de départ actuel
   */
  public getStartPoint(): Point | null {
    return this.startPoint
  }

  /**
   * Obtient le point d'arrivée actuel
   */
  public getEndPoint(): Point | null {
    return this.endPoint
  }

  /**
   * Définit le point de départ
   */
  public setStartPoint(point: Point | null): void {
    this.startPoint = point
  }

  /**
   * Définit le point d'arrivée
   */
  public setEndPoint(point: Point | null): void {
    this.endPoint = point
  }

  /**
   * Réinitialise les points de départ et d'arrivée
   */
  public resetPoints(): void {
    this.startPoint = null
    this.endPoint = null
  }

  /**
   * Vérifie si des points sont sélectionnés
   */
  public hasSelectedPoints(): boolean {
    return this.startPoint !== null || this.endPoint !== null
  }

  /**
   * Gère les raccourcis clavier (optionnel)
   */
  public setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'r':
        case 'R':
          // Réinitialiser les points
          this.resetPoints()
          this.onRedraw()
          break
        case 'g':
        case 'G':
          // Générer des chemins aléatoires
          document.getElementById('generateRandomPathsBtn')?.click()
          break
        case 'c':
        case 'C':
          // Effacer les chemins
          document.getElementById('clearRandomPathsBtn')?.click()
          break
        case 'Escape':
          // Annuler la sélection
          this.resetPoints()
          this.onRedraw()
          break
      }
    })
  }

  /**
   * Active/désactive les raccourcis clavier
   */
  public enableKeyboardShortcuts(): void {
    this.setupKeyboardShortcuts()
  }

  /**
   * Obtient les informations d'état pour le débogage
   */
  public getDebugInfo(): object {
    return {
      startPoint: this.startPoint,
      endPoint: this.endPoint,
      randomPathsCount: this.randomPaths.length,
      hasSelectedPoints: this.hasSelectedPoints()
    }
  }
} 