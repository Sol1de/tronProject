import type { Point } from '../types'

export default class MathUtils {
  /**
   * Calcule tous les diviseurs d'un nombre (sauf 1 et lui-même)
   */
  static getSizeMultiples(canvasSize: number): number[] {
    const multiples: number[] = []
    const sqrt = Math.sqrt(canvasSize)
     
    for (let i = 1; i <= sqrt; i++) {
      if (canvasSize % i === 0) {
        multiples.push(canvasSize / i)
        if (i !== sqrt) {
          multiples.push(i)
        }
      }
    }
     
    return multiples.sort((a, b) => a - b).slice(1, -1)
  }

  /**
   * Vérifie et ajuste la taille de grille pour qu'elle soit compatible avec la dimension du canvas
   */
  static verifyGridSize(gridSize: number, canvasSize: number): number {
    const multiples = this.getSizeMultiples(canvasSize)
    let closest = multiples[0]
    
    if (multiples.includes(gridSize) || multiples.length === 0) {
      return gridSize
    }
    
    for (const multiple of multiples) {
      if (Math.abs(multiple - gridSize) < Math.abs(closest - gridSize)) {
        closest = multiple
      }
    }
    
    return closest
  }

  /**
   * Vérifie si deux points sont identiques
   */
  static arePointsEqual(p1: Point, p2: Point): boolean {
    return p1.x === p2.x && p1.y === p2.y
  }

  /**
   * Calcule la distance euclidienne entre deux points
   */
  static getPointDistance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
  }

  /**
   * Calcule la distance de Manhattan entre deux points
   */
  static getManhattanDistance(p1: Point, p2: Point): number {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y)
  }

  /**
   * Vérifie si un point est sur un segment de ligne
   */
  static isPointOnSegment(point: Point, segStart: Point, segEnd: Point): boolean {
    // Vérifier si le point est colinéaire avec le segment
    const crossProduct = (point.y - segStart.y) * (segEnd.x - segStart.x) - (point.x - segStart.x) * (segEnd.y - segStart.y)
    
    // Si pas colinéaire (avec une petite tolérance pour les erreurs de calcul)
    if (Math.abs(crossProduct) > 1e-6) return false
    
    // Vérifier si le point est dans la bounding box du segment
    const dotProduct = (point.x - segStart.x) * (segEnd.x - segStart.x) + (point.y - segStart.y) * (segEnd.y - segStart.y)
    const segmentLengthSquared = (segEnd.x - segStart.x) ** 2 + (segEnd.y - segStart.y) ** 2
    
    return dotProduct >= 0 && dotProduct <= segmentLengthSquared
  }

  /**
   * Vérifie si deux segments de ligne se croisent ou se touchent
   */
  static doLinesIntersectOrTouch(line1Start: Point, line1End: Point, line2Start: Point, line2End: Point): boolean {
    // Vérifier si les extrémités des segments se touchent
    if (this.arePointsEqual(line1Start, line2Start) || this.arePointsEqual(line1Start, line2End) ||
        this.arePointsEqual(line1End, line2Start) || this.arePointsEqual(line1End, line2End)) {
      return true
    }
    
    // Vérifier si une extrémité d'un segment est sur l'autre segment
    if (this.isPointOnSegment(line1Start, line2Start, line2End) || 
        this.isPointOnSegment(line1End, line2Start, line2End) ||
        this.isPointOnSegment(line2Start, line1Start, line1End) || 
        this.isPointOnSegment(line2End, line1Start, line1End)) {
      return true
    }
    
    // Algorithme CCW pour détecter les croisements stricts
    const ccw = (A: Point, B: Point, C: Point): boolean => {
      return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x)
    }
    
    const A = line1Start
    const B = line1End
    const C = line2Start
    const D = line2End
    
    return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D)
  }

  /**
   * Trouve le point le plus proche dans une liste de points
   */
  static findNearestPoint(targetPoint: Point, candidates: Point[], maxDistance: number = Infinity): Point | null {
    return candidates.reduce((nearest: Point | null, point) => {
      const distance = this.getPointDistance(targetPoint, point)
      if (distance <= maxDistance && (!nearest || distance < this.getPointDistance(targetPoint, nearest))) {
        return point
      }
      return nearest
    }, null)
  }

  /**
   * Génère une clé unique pour un point (utile pour les Maps/Sets)
   */
  static getPointKey(point: Point): string {
    return `${point.x},${point.y}`
  }

  /**
   * Parse une clé de point pour récupérer les coordonnées
   */
  static parsePointKey(key: string): Point {
    const [x, y] = key.split(',').map(Number)
    return { x, y }
  }
} 