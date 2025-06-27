import type GridManager from './GridManager'
import type { RandomPath, StatisticsData } from '../types'

export default class StatisticsManager {
  private gridManager: GridManager

  constructor(gridManager: GridManager) {
    this.gridManager = gridManager
  }

  /**
   * Calcule les statistiques complètes des chemins aléatoires
   */
  public getRandomPathsStats(randomPaths: RandomPath[]): StatisticsData {
    const deadzonePoints = this.gridManager.getDeadzoneBorderPoints()
    const canvasPoints = this.gridManager.getCanvasBorderPoints()
    
    return {
      totalPaths: randomPaths.length,
      deadzonePointsAvailable: deadzonePoints.filter(p => !p.isUsed).length,
      canvasPointsAvailable: canvasPoints.filter(p => !p.isUsed).length,
      deadzonePointsUsed: deadzonePoints.filter(p => p.isUsed).length,
      canvasPointsUsed: canvasPoints.filter(p => p.isUsed).length
    }
  }

  /**
   * Calcule des statistiques avancées sur les chemins
   */
  public getAdvancedPathStats(randomPaths: RandomPath[]): object {
    if (randomPaths.length === 0) {
      return {
        totalPaths: 0,
        averagePathLength: 0,
        shortestPath: 0,
        longestPath: 0,
        totalPathPoints: 0,
        pathLengthDistribution: {}
      }
    }

    const pathLengths = randomPaths
      .filter(path => path.path && path.path.length > 0)
      .map(path => path.path!.length)

    const totalPathPoints = pathLengths.reduce((sum, length) => sum + length, 0)
    const averagePathLength = totalPathPoints / pathLengths.length
    const shortestPath = Math.min(...pathLengths)
    const longestPath = Math.max(...pathLengths)

    // Distribution des longueurs de chemins
    const lengthDistribution: { [key: number]: number } = {}
    pathLengths.forEach(length => {
      lengthDistribution[length] = (lengthDistribution[length] || 0) + 1
    })

    return {
      totalPaths: randomPaths.length,
      averagePathLength: Math.round(averagePathLength * 100) / 100,
      shortestPath,
      longestPath,
      totalPathPoints,
      pathLengthDistribution: lengthDistribution
    }
  }

  /**
   * Analyse la répartition géographique des chemins
   */
  public getGeographicStats(randomPaths: RandomPath[]): object {
    if (randomPaths.length === 0) {
      return {
        startPointsDistribution: {},
        endPointsDistribution: {},
        averageStartX: 0,
        averageStartY: 0,
        averageEndX: 0,
        averageEndY: 0
      }
    }

    const startPoints = randomPaths.map(path => path.startPath)
    const endPoints = randomPaths.map(path => path.endPath)

    // Moyennes des positions
    const avgStartX = startPoints.reduce((sum, p) => sum + p.x, 0) / startPoints.length
    const avgStartY = startPoints.reduce((sum, p) => sum + p.y, 0) / startPoints.length
    const avgEndX = endPoints.reduce((sum, p) => sum + p.x, 0) / endPoints.length
    const avgEndY = endPoints.reduce((sum, p) => sum + p.y, 0) / endPoints.length

    // Distribution des points de départ par zone
    const startDistribution = this.categorizePointsByZone(startPoints)
    const endDistribution = this.categorizePointsByZone(endPoints)

    return {
      startPointsDistribution: startDistribution,
      endPointsDistribution: endDistribution,
      averageStartX: Math.round(avgStartX),
      averageStartY: Math.round(avgStartY),
      averageEndX: Math.round(avgEndX),
      averageEndY: Math.round(avgEndY)
    }
  }

  /**
   * Catégorise les points par zone géographique
   */
  private categorizePointsByZone(points: { x: number, y: number }[]): object {
    const canvasWidth = this.gridManager.getCanvasWidth()
    const canvasHeight = this.gridManager.getCanvasHeight()
    
    const zones = {
      topLeft: 0,
      topRight: 0,
      bottomLeft: 0,
      bottomRight: 0,
      center: 0
    }

    points.forEach(point => {
      const isLeft = point.x < canvasWidth / 2
      const isTop = point.y < canvasHeight / 2
      const isNearCenter = Math.abs(point.x - canvasWidth / 2) < canvasWidth / 4 && 
                          Math.abs(point.y - canvasHeight / 2) < canvasHeight / 4

      if (isNearCenter) {
        zones.center++
      } else if (isLeft && isTop) {
        zones.topLeft++
      } else if (!isLeft && isTop) {
        zones.topRight++
      } else if (isLeft && !isTop) {
        zones.bottomLeft++
      } else {
        zones.bottomRight++
      }
    })

    return zones
  }

  /**
   * Calcule l'efficacité des chemins (rapport longueur réelle / distance directe)
   */
  public getPathEfficiencyStats(randomPaths: RandomPath[]): object {
    if (randomPaths.length === 0) {
      return {
        averageEfficiency: 0,
        mostEfficientPath: 0,
        leastEfficientPath: 0,
        efficiencyDistribution: {}
      }
    }

    const efficiencies: number[] = []

    randomPaths.forEach(randomPath => {
      if (randomPath.path && randomPath.path.length > 1) {
        // Distance réelle du chemin (nombre de segments)
        const actualDistance = randomPath.path.length - 1
        
        // Distance directe (euclidienne)
        const dx = randomPath.endPath.x - randomPath.startPath.x
        const dy = randomPath.endPath.y - randomPath.startPath.y
        const directDistance = Math.sqrt(dx * dx + dy * dy)
        
        if (directDistance > 0) {
          const efficiency = directDistance / actualDistance
          efficiencies.push(efficiency)
        }
      }
    })

    if (efficiencies.length === 0) {
      return {
        averageEfficiency: 0,
        mostEfficientPath: 0,
        leastEfficientPath: 0,
        efficiencyDistribution: {}
      }
    }

    const avgEfficiency = efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length
    const mostEfficient = Math.max(...efficiencies)
    const leastEfficient = Math.min(...efficiencies)

    // Distribution par tranche d'efficacité
    const distribution = {
      veryEfficient: efficiencies.filter(e => e > 0.8).length,    // > 80%
      efficient: efficiencies.filter(e => e > 0.6 && e <= 0.8).length,  // 60-80%
      moderate: efficiencies.filter(e => e > 0.4 && e <= 0.6).length,   // 40-60%
      inefficient: efficiencies.filter(e => e <= 0.4).length     // <= 40%
    }

    return {
      averageEfficiency: Math.round(avgEfficiency * 1000) / 1000,
      mostEfficientPath: Math.round(mostEfficient * 1000) / 1000,
      leastEfficientPath: Math.round(leastEfficient * 1000) / 1000,
      efficiencyDistribution: distribution
    }
  }

