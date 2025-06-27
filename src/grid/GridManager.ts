import MathUtils from '../utils/MathUtils'
import type { Point, DeadZone, PathPoint, GridConfig } from '../types'

export default class GridManager {
  private gridPoints: Point[] = []
  private gridSizeWidth: number = 0
  private gridSizeHeight: number = 0
  private deadZone?: DeadZone
  private canvasWidth: number
  private canvasHeight: number

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
  }

  /**
   * Initialise la grille avec une deadzone optionnelle
   */
  public initGrid(
    gridSizeWidth: number, 
    gridSizeHeight: number, 
    deadZoneWidth?: number, 
    deadZoneHeight?: number, 
    basePoint?: Point
  ): GridConfig {
    
    this.gridSizeWidth = MathUtils.verifyGridSize(gridSizeWidth, this.canvasWidth)
    this.gridSizeHeight = MathUtils.verifyGridSize(gridSizeHeight, this.canvasHeight)
    
    this.deadZone = (deadZoneWidth && deadZoneHeight && basePoint) 
      ? { basePoint: { ...basePoint }, deadZoneWidth, deadZoneHeight }
      : undefined
    
    const pointsSet = new Set<string>()
    const addPoint = (x: number, y: number) => {
      if (x <= this.canvasWidth && y <= this.canvasHeight) {
        pointsSet.add(MathUtils.getPointKey({ x, y }))
      }
    }
    
    const cols = Math.floor(this.canvasWidth / this.gridSizeWidth) + 1
    const rows = Math.floor(this.canvasHeight / this.gridSizeHeight) + 1
    
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = col * this.gridSizeWidth
        const y = row * this.gridSizeHeight
        
        if (!this.deadZone || !this.isPointInDeadZone(x, y, this.deadZone)) {
          addPoint(x, y)
        }
      }
    }
    
    if (this.deadZone) {
      this.addDeadZoneBorderPoints(this.deadZone, this.gridSizeWidth, this.gridSizeHeight, addPoint)
    }
    
    this.gridPoints = Array.from(pointsSet).map(pointStr => MathUtils.parsePointKey(pointStr))
    
    return { 
      gridSizeWidth: this.gridSizeWidth, 
      gridSizeHeight: this.gridSizeHeight, 
      gridPoints: this.gridPoints, 
      deadZone: this.deadZone 
    }
  }

  /**
   * Vérifie si un point est dans la deadzone
   */
  public isPointInDeadZone(x: number, y: number, deadZone: DeadZone): boolean {
    const halfWidth = deadZone.deadZoneWidth / 2
    const halfHeight = deadZone.deadZoneHeight / 2
    
    return x >= deadZone.basePoint.x - halfWidth && 
           x <= deadZone.basePoint.x + halfWidth &&
           y >= deadZone.basePoint.y - halfHeight && 
           y <= deadZone.basePoint.y + halfHeight
  }

  /**
   * Ajoute les points de bordure de la deadzone à la grille
   */
  private addDeadZoneBorderPoints(
    deadZone: DeadZone, 
    gridSizeWidth: number, 
    gridSizeHeight: number, 
    addPoint: (x: number, y: number) => void
  ): void {
    const halfWidth = deadZone.deadZoneWidth / 2
    const halfHeight = deadZone.deadZoneHeight / 2
    const bounds = {
      left: deadZone.basePoint.x - halfWidth,
      right: deadZone.basePoint.x + halfWidth,
      top: deadZone.basePoint.y - halfHeight,
      bottom: deadZone.basePoint.y + halfHeight
    }
    
    for (let x = Math.ceil(bounds.left / gridSizeWidth) * gridSizeWidth; x <= bounds.right; x += gridSizeWidth) {
      if (x >= bounds.left && x <= bounds.right) {
        addPoint(x, bounds.top)
        addPoint(x, bounds.bottom)
      }
    }
    
    for (let y = Math.ceil(bounds.top / gridSizeHeight) * gridSizeHeight; y <= bounds.bottom; y += gridSizeHeight) {
      if (y >= bounds.top && y <= bounds.bottom) {
        addPoint(bounds.left, y)
        addPoint(bounds.right, y)
      }
    }
  }

  /**
   * Retourne tous les points composant la bordure de la deadzone
   */
  public getDeadzoneBorderPoints(): PathPoint[] {
    if (!this.deadZone) return []
    
    const points: PathPoint[] = []
    const halfWidth = this.deadZone.deadZoneWidth / 2
    const halfHeight = this.deadZone.deadZoneHeight / 2
    const bounds = {
      left: this.deadZone.basePoint.x - halfWidth,
      right: this.deadZone.basePoint.x + halfWidth,
      top: this.deadZone.basePoint.y - halfHeight,
      bottom: this.deadZone.basePoint.y + halfHeight
    }

    // Points sur les bordures horizontales (haut et bas)
    for (let x = Math.ceil(bounds.left / this.gridSizeWidth) * this.gridSizeWidth; x <= bounds.right; x += this.gridSizeWidth) {
      if (x >= bounds.left && x <= bounds.right && x >= 0 && x <= this.canvasWidth) {
        if (bounds.top >= 0 && bounds.top <= this.canvasHeight) {
          points.push({ x, y: bounds.top, isUsed: false })
        }
        if (bounds.bottom >= 0 && bounds.bottom <= this.canvasHeight) {
          points.push({ x, y: bounds.bottom, isUsed: false })
        }
      }
    }

    // Points sur les bordures verticales (gauche et droite)
    for (let y = Math.ceil(bounds.top / this.gridSizeHeight) * this.gridSizeHeight; y <= bounds.bottom; y += this.gridSizeHeight) {
      if (y >= bounds.top && y <= bounds.bottom && y >= 0 && y <= this.canvasHeight) {
        if (bounds.left >= 0 && bounds.left <= this.canvasWidth) {
          points.push({ x: bounds.left, y, isUsed: false })
        }
        if (bounds.right >= 0 && bounds.right <= this.canvasWidth) {
          points.push({ x: bounds.right, y, isUsed: false })
        }
      }
    }

    // Suppression des doublons
    const uniquePoints = new Map<string, PathPoint>()
    points.forEach(point => {
      const key = MathUtils.getPointKey(point)
      if (!uniquePoints.has(key)) {
        uniquePoints.set(key, point)
      }
    })

    return Array.from(uniquePoints.values())
  }

  /**
   * Retourne tous les points composant la bordure du canvas
   */
  public getCanvasBorderPoints(): PathPoint[] {
    const points: PathPoint[] = []
    
    // Points sur la bordure gauche (x = 0)
    for (let y = 0; y <= this.canvasHeight; y += this.gridSizeHeight) {
      if (!this.deadZone || !this.isPointInDeadZone(0, y, this.deadZone)) {
        points.push({ x: 0, y, isUsed: false })
      }
    }
    
    // Points sur la bordure droite (x = width)
    for (let y = 0; y <= this.canvasHeight; y += this.gridSizeHeight) {
      if (!this.deadZone || !this.isPointInDeadZone(this.canvasWidth, y, this.deadZone)) {
        points.push({ x: this.canvasWidth, y, isUsed: false })
      }
    }
    
    // Points sur la bordure haut (y = 0)
    for (let x = 0; x <= this.canvasWidth; x += this.gridSizeWidth) {
      if (!this.deadZone || !this.isPointInDeadZone(x, 0, this.deadZone)) {
        points.push({ x, y: 0, isUsed: false })
      }
    }
    
    // Points sur la bordure bas (y = height)
    for (let x = 0; x <= this.canvasWidth; x += this.gridSizeWidth) {
      if (!this.deadZone || !this.isPointInDeadZone(x, this.canvasHeight, this.deadZone)) {
        points.push({ x, y: this.canvasHeight, isUsed: false })
      }
    }
    
    // Suppression des doublons
    const uniquePoints = new Map<string, PathPoint>()
    points.forEach(point => {
      const key = MathUtils.getPointKey(point)
      if (!uniquePoints.has(key)) {
        uniquePoints.set(key, point)
      }
    })

    return Array.from(uniquePoints.values())
  }

  /**
   * Trouve le point de grille le plus proche d'une position donnée
   */
  public findNearestGridPoint(x: number, y: number, maxDistance: number = 25): Point | null {
    const availablePoints = [...this.gridPoints]
    
    if (this.deadZone) {
      const deadZoneBorderPoints = this.getDeadzoneBorderPoints()
      
      for (const borderPoint of deadZoneBorderPoints) {
        const exists = this.gridPoints.some(p => MathUtils.arePointsEqual(p, borderPoint))
        if (!exists) {
          availablePoints.push(borderPoint)
        }
      }
    }

    return MathUtils.findNearestPoint({ x, y }, availablePoints, maxDistance)
  }

  /**
   * Calcule la distance minimale d'un point à la deadzone
   */
  public getDistanceToDeadzone(point: Point): number {
    if (!this.deadZone) return Infinity
    
    const halfWidth = this.deadZone.deadZoneWidth / 2
    const halfHeight = this.deadZone.deadZoneHeight / 2
    const bounds = {
      left: this.deadZone.basePoint.x - halfWidth,
      right: this.deadZone.basePoint.x + halfWidth,
      top: this.deadZone.basePoint.y - halfHeight,
      bottom: this.deadZone.basePoint.y + halfHeight
    }
    
    // Si le point est dans la deadzone, retourner une distance très grande
    if (this.isPointInDeadZone(point.x, point.y, this.deadZone)) {
      return Infinity
    }
    
    // Calculer la distance au rectangle de la deadzone
    let dx = 0
    let dy = 0
    
    if (point.x < bounds.left) {
      dx = bounds.left - point.x
    } else if (point.x > bounds.right) {
      dx = point.x - bounds.right
    }
    
    if (point.y < bounds.top) {
      dy = bounds.top - point.y
    } else if (point.y > bounds.bottom) {
      dy = point.y - bounds.bottom
    }
    
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Retourne les points de grille triés par proximité à la deadzone
   */
  public getPointsByProximityToDeadzone(): PathPoint[] {
    if (!this.deadZone) return []
    
    const availablePoints: PathPoint[] = this.gridPoints
      .filter(point => !this.isPointInDeadZone(point.x, point.y, this.deadZone!))
      .map(point => ({ ...point, isUsed: false }))
    
    // Trier par distance à la deadzone (du plus proche au plus éloigné)
    availablePoints.sort((a, b) => {
      const distA = this.getDistanceToDeadzone(a)
      const distB = this.getDistanceToDeadzone(b)
      return distA - distB
    })
    
    return availablePoints
  }

  // Getters
  public getGridPoints(): Point[] {
    return [...this.gridPoints]
  }

  public getGridSizeWidth(): number {
    return this.gridSizeWidth
  }

  public getGridSizeHeight(): number {
    return this.gridSizeHeight
  }

  public getDeadZone(): DeadZone | undefined {
    return this.deadZone ? { ...this.deadZone } : undefined
  }

  public getCanvasWidth(): number {
    return this.canvasWidth
  }

  public getCanvasHeight(): number {
    return this.canvasHeight
  }

  // Setters
  public setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width
    this.canvasHeight = height
  }
} 