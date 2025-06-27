import MathUtils from './MathUtils'
import type GridManager from './GridManager'
import type PathfindingEngine from './PathfindingEngine'
import type { Point, PathPoint, RandomPath } from '../types'

export default class RandomPathGenerator {
  private gridManager: GridManager
  private pathfindingEngine: PathfindingEngine

  constructor(
    gridManager: GridManager,
    pathfindingEngine: PathfindingEngine
  ) {
    this.gridManager = gridManager
    this.pathfindingEngine = pathfindingEngine
  }

  /**
   * Génère des chemins aléatoires entre la bordure de la deadzone et la bordure du canevas
   * Évite les croisements en essayant différents points de destination
   * Génère automatiquement le nombre maximum possible de chemins
   * Phase 1: Points bordure deadzone vers bordure canvas
   * Phase 2: Points proches deadzone vers bordure canvas
   * Phase 3: Points éloignés (proches bordure canvas) vers points proches deadzone
   */
  public generateRandomPaths(numberOfPaths?: number): RandomPath[] {
    const deadzoneBorderPoints = this.gridManager.getDeadzoneBorderPoints()
    const canvasBorderPoints = this.gridManager.getCanvasBorderPoints()
    const paths: RandomPath[] = []
    
    // Copie des tableaux pour pouvoir les modifier
    const availableDeadzonePoints = [...deadzoneBorderPoints]
    const availableCanvasPoints = [...canvasBorderPoints]
    
    // Obtenir tous les points triés par proximité à la deadzone pour utilisation ultérieure
    const proximityPoints = this.gridManager.getPointsByProximityToDeadzone()
    let availableProximityPoints = [...proximityPoints]
    
    // Calculer le nombre maximum possible de chemins
    const maxPossiblePathsTotal = availableCanvasPoints.length // Limité par les points de bordure canvas
    const targetPaths = numberOfPaths !== undefined ? Math.min(numberOfPaths, maxPossiblePathsTotal) : maxPossiblePathsTotal
    
    console.log(`🎯 Tentative de génération de ${targetPaths} chemins`)
    console.log(`📍 Points deadzone border: ${availableDeadzonePoints.length}`)
    console.log(`📍 Points canvas border: ${availableCanvasPoints.length}`)
    console.log(`📍 Points proximité deadzone: ${availableProximityPoints.length}`)
    
    let pathIndex = 0
    
    // Phase 1 et 2: Points deadzone/proximité vers bordure canvas
    pathIndex = this.executePhases1And2(
      paths, 
      availableDeadzonePoints, 
      availableCanvasPoints, 
      availableProximityPoints, 
      pathIndex, 
      targetPaths
    )
    
    // Phase 3: Chemins depuis points intérieurs de la grille
    pathIndex = this.executePhase3(
      paths, 
      deadzoneBorderPoints, 
      canvasBorderPoints, 
      pathIndex, 
      targetPaths
    )
    
    console.log(`🎯 Génération terminée: ${paths.length} chemins créés sans conflit`)
    console.log(`🏁 Toutes les phases terminées`)
    return paths
  }

