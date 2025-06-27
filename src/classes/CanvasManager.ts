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
    const allPoints = this.gridManager.getGridPoints()
    const deadZone = this.gridManager.getDeadZone()
    
    const availablePoints = deadZone ? 
      allPoints.filter(p => !this.gridManager.isPointInDeadZone(p.x, p.y, deadZone)) :
      allPoints

    // Estimation basée sur la densité optimale
    const canvasArea = this.width * this.height
    const gridDensity = availablePoints.length / canvasArea
    
    // Formule optimisée pour maximiser la couverture sans sur-densité
    const baseCount = Math.floor(Math.sqrt(availablePoints.length) * 1.2)
    const densityAdjustment = Math.floor(gridDensity * canvasArea * 0.0001)
    
    return Math.max(baseCount + densityAdjustment, 8) // Minimum 8 chemins
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
    const startPoint = this.interactionHandler.getStartPoint()
    const endPoint = this.interactionHandler.getEndPoint()
    this.renderer.drawSpecialPoints(startPoint || undefined, endPoint || undefined)
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
} 