  /**
   * Génère un rapport complet de statistiques
   */
  public generateFullReport(randomPaths: RandomPath[]): string {
    const basicStats = this.getRandomPathsStats(randomPaths)
    const advancedStats = this.getAdvancedPathStats(randomPaths)
    const geoStats = this.getGeographicStats(randomPaths)
    const efficiencyStats = this.getPathEfficiencyStats(randomPaths)

    return `
📊 RAPPORT STATISTIQUES COMPLET
================================

🎯 Statistiques de base:
• Chemins créés: ${basicStats.totalPaths}
• Points deadzone disponibles: ${basicStats.deadzonePointsAvailable}
• Points deadzone utilisés: ${basicStats.deadzonePointsUsed}
• Points canvas disponibles: ${basicStats.canvasPointsAvailable}
• Points canvas utilisés: ${basicStats.canvasPointsUsed}

📏 Longueurs de chemins:
• Longueur moyenne: ${(advancedStats as any).averagePathLength} points
• Chemin le plus court: ${(advancedStats as any).shortestPath} points
• Chemin le plus long: ${(advancedStats as any).longestPath} points
• Total de points de chemin: ${(advancedStats as any).totalPathPoints}

🌍 Répartition géographique:
• Position moyenne des départs: (${(geoStats as any).averageStartX}, ${(geoStats as any).averageStartY})
• Position moyenne des arrivées: (${(geoStats as any).averageEndX}, ${(geoStats as any).averageEndY})

⚡ Efficacité des chemins:
• Efficacité moyenne: ${((efficiencyStats as any).averageEfficiency * 100).toFixed(1)}%
• Chemin le plus efficace: ${((efficiencyStats as any).mostEfficientPath * 100).toFixed(1)}%
• Chemin le moins efficace: ${((efficiencyStats as any).leastEfficientPath * 100).toFixed(1)}%

🏆 Distribution d'efficacité:
• Très efficaces (>80%): ${(efficiencyStats as any).efficiencyDistribution.veryEfficient}
• Efficaces (60-80%): ${(efficiencyStats as any).efficiencyDistribution.efficient}
• Modérés (40-60%): ${(efficiencyStats as any).efficiencyDistribution.moderate}
• Inefficaces (<40%): ${(efficiencyStats as any).efficiencyDistribution.inefficient}
    `.trim()
  }

  /**
   * Affiche les statistiques dans la console avec formatage
   */
  public logDetailedStats(randomPaths: RandomPath[]): void {
    console.group('📊 Statistiques détaillées des chemins')
    
    console.log('🎯 Statistiques de base:', this.getRandomPathsStats(randomPaths))
    console.log('📏 Statistiques avancées:', this.getAdvancedPathStats(randomPaths))
    console.log('🌍 Répartition géographique:', this.getGeographicStats(randomPaths))
    console.log('⚡ Efficacité des chemins:', this.getPathEfficiencyStats(randomPaths))
    
    console.groupEnd()
  }

  /**
   * Exporte les statistiques au format JSON
   */
  public exportStatsAsJSON(randomPaths: RandomPath[]): string {
    const stats = {
      basic: this.getRandomPathsStats(randomPaths),
      advanced: this.getAdvancedPathStats(randomPaths),
      geographic: this.getGeographicStats(randomPaths),
      efficiency: this.getPathEfficiencyStats(randomPaths),
      timestamp: new Date().toISOString()
    }
    
    return JSON.stringify(stats, null, 2)
  }

  /**
   * Compare deux sets de chemins
   */
  public comparePathSets(paths1: RandomPath[], paths2: RandomPath[], label1: string = 'Set 1', label2: string = 'Set 2'): string {
    const stats1 = this.getRandomPathsStats(paths1)
    const stats2 = this.getRandomPathsStats(paths2)
    const advanced1 = this.getAdvancedPathStats(paths1)
    const advanced2 = this.getAdvancedPathStats(paths2)

    return `
🔍 COMPARAISON DE CHEMINS
========================

${label1}:
• Chemins: ${stats1.totalPaths}
• Longueur moyenne: ${(advanced1 as any).averagePathLength}

${label2}:
• Chemins: ${stats2.totalPaths}
• Longueur moyenne: ${(advanced2 as any).averagePathLength}

Différences:
• Chemins: ${stats2.totalPaths - stats1.totalPaths} (${stats2.totalPaths > stats1.totalPaths ? '+' : ''}${((stats2.totalPaths - stats1.totalPaths) / Math.max(stats1.totalPaths, 1) * 100).toFixed(1)}%)
• Longueur moyenne: ${((advanced2 as any).averagePathLength - (advanced1 as any).averagePathLength).toFixed(2)} points
    `.trim()
  }
} 