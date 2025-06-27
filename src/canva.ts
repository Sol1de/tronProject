import MathUtils from './utils/MathUtils'
import GridManager from './grid/GridManager'
import PathfindingEngine from './pathfinding/PathfindingEngine'
import RandomPathGenerator from './pathfinding/RandomPathGenerator'
import CanvasRenderer from './rendering/CanvasRenderer'
import InteractionHandler from './interaction/InteractionHandler'
import StatisticsManager from './statistics/StatisticsManager'
import type { Point, DeadZone, PathPoint, RandomPath, GridConfig, StatisticsData } from './types'

export default class CanvasManager {
  private gridManager: GridManager
  private pathfindingEngine: PathfindingEngine
  private randomPathGenerator: RandomPathGenerator
  private renderer: CanvasRenderer
  private interactionHandler: InteractionHandler
  private statisticsManager: StatisticsManager
  private randomPaths: RandomPath[] = []
  private showGrid: boolean = false

  public constructor(
    private canvas: HTMLCanvasElement,
    private context: CanvasRenderingContext2D,
    private width: number,
    private height: number,
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
   * Génère des chemins aléatoires
   */
  public setRandomPaths(numberOfPaths?: number): RandomPath[] {
    this.clearRandomPaths()
    const newPaths = this.randomPathGenerator.generateRandomPaths(numberOfPaths)
    this.randomPaths.push(...newPaths)
    return this.randomPaths
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