  /**
   * Exécute les phases 1 et 2 de génération de chemins
   */
  private executePhases1And2(
    paths: RandomPath[],
    availableDeadzonePoints: PathPoint[],
    availableCanvasPoints: PathPoint[],
    availableProximityPoints: PathPoint[],
    pathIndex: number,
    targetPaths: number
  ): number {
    while (pathIndex < targetPaths && availableCanvasPoints.length > 0) {
      let startPoint: PathPoint
      let isUsingBorderPoint = false
      
      // Phase 1: Utiliser les points de bordure deadzone en priorité
      if (availableDeadzonePoints.length > 0) {
        const randomDeadzoneIndex = Math.floor(Math.random() * availableDeadzonePoints.length)
        startPoint = availableDeadzonePoints[randomDeadzoneIndex]
        isUsingBorderPoint = true
        console.log(`🎯 Chemin ${pathIndex + 1}: Utilisation d'un point de bordure deadzone`)
      } 
      // Phase 2: Utiliser les points les plus proches de la deadzone
      else if (availableProximityPoints.length > 0) {
        // Prendre un des 10 points les plus proches (ou moins s'il y en a moins)
        const topClosestCount = Math.min(10, availableProximityPoints.length)
        const randomProximityIndex = Math.floor(Math.random() * topClosestCount)
        const selectedPoint = availableProximityPoints[randomProximityIndex]
        startPoint = selectedPoint
        isUsingBorderPoint = false
        console.log(`🎯 Chemin ${pathIndex + 1}: Utilisation d'un point proche de la deadzone (distance: ${this.gridManager.getDistanceToDeadzone(selectedPoint).toFixed(1)})`)
      } 
      // Fin des phases 1 et 2
      else {
        console.log(`🔄 Fin des phases 1 et 2. Passage à la phase 3...`)
        break
      }
      
      const result = this.tryCreatePath(
        startPoint, 
        availableCanvasPoints, 
        paths, 
        pathIndex, 
        false // allowStartPointIntersection = false pour phases 1-2
      )
      
      if (result.success && result.path) {
        // Chemin créé avec succès
        paths.push(result.path)
        
        // Marquer les points comme utilisés et les retirer des listes disponibles
        startPoint.isUsed = true
        result.endPoint!.isUsed = true
        availableCanvasPoints.splice(result.canvasIndex!, 1)
        
        // Retirer le point de départ de la bonne liste
        if (isUsingBorderPoint) {
          const indexToRemove = availableDeadzonePoints.findIndex(p => MathUtils.arePointsEqual(p, startPoint))
          if (indexToRemove !== -1) {
            availableDeadzonePoints.splice(indexToRemove, 1)
          }
        } else {
          const indexToRemove = availableProximityPoints.findIndex(p => MathUtils.arePointsEqual(p, startPoint))
          if (indexToRemove !== -1) {
            availableProximityPoints.splice(indexToRemove, 1)
          }
        }
        
        pathIndex++
        console.log(`✅ Chemin ${pathIndex} créé sans conflit`)
      } else {
        // Échec de création du chemin
        console.log(`🚫 Impossible de créer le chemin ${pathIndex + 1} sans conflit`)
        
        // Retirer le point de départ pour éviter de le réessayer
        if (isUsingBorderPoint) {
          const indexToRemove = availableDeadzonePoints.findIndex(p => MathUtils.arePointsEqual(p, startPoint))
          if (indexToRemove !== -1) {
            availableDeadzonePoints.splice(indexToRemove, 1)
          }
        } else {
          const indexToRemove = availableProximityPoints.findIndex(p => MathUtils.arePointsEqual(p, startPoint))
          if (indexToRemove !== -1) {
            availableProximityPoints.splice(indexToRemove, 1)
          }
        }
      }
    }
    
    return pathIndex
  }

  /**
   * Exécute la phase 3 de génération de chemins
   */
  private executePhase3(
    paths: RandomPath[],
    deadzoneBorderPoints: PathPoint[],
    canvasBorderPoints: PathPoint[],
    pathIndex: number,
    targetPaths: number
  ): number {
    console.log(`🚀 Début de la Phase 3: Points intérieurs → Points accessibles`)
    
    // Obtenir tous les points de départ possibles pour la Phase 3
    const phase3StartPoints = this.getPhase3StartPoints(paths, deadzoneBorderPoints, canvasBorderPoints)
    console.log(`📍 Points de départ Phase 3 disponibles: ${phase3StartPoints.length}`)
    
    // Trier par "isolement" (stratégie d'optimisation)
    const sortedPhase3Points = this.sortPointsByIsolation(phase3StartPoints, paths)
    
    let availablePhase3Points = [...sortedPhase3Points]
    
    while (availablePhase3Points.length > 0 && pathIndex < targetPaths) {
      // Sélectionner un point de départ (les plus isolés en premier)
      const startPoint = availablePhase3Points[0]
      availablePhase3Points.shift()
      
      console.log(`🎯 Phase 3 - Chemin ${pathIndex + 1}: Départ depuis point intérieur (${startPoint.x}, ${startPoint.y})`)
      
      // Essayer de trouver un point d'arrivée valide
      const validEndPoint = this.findValidEndPointForPhase3(startPoint, paths)
      
      if (validEndPoint) {
        // Calcul du chemin avec A*
        const path = this.pathfindingEngine.aStar(startPoint, validEndPoint)
        
        if (path && path.length >= 2 && !this.doesPathIntersectWithExisting(path, paths, true)) {
          // Chemin valide trouvé !
          paths.push({
            startPath: { x: startPoint.x, y: startPoint.y },
            endPath: { x: validEndPoint.x, y: validEndPoint.y },
            path: path
          })
          
          // Marquer les points comme utilisés
          startPoint.isUsed = true
          if ('isUsed' in validEndPoint) {
            (validEndPoint as PathPoint).isUsed = true
          }
          
          pathIndex++
          console.log(`✅ Phase 3 - Chemin ${pathIndex} créé (longueur: ${path.length} points)`)
        } else {
          console.log(`❌ Phase 3 - Chemin impossible ou en conflit depuis (${startPoint.x}, ${startPoint.y})`)
        }
      } else {
        console.log(`❌ Phase 3 - Aucun point d'arrivée valide trouvé depuis (${startPoint.x}, ${startPoint.y})`)
      }
    }
    
    return pathIndex
  }

