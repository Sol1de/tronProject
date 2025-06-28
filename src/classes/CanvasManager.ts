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
  public drawTronPaths(lineWidth: number = 2, showEndCircles: boolean = true): void {
    this.renderer.drawTronPaths(this.randomPaths, lineWidth, showEndCircles)
  }

  /**
   * Anime tous les chemins avec le style Tron de manière progressive
   */
  public animateTronPaths(
    lineWidth: number = 2, 
    durationMs: number = 2000, // Durée totale en millisecondes
    clearFirst: boolean = true,
    onComplete?: () => void
  ): void {
    if (this.randomPaths.length === 0) {
      onComplete?.()
      return
    }

    // Animation fluide à 60 FPS avec effacement automatique
    const startTime = performance.now()
    const showGrid = this.showGrid

    const animateFrame = (currentTime: number) => {
      const elapsedTime = currentTime - startTime
      const progress = Math.min(elapsedTime / durationMs, 1.0)

      // Effacer et redessiner la grille à chaque frame
      if (clearFirst) {
        this.redraw(showGrid)
      }

      // Dessiner les chemins avec le progrès actuel
      this.renderer.save()
      this.renderer.setLineWidth(lineWidth)
      
      // Dessiner chaque chemin partiellement
      this.randomPaths.forEach(randomPath => {
        if (randomPath.path && randomPath.path.length >= 2) {
          const reversedPath = [...randomPath.path].reverse()
          this.renderer.drawTronPathPartial(reversedPath, progress, lineWidth)
        }
      })
      
      this.renderer.restore()

      if (progress < 1.0) {
        requestAnimationFrame(animateFrame)
      } else {
        // Tous les chemins sont terminés, maintenant animer tous les cercles simultanément
        const endPoints = this.randomPaths
          .filter(rp => rp.path && rp.path.length >= 2)
          .map(rp => rp.path![0])  // Premier point = point final dans la deadzone
        
        if (endPoints.length > 0) {
          // Animer tous les cercles en parallèle
          Promise.all(endPoints.map(endPoint => 
            this.animateEndCircle(endPoint, 300, 6)  // Rayon 6 pixels
          )).then(() => {
            if (onComplete) {
              onComplete()
            }
          })
        } else {
          if (onComplete) {
            onComplete()
          }
        }
      }
    }

    requestAnimationFrame(animateFrame)
  }

  /**
   * Anime les chemins Tron avec une durée totale spécifiée
   */
  public animateTronPathsWithDuration(
    totalDurationMs: number,
    lineWidth: number = 2,
    clearFirst: boolean = true,
    onComplete?: () => void
  ): void {
    console.log(`🎬 Animation fluide avec durée: ${totalDurationMs}ms`)
    this.animateTronPaths(lineWidth, totalDurationMs, clearFirst, onComplete)
  }

  /**
   * Animation Tron LENTE (durée longue)
   */
  public animateTronPathsSlow(
    lineWidth: number = 2,
    clearFirst: boolean = true,
    onComplete?: () => void
  ): void {
    console.log('🐌 Animation Tron LENTE')
    this.animateTronPaths(lineWidth, 4000, clearFirst, onComplete) // 4 secondes
  }

  /**
   * Animation Tron NORMALE
   */
  public animateTronPathsNormal(
    lineWidth: number = 2,
    clearFirst: boolean = true,
    onComplete?: () => void
  ): void {
    console.log('🚶 Animation Tron NORMALE')
    this.animateTronPaths(lineWidth, 2500, clearFirst, onComplete) // 2.5 secondes
  }

  /**
   * Animation Tron RAPIDE
   */
  public animateTronPathsFast(
    lineWidth: number = 2,
    clearFirst: boolean = true,
    onComplete?: () => void
  ): void {
    console.log('🚀 Animation Tron RAPIDE')
    this.animateTronPaths(lineWidth, 1500, clearFirst, onComplete) // 1.5 secondes
  }

  /**
   * Animation Tron TRÈS RAPIDE
   */
  public animateTronPathsVeryFast(
    lineWidth: number = 2,
    clearFirst: boolean = true,
    onComplete?: () => void
  ): void {
    console.log('⚡ Animation Tron TRÈS RAPIDE')
    this.animateTronPaths(lineWidth, 800, clearFirst, onComplete) // 0.8 secondes
  }

  /**
   * Anime un seul chemin Tron
   */
  public animateTronPath(
    pathIndex: number,
    lineWidth: number = 2,
    durationMs: number = 2000,
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

    // Animation fluide du chemin individuel
    const startTime = performance.now()
    const showGrid = this.showGrid
    const reversedPath = [...path].reverse()

    const animateFrame = (currentTime: number) => {
      const elapsedTime = currentTime - startTime
      const progress = Math.min(elapsedTime / durationMs, 1.0)

      // Effacer et redessiner la grille à chaque frame
      if (clearFirst) {
        this.redraw(showGrid)
      }

      // Dessiner le chemin avec le progrès actuel
      this.renderer.save()
      this.renderer.drawTronPathPartial(reversedPath, progress, lineWidth)
      this.renderer.restore()

      if (progress < 1.0) {
        requestAnimationFrame(animateFrame)
      } else {
        // Animation du chemin terminée, maintenant animer le cercle avec délai et fondu
        const endPoint = reversedPath[reversedPath.length - 1]
        this.animateEndCircle(endPoint, 300, 6).then(() => {
          if (onComplete) {
            onComplete()
          }
        })
      }
    }

    requestAnimationFrame(animateFrame)
  }

  /**
   * Redessine le canvas avec les chemins en style Tron
   */
  public redrawWithTron(showGrid?: boolean, lineWidth: number = 2, showEndCircles: boolean = true): void {
    this.redraw(showGrid)
    this.drawTronPaths(lineWidth, showEndCircles)
  }

  /**
   * Démarre l'animation Tron séquentielle (un chemin après l'autre)
   */
  public animateTronPathsSequentially(
    lineWidth: number = 2,
    pathDurationMs: number = 1500,
    pathDelayMs: number = 200,
    clearFirst: boolean = true,
    onComplete?: () => void
  ): void {
    if (this.randomPaths.length === 0) {
      onComplete?.()
      return
    }

    const validPaths = this.randomPaths.filter(rp => rp.path && rp.path.length >= 2)
    let currentPathIndex = 0
    const completedPaths: Array<{path: Point[], index: number}> = [] // Garder trace des chemins terminés
    const completedCircles: Array<{endPoint: Point, radius: number}> = [] // Garder trace des cercles terminés

    const animateNextPath = () => {
      if (currentPathIndex >= validPaths.length) {
        onComplete?.()
        return
      }

      const currentPath = validPaths[currentPathIndex]
      const pathInOriginalArray = this.randomPaths.indexOf(currentPath)

      if (currentPath.path) {
        // Animation fluide du chemin courant avec gestion des chemins précédents
        const startTime = performance.now()
        const showGrid = this.showGrid
        const reversedPath = [...currentPath.path].reverse()

        const animateFrame = (currentTime: number) => {
          const elapsedTime = currentTime - startTime
          const progress = Math.min(elapsedTime / pathDurationMs, 1.0)

          // Effacer et redessiner la grille à chaque frame
          if (clearFirst) {
            this.redraw(showGrid)
          }

          // Redessiner tous les chemins déjà terminés
          this.renderer.save()
          completedPaths.forEach(completedPath => {
            this.renderer.drawTronPathPartial(completedPath.path, 1.0, lineWidth, true)
          })
          
          // Redessiner tous les cercles déjà terminés
          completedCircles.forEach(circle => {
            this.renderer.drawTronEndCircle(circle.endPoint, circle.radius, 1.0)
          })

          // Dessiner le chemin en cours d'animation
          this.renderer.drawTronPathPartial(reversedPath, progress, lineWidth, true)
          this.renderer.restore()

          if (progress < 1.0) {
            requestAnimationFrame(animateFrame)
          } else {
            // Ajouter ce chemin aux chemins terminés
            completedPaths.push({
              path: reversedPath,
              index: pathInOriginalArray
            })
            
            // Animer le cercle avec délai et fondu
            const endPoint = reversedPath[reversedPath.length - 1]
            this.animateEndCircle(endPoint, 300, 6).then(() => {
              // Ajouter le cercle aux cercles terminés
              completedCircles.push({
                endPoint: endPoint,
                radius: 6
              })
              
              currentPathIndex++
              setTimeout(animateNextPath, pathDelayMs)
            })
          }
        }

        requestAnimationFrame(animateFrame)
      } else {
        currentPathIndex++
        setTimeout(animateNextPath, pathDelayMs)
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
    console.log('🚀 Démonstration des fonctionnalités Tron fluides')
    
    // 1. Toujours générer de nouveaux chemins pour la démo
    console.log('🔄 Génération de nouveaux chemins...')
    this.setRandomPaths() // Génère de nouveaux paths à chaque fois
    console.log('✅ Nouveaux chemins générés (nombre optimal)')

    // 2. Effacer et redessiner la grille
    this.redraw(true)
    console.log('✅ Grille redessinée')

    // 3. Exemple 1: Animation de tous les chemins simultanément
    setTimeout(() => {
      console.log('🎬 Animation simultanée fluide de tous les chemins')
      this.animateTronPathsNormal(2, true, () => {
        console.log('✅ Animation simultanée terminée')
        
        // 4. Exemple 2: Animation séquentielle après un délai
        setTimeout(() => {
          console.log('🎬 Animation séquentielle fluide des chemins')
          this.animateTronPathsSequentially(2, 1200, 300, true, () => {
            console.log('✅ Animation séquentielle terminée')
            
            // 5. Exemple 3: Affichage statique Tron après un délai
            setTimeout(() => {
              console.log('🎨 Affichage statique style Tron avec cercles')
              this.redrawWithTron(true, 2, true)
              console.log('✅ Style Tron appliqué avec cercles de fin')
            }, 2000)
          })
        }, 2000)
      })
    }, 1000)
  }

  /**
   * Méthode utilitaire pour tester une animation spécifique
   */
  public testTronAnimation(mode: 'simultaneous' | 'sequential' | 'static' | 'slow' | 'normal' | 'fast' | 'very-fast' = 'simultaneous'): void {
    // TOUJOURS générer de nouveaux chemins à chaque test
    console.log('🔄 Génération de nouveaux chemins pour le test...')
    this.setRandomPaths()
    console.log('✅ Nouveaux chemins générés')

    switch (mode) {
      case 'simultaneous':
        console.log('🎬 Test: Animation simultanée fluide (normale)')
        this.animateTronPathsNormal(2, true, () => {
          console.log('✅ Test animation simultanée terminé')
        })
        break
        
      case 'sequential':
        console.log('🎬 Test: Animation séquentielle fluide')
        this.animateTronPathsSequentially(2, 1200, 250, true, () => {
          console.log('✅ Test animation séquentielle terminé')
        })
        break
        
      case 'static':
        console.log('🎨 Test: Affichage statique Tron avec cercles')
        this.redrawWithTron(true, 2, true)
        console.log('✅ Test affichage statique avec cercles terminé')
        break

      case 'slow':
        console.log('🎬 Test: Animation fluide LENTE')
        this.animateTronPathsSlow(2, true, () => {
          console.log('✅ Test animation lente terminé')
        })
        break

      case 'normal':
        console.log('🎬 Test: Animation fluide NORMALE')
        this.animateTronPathsNormal(2, true, () => {
          console.log('✅ Test animation normale terminé')
        })
        break

      case 'fast':
        console.log('🎬 Test: Animation fluide RAPIDE')
        this.animateTronPathsFast(2, true, () => {
          console.log('✅ Test animation rapide terminé')
        })
        break

      case 'very-fast':
        console.log('🎬 Test: Animation fluide TRÈS RAPIDE')
        this.animateTronPathsVeryFast(2, true, () => {
          console.log('✅ Test animation très rapide terminé')
        })
        break
    }
  }

  /**
   * Test avec durée personnalisée (en millisecondes)
   */
  public testTronAnimationWithDuration(durationMs: number): void {
    console.log('🔄 Génération de nouveaux chemins pour le test...')
    this.setRandomPaths()
    console.log(`🎬 Test: Animation fluide avec durée personnalisée (${durationMs}ms)`)
    
    this.animateTronPathsWithDuration(durationMs, 2, true, () => {
      console.log('✅ Test animation personnalisée terminé')
    })
  }

  /**
   * Démo des différentes vitesses d'animation fluide
   */
  public demonstrateAnimationSpeeds(): void {
    console.log('🚀 Démonstration des différentes vitesses d\'animation fluide')
    
    // Générer de nouveaux chemins
    this.setRandomPaths()
    
    // Séquence de démonstration des vitesses
    setTimeout(() => {
      console.log('1️⃣ Animation fluide TRÈS RAPIDE...')
      this.animateTronPathsVeryFast(2, true, () => {
        setTimeout(() => {
          console.log('2️⃣ Animation fluide RAPIDE...')
          this.animateTronPathsFast(2, true, () => {
            setTimeout(() => {
              console.log('3️⃣ Animation fluide NORMALE...')
              this.animateTronPathsNormal(2, true, () => {
                setTimeout(() => {
                  console.log('4️⃣ Animation fluide LENTE...')
                  this.animateTronPathsSlow(2, true, () => {
                    console.log('✅ Démonstration des vitesses terminée')
                  })
                }, 1000)
              })
            }, 1000)
          })
        }, 1000)
      })
    }, 500)
  }

  /**
   * Anime un cercle de fin avec une animation d'arc progressif (sans délai)
   */
  private animateEndCircle(
    endPoint: Point, 
    animationDuration: number = 300,
    radius: number = 6
  ): Promise<void> {
    return new Promise(resolve => {
      const startTime = performance.now()
      
      const arcAnimation = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / animationDuration, 1.0)
        
        // Fonction d'easing pour un arc plus fluide
        const easedProgress = progress * progress * (3 - 2 * progress) // smoothstep
        
        // Dessiner seulement le cercle avec l'arc progressif (sans effacer le reste)
        this.renderer.save()
        this.renderer.drawTronEndCirclePartial(endPoint, radius, easedProgress)
        this.renderer.restore()
        
        if (progress < 1.0) {
          requestAnimationFrame(arcAnimation)
        } else {
          resolve()
        }
      }
      
      requestAnimationFrame(arcAnimation)
    })
  }

  /**
   * Méthode de débogage pour vérifier les positions des cercles
   */
  public debugCirclePositions(): void {
    console.log('🔍 Debug: Positions des cercles')
    this.randomPaths.forEach((randomPath, index) => {
      if (randomPath.path && randomPath.path.length >= 2) {
        const startPoint = randomPath.path[0] // Point dans la deadzone
        const endPoint = randomPath.path[randomPath.path.length - 1] // Point à la bordure
        console.log(`Path ${index + 1}:`)
        console.log(`  - Début (deadzone): (${startPoint.x}, ${startPoint.y})`)
        console.log(`  - Fin (bordure): (${endPoint.x}, ${endPoint.y})`)
        console.log(`  - Cercle devrait être à: (${startPoint.x}, ${startPoint.y})`)
      }
    })
  }
} 