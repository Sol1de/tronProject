import MathUtils from './MathUtils'
import GridManager from './GridManager'
import PathfindingEngine from './PathfindingEngine'
import RandomPathGenerator from './RandomPathGenerator'
import CanvasRenderer from './CanvasRenderer'
import InteractionHandler from './InteractionHandler'
import StatisticsManager from './StatisticsManager'
import type { Point, RandomPath, GridConfig, StatisticsData } from '../types'

export default class CanvasManager {
  private gridManager: GridManager
  private pathfindingEngine: PathfindingEngine
  private randomPathGenerator: RandomPathGenerator
  private renderer: CanvasRenderer
  private interactionHandler: InteractionHandler
  private statisticsManager: StatisticsManager
  private randomPaths: RandomPath[] = []
  private showGrid: boolean = false

  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private width: number
  private height: number

  public constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) {
    this.canvas = canvas
    this.context = context
    this.width = width
    this.height = height
    
    // Initialisation des gestionnaires
    this.gridManager = new GridManager(width, height)
    this.pathfindingEngine = new PathfindingEngine(this.gridManager)
    this.randomPathGenerator = new RandomPathGenerator(this.gridManager, this.pathfindingEngine)
    this.renderer = new CanvasRenderer(canvas, context)
    this.statisticsManager = new StatisticsManager(this.gridManager)
    this.interactionHandler = new InteractionHandler(
      canvas,
      this.gridManager,
      this.pathfindingEngine,
      this.randomPathGenerator,
      this.renderer,
      this.redraw.bind(this),
      this.randomPaths
    )
  }

  public static initCanvas(): CanvasManager {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    const context = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    
    if (!context) {
      throw new Error('Failed to get canvas context')
    }
    return new CanvasManager(canvas, context, width, height)
  }

  // === MÉTHODES PUBLIQUES ===

  /**
   * Initialise la grille avec les paramètres donnés
   */
  public initGrid(gridSizeWidth: number, gridSizeHeight: number, deadZoneWidth?: number, deadZoneHeight?: number, basePoint?: Point): GridConfig {
    return this.gridManager.initGrid(gridSizeWidth, gridSizeHeight, deadZoneWidth, deadZoneHeight, basePoint)
  }

  /**
   * Dessine la grille complète avec les points et les lignes
   */
  public drawGrid(showGrid: boolean = true): void {
    const gridPoints = this.gridManager.getGridPoints()
    const gridSizeWidth = this.gridManager.getGridSizeWidth()
    const gridSizeHeight = this.gridManager.getGridSizeHeight()
    const deadZone = this.gridManager.getDeadZone()

    // Dessiner les points de grille
    this.renderer.drawGridPoints(gridPoints, showGrid)
    
    // Dessiner les lignes de grille
    if (deadZone) {
      const halfWidth = deadZone.deadZoneWidth / 2
      const halfHeight = deadZone.deadZoneHeight / 2
      const left = deadZone.basePoint.x - halfWidth
      const right = deadZone.basePoint.x + halfWidth
      const top = deadZone.basePoint.y - halfHeight
      const bottom = deadZone.basePoint.y + halfHeight
      
      this.renderer.drawGridLines(this.width, this.height, gridSizeWidth, gridSizeHeight, true, left, right, top, bottom)
      this.renderer.drawDeadZoneBoundary(left, right, top, bottom, gridSizeWidth, gridSizeHeight)
    } else {
      this.renderer.drawGridLines(this.width, this.height, gridSizeWidth, gridSizeHeight, false)
    }
  }

  /**
   * Configure les interactions (clics et boutons)
   */
  public setupInteractivePathfinding(): void {
    this.interactionHandler.setupEventHandlers()
    this.redraw()
  }

  /**
   * Génère des chemins aléatoires optimisés pour maximiser l'utilisation de l'espace
   */
  public setRandomPaths(numberOfPaths?: number): RandomPath[] {
    this.clearRandomPaths()
    
    // Calculer le nombre optimal si non spécifié
    const optimalCount = numberOfPaths || this.calculateOptimalPathCount()
    const newPaths = this.randomPathGenerator.generateRandomPaths(optimalCount)
    this.randomPaths.push(...newPaths)
    
    // Afficher les métriques d'optimisation
    const coverage = this.calculateSpaceCoverage()
    console.log(`🎯 Optimisation spatiale:`)
    console.log(`  📊 Couverture: ${(coverage * 100).toFixed(1)}%`)
    console.log(`  📍 Chemins: ${newPaths.length}/${optimalCount}`)
    console.log(`  ⚡ Efficacité: ${this.calculatePathEfficiency().toFixed(1)}%`)
    
    return this.randomPaths
  }

  /**
   * Calcule le nombre optimal de chemins selon l'espace disponible
   */
  private calculateOptimalPathCount(): number {
    const canvasBorderPoints = this.gridManager.getCanvasBorderPoints()
    const deadzoneBorderPoints = this.gridManager.getDeadzoneBorderPoints()
    
    // Utiliser le maximum possible basé sur les points de bordure disponibles
    // C'est plus proche de l'ancien comportement qui générait beaucoup de paths
    const maxFromCanvasBorder = canvasBorderPoints.length
    const maxFromDeadzoneBorder = deadzoneBorderPoints.length
    
    // Prendre le maximum entre les deux, avec un minimum de 12 chemins
    const optimalCount = Math.max(maxFromCanvasBorder, maxFromDeadzoneBorder, 12)
    
    console.log(`📊 Calcul optimal: ${optimalCount} chemins (bordure canvas: ${maxFromCanvasBorder}, bordure deadzone: ${maxFromDeadzoneBorder})`)
    
    return optimalCount
  }

  /**
   * Calcule l'efficacité moyenne des chemins générés
   */
  private calculatePathEfficiency(): number {
    if (this.randomPaths.length === 0) return 0

    let totalEfficiency = 0
    let validPaths = 0

    this.randomPaths.forEach(path => {
      if (path.path && path.path.length > 1) {
        const actualLength = path.path.length - 1
        const directDistance = MathUtils.getPointDistance(path.startPath, path.endPath)
        
        if (directDistance > 0) {
          const efficiency = (directDistance / actualLength) * 100
          totalEfficiency += efficiency
          validPaths++
        }
      }
    })

    return validPaths > 0 ? totalEfficiency / validPaths : 0
  }

  /**
   * Calcule le pourcentage de couverture spatiale
   */
  private calculateSpaceCoverage(): number {
    const allGridPoints = this.gridManager.getGridPoints()
    const coveredPoints = new Set<string>()
    const gridSize = Math.min(this.gridManager.getGridSizeWidth(), this.gridManager.getGridSizeHeight())
    const influenceRadius = gridSize * 1.5

    this.randomPaths.forEach(path => {
      if (path.path) {
        path.path.forEach(pathPoint => {
          // Point directement couvert
          coveredPoints.add(MathUtils.getPointKey(pathPoint))
          
          // Zone d'influence
          allGridPoints.forEach(gridPoint => {
            const distance = MathUtils.getPointDistance(pathPoint, gridPoint)
            if (distance <= influenceRadius) {
              coveredPoints.add(MathUtils.getPointKey(gridPoint))
            }
          })
        })
      }
    })

    return coveredPoints.size / allGridPoints.length
  }

  /**
   * Efface tous les chemins aléatoires
   */
  public clearRandomPaths(): void {
    this.randomPaths.length = 0
  }

  /**
   * Dessine tous les chemins aléatoires
   */
  public drawRandomPaths(strokeStyle: string = 'orange', lineWidth: number = 2): void {
    this.renderer.drawRandomPaths(this.randomPaths, strokeStyle, lineWidth)
  }

  /**
   * Dessine tous les chemins avec le style Tron bleu néon
   */
  public drawTronPaths(lineWidth: number = 2): void {
    this.renderer.drawTronPaths(this.randomPaths, lineWidth)
  }

  /**
   * Anime tous les chemins avec le style Tron de manière progressive
   */
  public animateTronPaths(
    lineWidth: number = 2, 
    animationSpeed: number = 50, 
    clearFirst: boolean = true,
    onComplete?: () => void
  ): void {
    if (clearFirst) {
      this.redraw()
    }
    
    this.renderer.animateTronPaths(this.randomPaths, lineWidth, animationSpeed, onComplete)
  }

  /**
   * Anime un seul chemin Tron
   */
  public animateTronPath(
    pathIndex: number,
    lineWidth: number = 2,
    animationSpeed: number = 50,
    clearFirst: boolean = true,
    onComplete?: () => void
  ): void {
    if (pathIndex < 0 || pathIndex >= this.randomPaths.length) {
      console.warn('Index de chemin invalide:', pathIndex)
      onComplete?.()
      return
    }

    const path = this.randomPaths[pathIndex].path
    if (!path) {
      console.warn('Chemin inexistant à l\'index:', pathIndex)
      onComplete?.()
      return
    }

    if (clearFirst) {
      this.redraw()
    }

    this.renderer.animateTronPath(path, pathIndex, lineWidth, animationSpeed, onComplete)
  }

  /**
   * Redessine le canvas avec les chemins en style Tron
   */
  public redrawWithTron(showGrid?: boolean, lineWidth: number = 2): void {
    this.redraw(showGrid)
    this.drawTronPaths(lineWidth)
  }

  /**
   * Démarre l'animation Tron séquentielle (un chemin après l'autre)
   */
  public animateTronPathsSequentially(
    lineWidth: number = 2,
    animationSpeed: number = 50,
    pathDelay: number = 200, // délai entre chaque chemin
    clearFirst: boolean = true,
    onComplete?: () => void
  ): void {
    if (this.randomPaths.length === 0) {
      onComplete?.()
      return
    }

    if (clearFirst) {
      this.redraw()
    }

    let currentPathIndex = 0

    const animateNextPath = () => {
      if (currentPathIndex >= this.randomPaths.length) {
        onComplete?.()
        return
      }

      const path = this.randomPaths[currentPathIndex].path
      if (path) {
        this.renderer.animateTronPath(
          path, 
          currentPathIndex, 
          lineWidth, 
          animationSpeed, 
          () => {
            currentPathIndex++
            setTimeout(animateNextPath, pathDelay)
          }
        )
      } else {
        currentPathIndex++
        setTimeout(animateNextPath, pathDelay)
      }
    }

    animateNextPath()
  }

  /**
   * Obtient les statistiques des chemins aléatoires
   */
  public getRandomPathsStats(): StatisticsData {
    return this.statisticsManager.getRandomPathsStats(this.randomPaths)
  }

  /**
   * Bascule l'affichage de la grille
   */
  public toggleGrid(): void {
    this.showGrid = !this.showGrid
    this.redraw()
    this.drawRandomPaths()
  }

  /**
   * Redessine tout le canvas
   */
  private redraw(showGrid?: boolean): void {
    this.renderer.clear()
    const gridVisible = showGrid !== undefined ? showGrid : this.showGrid
    this.drawGrid(gridVisible)
  }

  /**
   * Calcule un chemin entre deux points avec A*
   */
  public findPath(start: Point, end: Point): Point[] | null {
    return this.pathfindingEngine.aStar(start, end)
  }

  /**
   * Dessine un chemin spécifique
   */
  public drawPath(path: Point[], strokeStyle: string = 'green', lineWidth: number = 3): void {
    this.renderer.drawPath(path, strokeStyle, lineWidth)
  }

  // === GETTERS ET SETTERS ===

  public getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  public setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
  }

  public getContext(): CanvasRenderingContext2D {
    return this.context
  }

  public setContext(context: CanvasRenderingContext2D): void {
    this.context = context
  }

  public getWidth(): number {
    return this.width
  }

  public setWidth(width: number): void {
    this.width = width
    this.gridManager.setCanvasSize(width, this.height)
  }

  public getHeight(): number {
    return this.height
  }

  public setHeight(height: number): void {
    this.height = height
    this.gridManager.setCanvasSize(this.width, height)
  }

  public getGridManager(): GridManager {
    return this.gridManager
  }

  public getPathfindingEngine(): PathfindingEngine {
    return this.pathfindingEngine
  }

  public getRandomPathGenerator(): RandomPathGenerator {
    return this.randomPathGenerator
  }

  public getRenderer(): CanvasRenderer {
    return this.renderer
  }

  public getInteractionHandler(): InteractionHandler {
    return this.interactionHandler
  }

  public getStatisticsManager(): StatisticsManager {
    return this.statisticsManager
  }

  public getRandomPaths(): RandomPath[] {
    return [...this.randomPaths]
  }

  public isGridVisible(): boolean {
    return this.showGrid
  }

  public setGridVisible(visible: boolean): void {
    this.showGrid = visible
  }

  /**
   * EXEMPLE D'UTILISATION des nouvelles fonctionnalités Tron
   * Démontre comment utiliser les animations et le style Tron
   */
  public demonstrateTronFeatures(): void {
    console.log('🚀 Démonstration des fonctionnalités Tron')
    
    // 1. Toujours générer de nouveaux chemins pour la démo
    console.log('🔄 Génération de nouveaux chemins...')
    this.setRandomPaths() // Génère de nouveaux paths à chaque fois
    console.log('✅ Nouveaux chemins générés (nombre optimal)')

    // 2. Effacer et redessiner la grille
    this.redraw(true)
    console.log('✅ Grille redessinée')

    // 3. Exemple 1: Animation de tous les chemins simultanément
    setTimeout(() => {
      console.log('🎬 Animation simultanée de tous les chemins')
      this.animateTronPaths(2, 30, true, () => {
        console.log('✅ Animation simultanée terminée')
        
        // 4. Exemple 2: Animation séquentielle après un délai
        setTimeout(() => {
          console.log('🎬 Animation séquentielle des chemins')
          this.animateTronPathsSequentially(2, 40, 300, true, () => {
            console.log('✅ Animation séquentielle terminée')
            
            // 5. Exemple 3: Affichage statique Tron après un délai
            setTimeout(() => {
              console.log('🎨 Affichage statique style Tron')
              this.redrawWithTron(true, 2)
              console.log('✅ Style Tron appliqué')
            }, 2000)
          })
        }, 2000)
      })
    }, 1000)
  }

  /**
   * Méthode utilitaire pour tester une animation spécifique
   */
  public testTronAnimation(mode: 'simultaneous' | 'sequential' | 'static' = 'simultaneous'): void {
    // TOUJOURS générer de nouveaux chemins à chaque test
    console.log('🔄 Génération de nouveaux chemins pour le test...')
    this.setRandomPaths()
    console.log('✅ Nouveaux chemins générés')

    switch (mode) {
      case 'simultaneous':
        console.log('🎬 Test: Animation simultanée')
        this.animateTronPaths(2, 50, true, () => {
          console.log('✅ Test animation simultanée terminé')
        })
        break
        
      case 'sequential':
        console.log('🎬 Test: Animation séquentielle')
        this.animateTronPathsSequentially(2, 60, 250, true, () => {
          console.log('✅ Test animation séquentielle terminé')
        })
        break
        
      case 'static':
        console.log('🎨 Test: Affichage statique Tron')
        this.redrawWithTron(true, 2)
        console.log('✅ Test affichage statique terminé')
        break
    }
  }
} 