  /**
   * Essaie de créer un chemin depuis un point de départ vers un point de la bordure canvas
   */
  private tryCreatePath(
    startPoint: PathPoint, 
    availableCanvasPoints: PathPoint[], 
    existingPaths: RandomPath[], 
    pathIndex: number,
    allowStartPointIntersection: boolean
  ): { success: boolean, path?: RandomPath, endPoint?: PathPoint, canvasIndex?: number } {
    
    let pathFound = false
    let attempts = 0
    const maxAttempts = availableCanvasPoints.length
    const triedCanvasPoints = new Set<number>()
    
    while (!pathFound && attempts < maxAttempts && triedCanvasPoints.size < availableCanvasPoints.length) {
      // Sélection aléatoire d'un point du canvas non encore essayé
      let randomCanvasIndex: number
      do {
        randomCanvasIndex = Math.floor(Math.random() * availableCanvasPoints.length)
      } while (triedCanvasPoints.has(randomCanvasIndex))
      
      triedCanvasPoints.add(randomCanvasIndex)
      const endPoint = availableCanvasPoints[randomCanvasIndex]
      
      // Calcul du chemin avec A*
      const path = this.pathfindingEngine.aStar(startPoint, endPoint)
      
      if (path) {
        // Vérifier si ce chemin croise avec les chemins existants
        if (!this.doesPathIntersectWithExisting(path, existingPaths, allowStartPointIntersection)) {
          // Chemin valide trouvé !
          const randomPath: RandomPath = {
            startPath: { x: startPoint.x, y: startPoint.y },
            endPath: { x: endPoint.x, y: endPoint.y },
            path: path
          }
          
          return { 
            success: true, 
            path: randomPath, 
            endPoint: endPoint, 
            canvasIndex: randomCanvasIndex 
          }
        } else {
          console.log(`❌ Chemin ${pathIndex + 1} entre en conflit avec un chemin existant, tentative ${attempts + 1}`)
        }
      } else {
        console.log(`⚠️ Aucun chemin A* trouvé pour la tentative ${attempts + 1}`)
      }
      
      attempts++
    }
    
    return { success: false }
  }

