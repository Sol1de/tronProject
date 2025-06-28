import type { Point, RandomPath } from '../types'

export default class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D
  ) {
    this.canvas = canvas
    this.context = context
  }

  /**
   * Dessine une ligne entre deux points
   */
  public drawLine(startX: number, startY: number, endX: number, endY: number, strokeStyle?: string, lineWidth?: number): void {
    this.context.beginPath()
    this.context.moveTo(startX, startY)
    this.context.lineTo(endX, endY)
    this.context.strokeStyle = strokeStyle || 'white'
    this.context.lineWidth = lineWidth || 1
    this.context.stroke()
    this.context.closePath()
  }

  /**
   * Dessine un cercle plein
   */
  public drawCircle(coordX: number, coordY: number, radius: number, fillStyle?: string): void {
    this.context.fillStyle = fillStyle || 'white'
    this.context.beginPath()
    this.context.arc(coordX, coordY, radius, 0, 2 * Math.PI)
    this.context.fill()
    this.context.closePath()
  }

  /**
   * Dessine un rectangle plein
   */
  public drawRectangle(coordX: number, coordY: number, width: number, height: number, fillStyle?: string): void {
    this.context.fillStyle = fillStyle || 'white'
    this.context.beginPath()
    this.context.rect(coordX, coordY, width, height)
    this.context.fill()
    this.context.closePath()
  }

  /**
   * Dessine un triangle avec rotation
   */
  public drawTriangle(coordX: number, coordY: number, width: number, height: number, rotation: number, fillStyle?: string): void {
    this.context.save()
    this.context.fillStyle = fillStyle || 'white'
    this.context.translate(coordX + width/2, coordY + height/2)
    this.context.rotate(rotation * Math.PI / 180)
    this.context.beginPath()
    this.context.moveTo(-width/2, -height/2)
    this.context.lineTo(width/2, -height/2)
    this.context.lineTo(0, height/2)
    this.context.closePath()
    this.context.fill()
    this.context.restore()
  }

  /**
   * Dessine un chemin sous forme de lignes connectées
   */
  public drawPath(chemin: Point[], strokeStyle: string = 'green', lineWidth: number = 3): void {
    if (chemin.length < 2) return
    
    for (let i = 0; i < chemin.length - 1; i++) {
      this.drawLine(
        chemin[i].x, 
        chemin[i].y, 
        chemin[i + 1].x, 
        chemin[i + 1].y, 
        strokeStyle, 
        lineWidth
      )
    }
    
    // Dessiner les points de départ et d'arrivée
    this.drawCircle(chemin[0].x, chemin[0].y, 6, 'blue')
    this.drawCircle(chemin[chemin.length - 1].x, chemin[chemin.length - 1].y, 6, 'red')
  }

  /**
   * Dessine plusieurs chemins aléatoires avec des couleurs différentes
   */
  public drawRandomPaths(randomPaths: RandomPath[], _strokeStyle: string = 'orange', lineWidth: number = 2): void {
    randomPaths.forEach((randomPath) => {
      if (randomPath.path) {
        const colors = ['orange', 'cyan', 'magenta', 'lime', 'yellow', 'pink', 'lightblue', 'lightgreen']
        const color = colors[Math.floor(Math.random() * colors.length)]
        this.drawPath(randomPath.path, color, lineWidth)
        
        // Ajouter un numéro au milieu du chemin
        const midPoint = randomPath.path[Math.floor(randomPath.path.length / 2)]
        this.drawText(`${Math.floor(Math.random() * 8 + 1)}`, midPoint.x + 10, midPoint.y - 10, 'white', '12px Arial')
      }
    })
  }

  /**
   * Dessine du texte à la position spécifiée
   */
  public drawText(text: string, x: number, y: number, fillStyle: string = 'white', font: string = '12px Arial'): void {
    this.context.fillStyle = fillStyle
    this.context.font = font
    this.context.fillText(text, x, y)
  }

  /**
   * Efface tout le canvas
   */
  public clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * Dessine un point de grille
   */
  public drawGridPoint(point: Point, color: string = 'yellow', radius: number = 3): void {
    this.drawCircle(point.x, point.y, radius, color)
  }

  /**
   * Dessine une ligne de grille avec interruption pour deadzone
   */
  public drawGridLineWithDeadZone(
    startX: number, startY: number, 
    endX: number, endY: number, 
    deadzoneLeft: number, deadzoneRight: number,
    deadzoneTop: number, deadzoneBottom: number,
    direction: 'horizontal' | 'vertical'
  ): void {
    if (direction === 'horizontal') {
      if (startY >= deadzoneTop && startY <= deadzoneBottom) {
        if (startX < deadzoneLeft) {
          this.drawLine(startX, startY, deadzoneLeft, startY, 'white', 1)
        }
        if (endX > deadzoneRight) {
          this.drawLine(deadzoneRight, startY, endX, startY, 'white', 1)
        }
      } else {
        this.drawLine(startX, startY, endX, startY, 'white', 1)
      }
    } else {
      if (startX >= deadzoneLeft && startX <= deadzoneRight) {
        if (startY < deadzoneTop) {
          this.drawLine(startX, startY, startX, deadzoneTop, 'white', 1)
        }
        if (endY > deadzoneBottom) {
          this.drawLine(startX, deadzoneBottom, startX, endY, 'white', 1)
        }
      } else {
        this.drawLine(startX, startY, startX, endY, 'white', 1)
      }
    }
  }

  /**
   * Dessine la bordure d'une deadzone
   */
  public drawDeadZoneBoundary(
    left: number, right: number, 
    top: number, bottom: number,
    gridSizeWidth: number, gridSizeHeight: number
  ): void {
    // Dessiner le rectangle de la deadzone
    this.drawLine(left, top, right, top, 'red', 2)
    this.drawLine(right, top, right, bottom, 'red', 2)
    this.drawLine(right, bottom, left, bottom, 'red', 2)
    this.drawLine(left, bottom, left, top, 'red', 2)
    
    // Dessiner les points de bordure horizontaux
    for (let x = Math.ceil(left / gridSizeWidth) * gridSizeWidth; x <= right; x += gridSizeWidth) {
      if (x >= left && x <= right) {
        this.drawCircle(x, top, 4, 'red')
        this.drawCircle(x, bottom, 4, 'red')
      }
    }
    
    // Dessiner les points de bordure verticaux
    for (let y = Math.ceil(top / gridSizeHeight) * gridSizeHeight; y <= bottom; y += gridSizeHeight) {
      if (y >= top && y <= bottom) {
        this.drawCircle(left, y, 4, 'red')
        this.drawCircle(right, y, 4, 'red')
      }
    }
  }

  /**
   * Dessine les points de grille avec possibilité de les masquer
   */
  public drawGridPoints(gridPoints: Point[], showPoints: boolean = true): void {
    if (showPoints) {
      gridPoints.forEach(point => {
        this.drawGridPoint(point)
      })
    }
  }

  /**
   * Dessine les lignes de grille
   */
  public drawGridLines(
    width: number, height: number,
    gridSizeWidth: number, gridSizeHeight: number,
    hasDeadZone: boolean = false,
    deadzoneLeft?: number, deadzoneRight?: number,
    deadzoneTop?: number, deadzoneBottom?: number
  ): void {
    // Lignes horizontales
    for (let row = 0; row <= height / gridSizeHeight; row++) {
      const y = row * gridSizeHeight

      if (hasDeadZone && deadzoneLeft !== undefined && deadzoneRight !== undefined && deadzoneTop !== undefined && deadzoneBottom !== undefined) {
        this.drawGridLineWithDeadZone(0, y, width, y, deadzoneLeft, deadzoneRight, deadzoneTop, deadzoneBottom, 'horizontal')
      } else {
        this.drawLine(0, y, width, y, 'white', 1)
      }
    }
    
    // Lignes verticales
    for (let col = 0; col <= width / gridSizeWidth; col++) {
      const x = col * gridSizeWidth
      
      if (hasDeadZone && deadzoneLeft !== undefined && deadzoneRight !== undefined && deadzoneTop !== undefined && deadzoneBottom !== undefined) {
        this.drawGridLineWithDeadZone(x, 0, x, height, deadzoneLeft, deadzoneRight, deadzoneTop, deadzoneBottom, 'vertical')
      } else {
        this.drawLine(x, 0, x, height, 'white', 1)
      }
    }
  }

  /**
   * Sauvegarde l'état actuel du contexte
   */
  public save(): void {
    this.context.save()
  }

  /**
   * Restaure l'état précédent du contexte
   */
  public restore(): void {
    this.context.restore()
  }

  /**
   * Définit la couleur de remplissage
   */
  public setFillStyle(color: string): void {
    this.context.fillStyle = color
  }

  /**
   * Définit la couleur de contour
   */
  public setStrokeStyle(color: string): void {
    this.context.strokeStyle = color
  }

  /**
   * Définit l'épaisseur des lignes
   */
  public setLineWidth(width: number): void {
    this.context.lineWidth = width
  }

  /**
   * Dessine tous les chemins avec style Tron et cercles de fin (en évitant les intersections)
   */
  public drawTronPaths(randomPaths: RandomPath[], lineWidth: number = 2, showEndCircles: boolean = true): void {
    // Sauvegarder l'état actuel du contexte
    this.context.save()
    
    // Configuration du style Tron
    this.context.lineCap = 'round'
    this.context.lineJoin = 'round'
    
    let circlesSkipped = 0
    
    randomPaths.forEach((randomPath, index) => {
      if (randomPath.path) {
        this.drawTronPath(randomPath.path, lineWidth)
        
        // Ajouter le cercle à la fin du chemin si demandé et si pas d'intersection
        if (showEndCircles) {
          // Le premier point du chemin original est le point final (dans la deadzone)
          const endPoint = randomPath.path[0]
          
          // Vérifier si ce point final est sur une intersection
          if (!this.isEndPointOnIntersection(index, endPoint, randomPaths)) {
            this.drawTronEndCircle(endPoint, 6)
          } else {
            circlesSkipped++
          }
        }
      }
    })
    
    if (circlesSkipped > 0) {
      console.log(`🚫 ${circlesSkipped} cercles supprimés pour intersections (affichage statique)`)
    }
    
    // Restaurer l'état du contexte
    this.context.restore()
  }

  /**
   * Dessine un chemin unique avec le style Tron bleu néon
   */
  private drawTronPath(path: Point[], lineWidth: number = 2): void {
    if (path.length < 2) return
    
    // Couleurs bleu néon Tron
    const tronBlue = '#00FFFF'
    const tronGlow = '#0080FF'
    
    // Effet de lueur (glow) - dessiner plusieurs couches
    for (let layer = 0; layer < 3; layer++) {
      this.context.beginPath()
      this.context.moveTo(path[0].x, path[0].y)
      
      for (let i = 1; i < path.length; i++) {
        this.context.lineTo(path[i].x, path[i].y)
      }
      
      // Configuration selon la couche
      switch (layer) {
        case 0: // Couche extérieure (glow large)
          this.context.strokeStyle = tronGlow
          this.context.lineWidth = lineWidth + 4
          this.context.globalAlpha = 0.1
          this.context.shadowBlur = 15
          this.context.shadowColor = tronBlue
          break
        case 1: // Couche moyenne (glow moyen)
          this.context.strokeStyle = tronGlow
          this.context.lineWidth = lineWidth + 2
          this.context.globalAlpha = 0.3
          this.context.shadowBlur = 8
          this.context.shadowColor = tronBlue
          break
        case 2: // Couche intérieure (ligne principale)
          this.context.strokeStyle = tronBlue
          this.context.lineWidth = lineWidth
          this.context.globalAlpha = 1.0
          this.context.shadowBlur = 3
          this.context.shadowColor = tronBlue
          break
      }
      
      this.context.stroke()
    }
    
    // Plus de numérotation des chemins pour un rendu plus propre
  }

  /**
   * Dessine un chemin partiellement avec interpolation fluide
   */
  public drawTronPathPartial(path: Point[], progress: number, lineWidth: number = 2, shortenEnd: boolean = true, hasEndCircle: boolean = true): void {
    if (path.length < 2 || progress <= 0) return
    
    // Limiter le progrès à 1.0
    progress = Math.min(progress, 1.0)
    
    // Calculer la longueur totale et la longueur cible
    const totalLength = this.calculatePathLength(path)
    let targetLength = totalLength * progress
    
    // Raccourcir le chemin seulement si il aura un cercle de fin
    if (shortenEnd && progress >= 1.0 && hasEndCircle) {
      targetLength = Math.max(0, targetLength - 7) // Raccourcir de 7 pixels pour les cercles
    }
    
    let currentLength = 0
    let lastPoint = path[0]
    const drawPath: Point[] = [path[0]]
    
    // Construire le chemin partiel avec interpolation
    for (let i = 1; i < path.length; i++) {
      const currentPoint = path[i]
      const segmentLength = this.calculateDistance(lastPoint, currentPoint)
      
      if (currentLength + segmentLength <= targetLength) {
        // Segment complet
        drawPath.push(currentPoint)
        currentLength += segmentLength
        lastPoint = currentPoint
      } else {
        // Segment partiel avec interpolation
        const remainingLength = targetLength - currentLength
        const ratio = remainingLength / segmentLength
        
        const interpolatedPoint = {
          x: lastPoint.x + (currentPoint.x - lastPoint.x) * ratio,
          y: lastPoint.y + (currentPoint.y - lastPoint.y) * ratio
        }
        
        drawPath.push(interpolatedPoint)
        break
      }
    }
    
    // Dessiner le chemin partiel avec style Tron
    if (drawPath.length >= 2) {
      this.drawTronPathComplete(drawPath, lineWidth)
    }
  }

  /**
   * Dessine un chemin complet avec style Tron (sans numérotation)
   */
  public drawTronPathComplete(path: Point[], lineWidth: number = 2): void {
    if (path.length < 2) return
    
    // Couleurs bleu néon Tron
    const tronBlue = '#00FFFF'
    const tronGlow = '#0080FF'
    
    // Effet de lueur (glow) - dessiner plusieurs couches
    for (let layer = 0; layer < 3; layer++) {
      this.context.beginPath()
      this.context.moveTo(path[0].x, path[0].y)
      
      for (let i = 1; i < path.length; i++) {
        this.context.lineTo(path[i].x, path[i].y)
      }
      
      // Configuration selon la couche
      switch (layer) {
        case 0: // Couche extérieure (glow large)
          this.context.strokeStyle = tronGlow
          this.context.lineWidth = lineWidth + 4
          this.context.globalAlpha = 0.1
          this.context.shadowBlur = 15
          this.context.shadowColor = tronBlue
          break
        case 1: // Couche moyenne (glow moyen)
          this.context.strokeStyle = tronGlow
          this.context.lineWidth = lineWidth + 2
          this.context.globalAlpha = 0.3
          this.context.shadowBlur = 8
          this.context.shadowColor = tronBlue
          break
        case 2: // Couche intérieure (ligne principale)
          this.context.strokeStyle = tronBlue
          this.context.lineWidth = lineWidth
          this.context.globalAlpha = 1.0
          this.context.shadowBlur = 3
          this.context.shadowColor = tronBlue
          break
      }
      
      this.context.stroke()
    }
  }

  /**
   * Calcule la longueur totale d'un chemin
   */
  public calculatePathLength(path: Point[]): number {
    let totalLength = 0
    for (let i = 1; i < path.length; i++) {
      totalLength += this.calculateDistance(path[i - 1], path[i])
    }
    return totalLength
  }

  /**
   * Calcule la distance entre deux points
   */
  public calculateDistance(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Dessine un cercle néon avec bordure nette de 1 pixel (sans glow)
   */
  public drawTronEndCircle(point: Point, radius: number = 6, alpha: number = 1.0): void {
    this.context.save()
    
    // Utiliser la même couleur que les chemins (bleu néon Tron)
    const tronBlue = '#00FFFF'  // Même couleur que les paths
    
    // Dessiner seulement la bordure nette sans aucun effet
    this.context.beginPath()
    this.context.arc(point.x, point.y, radius, 0, 2 * Math.PI)
    
    // Bordure nette de 1 pixel - aucun effet
    this.context.strokeStyle = tronBlue
    this.context.lineWidth = 1
    this.context.globalAlpha = alpha
    // Supprimer complètement les effets shadow/glow
    this.context.shadowBlur = 0
    this.context.shadowColor = 'transparent'
    
    // Dessiner uniquement la bordure (stroke, pas fill)
    this.context.stroke()
    
    this.context.restore()
  }

  /**
   * Dessine un cercle partiellement (animation d'arc progressif) avec bordure nette de 1 pixel
   */
  public drawTronEndCirclePartial(point: Point, radius: number = 6, progress: number = 1.0): void {
    if (progress <= 0) return
    
    this.context.save()
    
    // Utiliser la même couleur que les chemins (bleu néon Tron)
    const tronBlue = '#00FFFF'
    
    // Calculer l'angle final basé sur le progrès (0 à 2π)
    const endAngle = progress * 2 * Math.PI
    
    // Dessiner seulement la bordure nette sans aucun effet
    this.context.beginPath()
    // Commencer à -π/2 (12h) et dessiner dans le sens horaire
    this.context.arc(point.x, point.y, radius, -Math.PI / 2, -Math.PI / 2 + endAngle)
    
    // Bordure nette de 1 pixel - aucun effet
    this.context.strokeStyle = tronBlue
    this.context.lineWidth = 1
    this.context.globalAlpha = 1.0
    // Supprimer complètement les effets shadow/glow
    this.context.shadowBlur = 0
    this.context.shadowColor = 'transparent'
    
    // Dessiner seulement l'arc
    this.context.stroke()
    
    this.context.restore()
  }

  /**
   * Anime les chemins Tron de manière progressive et fluide à 60 FPS
   */
  public animateTronPaths(
    randomPaths: RandomPath[], 
    lineWidth: number = 2,
    durationMs: number = 2000, // Durée totale en millisecondes
    onComplete?: () => void
  ): void {
    if (randomPaths.length === 0) {
      onComplete?.()
      return
    }

    // Préparer les chemins inversés (extérieur vers centre)
    const animationPaths = randomPaths.map(randomPath => ({
      path: randomPath.path ? [...randomPath.path].reverse() : [],
      pathIndex: randomPaths.indexOf(randomPath),
      isCompleted: false
    })).filter(item => item.path.length >= 2)

    if (animationPaths.length === 0) {
      onComplete?.()
      return
    }

    const startTime = performance.now()

    // Configuration du style Tron
    this.context.save()
    this.context.lineCap = 'round'
    this.context.lineJoin = 'round'
    
    const animateFrame = (currentTime: number) => {
      const elapsedTime = currentTime - startTime
      const progress = Math.min(elapsedTime / durationMs, 1.0)

      // Redessiner tous les chemins avec le progrès actuel
      animationPaths.forEach(animPath => {
        if (animPath.path.length >= 2) {
          // Marquer comme complété si le progrès est fini
          if (progress >= 1.0) {
            animPath.isCompleted = true
          }
          
          // Vérifier si ce path a un cercle de fin
          const endPoint = animPath.path[animPath.path.length - 1]
          const hasEndCircle = !this.isEndPointOnIntersection(animPath.pathIndex, endPoint, randomPaths)
          this.drawTronPathPartial(animPath.path, progress, lineWidth, true, hasEndCircle)
        }
      })

      if (progress < 1.0) {
        requestAnimationFrame(animateFrame)
      } else {
        this.context.restore()
        onComplete?.()
      }
    }

    requestAnimationFrame(animateFrame)
  }

  /**
   * Anime un seul chemin Tron de manière progressive et fluide à 60 FPS
   */
  public animateTronPath(
    path: Point[], 
    lineWidth: number = 2,
    durationMs: number = 2000, // Durée totale en millisecondes
    onComplete?: () => void,
    pathIndex?: number,
    allPaths?: RandomPath[]
  ): void {
    if (path.length < 2) {
      onComplete?.()
      return
    }

    // Inverser le chemin pour aller de l'extérieur vers le centre
    const reversedPath = [...path].reverse()
    const startTime = performance.now()

    // Configuration du style Tron
    this.context.save()
    this.context.lineCap = 'round'
    this.context.lineJoin = 'round'
    
    const animateFrame = (currentTime: number) => {
      const elapsedTime = currentTime - startTime
      const progress = Math.min(elapsedTime / durationMs, 1.0)

      // Dessiner le chemin avec le progrès actuel
      const endPoint = reversedPath[reversedPath.length - 1]
      let hasEndCircle = true
      if (pathIndex !== undefined && allPaths) {
        hasEndCircle = !this.isEndPointOnIntersection(pathIndex, endPoint, allPaths)
      }
      this.drawTronPathPartial(reversedPath, progress, lineWidth, true, hasEndCircle)

      if (progress < 1.0) {
        requestAnimationFrame(animateFrame)
      } else {
        this.context.restore()
        onComplete?.()
      }
    }

    requestAnimationFrame(animateFrame)
  }

  /**
   * Vérifie si un point final de chemin intersecte avec un autre chemin existant
   */
  private isEndPointOnIntersection(pathIndex: number, endPoint: Point, allPaths: RandomPath[]): boolean {
    // Vérifier contre tous les autres chemins
    for (let i = 0; i < allPaths.length; i++) {
      if (i === pathIndex) continue // Ignorer le chemin lui-même
      
      const otherPath = allPaths[i].path
      if (!otherPath || otherPath.length < 2) continue
      
      // Vérifier si le point final intersecte avec un point du milieu de l'autre chemin
      // (exclure le premier et dernier point de l'autre chemin)
      for (let j = 1; j < otherPath.length - 1; j++) {
        const otherPoint = otherPath[j]
        if (Math.abs(endPoint.x - otherPoint.x) < 1 && Math.abs(endPoint.y - otherPoint.y) < 1) {
          return true // Intersection détectée
        }
      }
    }
    return false
  }
} 