import MathUtils from './MathUtils'
import type GridManager from './GridManager'
import type { Point } from '../types'

export default class PathfindingEngine {
  private gridManager: GridManager

  constructor(gridManager: GridManager) {
    this.gridManager = gridManager
  }

  /**
   * Algorithme A* pour trouver le chemin optimal entre deux points
   */
  public aStar(debut: Point, objectif: Point): Point[] | null {
    const openSet: Point[] = [debut]
    const closedSet = new Set<string>()
    const gScore = new Map<string, number>()
    const fScore = new Map<string, number>()
    const parent = new Map<string, Point>()
    
    const key = (p: Point): string => MathUtils.getPointKey(p)
    const h = (p1: Point, p2: Point): number => MathUtils.getManhattanDistance(p1, p2)
    
    gScore.set(key(debut), 0)
    fScore.set(key(debut), h(debut, objectif))
    
    while (openSet.length > 0) {
      const current = openSet.reduce((best, node) => 
        (fScore.get(key(node)) || Infinity) < (fScore.get(key(best)) || Infinity) ? node : best
      )
      
      if (MathUtils.arePointsEqual(current, objectif)) {
        return this.reconstructPath(parent, current)
      }
      
      openSet.splice(openSet.indexOf(current), 1)
      closedSet.add(key(current))
      
      for (const neighbor of this.getNeighbors(current)) {
        const neighborKey = key(neighbor)
        const deadZone = this.gridManager.getDeadZone()
        
        if (closedSet.has(neighborKey) || (deadZone && this.gridManager.isPointInDeadZone(neighbor.x, neighbor.y, deadZone))) {
          continue
        }
        
        const tentativeG = (gScore.get(key(current)) || 0) + MathUtils.getPointDistance(current, neighbor)
        
        if (!openSet.some(p => key(p) === neighborKey)) {
          openSet.push(neighbor)
        } else if (tentativeG >= (gScore.get(neighborKey) || Infinity)) {
          continue
        }
        
        parent.set(neighborKey, current)
        gScore.set(neighborKey, tentativeG)
        fScore.set(neighborKey, tentativeG + h(neighbor, objectif))
      }
    }
    
    return null
  }

  /**
   * Reconstruit le chemin à partir de la map des parents
   */
  private reconstructPath(parent: Map<string, Point>, current: Point): Point[] {
    const path = [current]
    const key = (p: Point): string => MathUtils.getPointKey(p)
    
    while (parent.has(key(current))) {
      current = parent.get(key(current))!
      path.unshift(current)
    }
    
    return path
  }

  /**
   * Trouve tous les voisins valides d'un point donné
   * Utilise une approche adaptative : voisins classiques en priorité, puis flexibles si nécessaire
   */
  private getNeighbors(point: Point): Point[] {
    const allValidPoints = [...this.gridManager.getGridPoints()]
    const deadZone = this.gridManager.getDeadZone()
    
    if (deadZone) {
      const deadZoneBorderPoints = this.gridManager.getDeadzoneBorderPoints()
      for (const borderPoint of deadZoneBorderPoints) {
        const exists = allValidPoints.some(p => MathUtils.arePointsEqual(p, borderPoint))
        if (!exists) {
          allValidPoints.push(borderPoint)
        }
      }
    }
    
    const gridSizeWidth = this.gridManager.getGridSizeWidth()
    const gridSizeHeight = this.gridManager.getGridSizeHeight()
    
    // Directions des 8 voisins classiques (4 cardinaux + 4 diagonaux)
    const directions = [
      [0, -gridSizeHeight], [gridSizeWidth, 0], [0, gridSizeHeight], [-gridSizeWidth, 0],
      [gridSizeWidth, -gridSizeHeight], [gridSizeWidth, gridSizeHeight], 
      [-gridSizeWidth, gridSizeHeight], [-gridSizeWidth, -gridSizeHeight]
    ]
    
    // Essayer d'abord les voisins classiques (grille régulière)
    const classicNeighbors = directions
      .map(([dx, dy]) => ({ x: point.x + dx, y: point.y + dy }))
      .filter(neighbor => 
        allValidPoints.some(p => MathUtils.arePointsEqual(p, neighbor)) &&
        (!deadZone || !this.gridManager.isPointInDeadZone(neighbor.x, neighbor.y, deadZone))
      )
    
    if (classicNeighbors.length > 0) {
      return classicNeighbors
    }
    
    // Si aucun voisin classique, utiliser une approche flexible
    const flexibleNeighbors = allValidPoints.filter(candidate => {
      if (MathUtils.arePointsEqual(candidate, point)) return false
      
      const maxDistance = Math.max(gridSizeWidth, gridSizeHeight) * 1.5
      const distance = MathUtils.getPointDistance(candidate, point)
      
      const isReasonableDistance = distance <= maxDistance && distance > 0
      const isValid = isReasonableDistance &&
        (!deadZone || !this.gridManager.isPointInDeadZone(candidate.x, candidate.y, deadZone))
      
      return isValid
    })
    
    return flexibleNeighbors
  }

  /**
   * Calcule la distance heuristique entre deux points (distance de Manhattan)
   */
  public getHeuristicDistance(p1: Point, p2: Point): number {
    return MathUtils.getManhattanDistance(p1, p2)
  }

  /**
   * Vérifie si un chemin existe entre deux points sans le calculer complètement
   */
  public pathExists(start: Point, end: Point): boolean {
    const path = this.aStar(start, end)
    return path !== null && path.length >= 2
  }

  /**
   * Calcule plusieurs chemins alternatifs entre deux points
   */
  public findAlternativePaths(start: Point, end: Point, _maxAlternatives: number = 3): Point[][] {
    const paths: Point[][] = []
    
    // Premier chemin standard
    const mainPath = this.aStar(start, end)
    if (mainPath) {
      paths.push(mainPath)
    }
    
    // TODO: Implémenter la recherche de chemins alternatifs
    // (nécessiterait des modifications plus avancées de l'algorithme A*)
    
    return paths
  }
} 