  /**
   * Vérifie si un chemin croise, touche ou partage des points avec les chemins existants
   */
  private doesPathIntersectWithExisting(newPath: Point[], existingPaths: RandomPath[], allowStartPointIntersection: boolean = false): boolean {
    if (newPath.length < 2) return false
    
    for (const existingPath of existingPaths) {
      if (!existingPath.path || existingPath.path.length < 2) continue
      
      // 1. Vérifier si les chemins partagent des points communs
      for (let i = 0; i < newPath.length; i++) {
        const newPoint = newPath[i]
        const isStartPoint = i === 0
        const isEndPoint = i === newPath.length - 1
        
        for (let j = 0; j < existingPath.path.length; j++) {
          const existingPoint = existingPath.path[j]
          const isExistingStartPoint = j === 0
          const isExistingEndPoint = j === existingPath.path.length - 1
          
          if (MathUtils.arePointsEqual(newPoint, existingPoint)) {
            // Cas spécial Phase 3: autoriser l'intersection au point de départ seulement
            if (allowStartPointIntersection && isStartPoint && !isExistingStartPoint && !isExistingEndPoint) {
              console.log(`🔍 Intersection autorisée au point de départ Phase 3: (${newPoint.x}, ${newPoint.y})`)
              continue
            }
            
            // Ignorer les intersections aux points de bordure (départ/arrivée) pour les phases 1-2
            if (!allowStartPointIntersection && (isStartPoint || isEndPoint) && (isExistingStartPoint || isExistingEndPoint)) {
              continue
            }
            
            console.log(`🔍 Conflit détecté: point partagé à (${newPoint.x}, ${newPoint.y})`)
            return true
          }
        }
      }
      
      // 2. Vérifier chaque segment du nouveau chemin contre chaque segment des chemins existants
      for (let i = 0; i < newPath.length - 1; i++) {
        const newSegmentStart = newPath[i]
        const newSegmentEnd = newPath[i + 1]
        const isFirstSegment = i === 0
        
        for (let j = 0; j < existingPath.path.length - 1; j++) {
          const existingSegmentStart = existingPath.path[j]
          const existingSegmentEnd = existingPath.path[j + 1]
          
          if (MathUtils.doLinesIntersectOrTouch(newSegmentStart, newSegmentEnd, existingSegmentStart, existingSegmentEnd)) {
            // Cas spécial Phase 3: autoriser le croisement au premier segment si le point de départ est sur le path existant
            if (allowStartPointIntersection && isFirstSegment) {
              const startPointOnExistingPath = MathUtils.isPointOnSegment(newSegmentStart, existingSegmentStart, existingSegmentEnd)
              if (startPointOnExistingPath) {
                console.log(`🔍 Croisement autorisé au premier segment Phase 3`)
                continue
              }
            }
            
            console.log(`🔍 Conflit détecté: segments se touchent/croisent`)
            return true
          }
        }
      }
      
      // 3. Vérifier si les chemins passent trop près l'un de l'autre
      const gridSizeWidth = this.gridManager.getGridSizeWidth()
      const gridSizeHeight = this.gridManager.getGridSizeHeight()
      const minDistance = Math.min(gridSizeWidth, gridSizeHeight) * 0.8
      
      for (let i = 0; i < newPath.length; i++) {
        const newPoint = newPath[i]
        const isStartPoint = i === 0
        
        for (let j = 0; j < existingPath.path.length; j++) {
          const existingPoint = existingPath.path[j]
          const isExistingStartPoint = j === 0
          const isExistingEndPoint = j === existingPath.path.length - 1
          
          // Cas spécial Phase 3: ignorer la distance au point de départ si c'est autorisé
          if (allowStartPointIntersection && isStartPoint && !isExistingStartPoint && !isExistingEndPoint) {
            continue
          }
          
          // Ne pas vérifier la distance pour les points de bordure (départ/arrivée)
          const isNewPointBorder = (i === 0 || i === newPath.length - 1)
          const isExistingPointBorder = (isExistingStartPoint || isExistingEndPoint)
          
          if (!isNewPointBorder && !isExistingPointBorder) {
            const distance = MathUtils.getPointDistance(newPoint, existingPoint)
            if (distance < minDistance && distance > 0) {
              console.log(`🔍 Conflit détecté: chemins trop proches (${distance.toFixed(1)} < ${minDistance.toFixed(1)})`)
              return true
            }
          }
        }
      }
    }
    
    return false
  }

  /**
   * Retourne tous les points de départ possibles pour la Phase 3
   */
  private getPhase3StartPoints(existingPaths: RandomPath[], deadzoneBorderPoints: PathPoint[], canvasBorderPoints: PathPoint[]): PathPoint[] {
    // Récupérer tous les points de départ et d'arrivée des paths existants
    const usedStartEndPoints = new Set<string>()
    existingPaths.forEach(path => {
      usedStartEndPoints.add(MathUtils.getPointKey(path.startPath))
      usedStartEndPoints.add(MathUtils.getPointKey(path.endPath))
    })
    
    // Créer des Sets pour les points à exclure
    const deadzoneBorderSet = new Set<string>()
    deadzoneBorderPoints.forEach(point => {
      deadzoneBorderSet.add(MathUtils.getPointKey(point))
    })
    
    const canvasBorderSet = new Set<string>()
    canvasBorderPoints.forEach(point => {
      canvasBorderSet.add(MathUtils.getPointKey(point))
    })
    
    // Filtrer tous les points de la grille
    const availablePoints: PathPoint[] = this.gridManager.getGridPoints()
      .filter(point => {
        const pointKey = MathUtils.getPointKey(point)
        const deadZone = this.gridManager.getDeadZone()
        
        // Exclure si dans la deadzone
        if (deadZone && this.gridManager.isPointInDeadZone(point.x, point.y, deadZone)) {
          return false
        }
        
        // Exclure les bordures du canvas
        if (canvasBorderSet.has(pointKey)) {
          return false
        }
        
        // Exclure les bordures de la deadzone
        if (deadzoneBorderSet.has(pointKey)) {
          return false
        }
        
        // Exclure les points de départ/arrivée des paths existants
        if (usedStartEndPoints.has(pointKey)) {
          return false
        }
        
        return true
      })
      .map(point => ({ ...point, isUsed: false }))
    
    return availablePoints
  }

  /**
   * Trie les points par "isolement" (distance aux points de départ/arrivée existants)
   */
  private sortPointsByIsolation(points: PathPoint[], existingPaths: RandomPath[]): PathPoint[] {
    // Récupérer tous les points de départ et d'arrivée des paths existants
    const startEndPoints: Point[] = []
    existingPaths.forEach(path => {
      startEndPoints.push(path.startPath)
      startEndPoints.push(path.endPath)
    })
    
    if (startEndPoints.length === 0) {
      return [...points]
    }
    
    // Calculer la distance minimale aux points existants pour chaque point
    const pointsWithDistance = points.map(point => {
      let minDistance = Infinity
      
      startEndPoints.forEach(existingPoint => {
        const distance = MathUtils.getPointDistance(point, existingPoint)
        if (distance < minDistance) {
          minDistance = distance
        }
      })
      
      return {
        point: point,
        isolationDistance: minDistance
      }
    })
    
    // Trier par distance d'isolement décroissante (plus isolé = plus grande distance)
    pointsWithDistance.sort((a, b) => b.isolationDistance - a.isolationDistance)
    
    return pointsWithDistance.map(item => item.point)
  }

  /**
   * Cherche un point d'arrivée valide pour un point de départ donné en Phase 3
   */
  private findValidEndPointForPhase3(startPoint: PathPoint, existingPaths: RandomPath[]): Point | null {
    // Obtenir tous les points de grille possibles (sauf ceux dans la deadzone)
    const allCandidates = this.gridManager.getGridPoints().filter(point => {
      const deadZone = this.gridManager.getDeadZone()
      
      // Exclure le point de départ lui-même
      if (MathUtils.arePointsEqual(point, startPoint)) {
        return false
      }
      
      // Exclure si dans la deadzone
      if (deadZone && this.gridManager.isPointInDeadZone(point.x, point.y, deadZone)) {
        return false
      }
      
      return true
    })
    
    // Mélanger l'ordre pour tester différents candidats
    const shuffledCandidates = [...allCandidates].sort(() => Math.random() - 0.5)
    
    // Essayer plusieurs candidats
    const maxCandidates = Math.min(20, shuffledCandidates.length)
    
    for (let i = 0; i < maxCandidates; i++) {
      const candidate = shuffledCandidates[i]
      
      // Vérifier qu'un chemin A* existe
      const testPath = this.pathfindingEngine.aStar(startPoint, candidate)
      
      if (testPath && testPath.length >= 2) {
        // Vérifier que le chemin ne croise pas les paths existants
        if (!this.doesPathIntersectWithExisting(testPath, existingPaths, true)) {
          return candidate
        }
      }
    }
    
    return null
  }
} 