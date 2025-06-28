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
    randomPaths.forEach((randomPath, index) => {
      if (randomPath.path) {
        const colors = ['orange', 'cyan', 'magenta', 'lime', 'yellow', 'pink', 'lightblue', 'lightgreen']
        const color = colors[index % colors.length]
        this.drawPath(randomPath.path, color, lineWidth)
        
        // Ajouter un numéro au milieu du chemin
        const midPoint = randomPath.path[Math.floor(randomPath.path.length / 2)]
        this.drawText(`${index + 1}`, midPoint.x + 10, midPoint.y - 10, 'white', '12px Arial')
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
   * Dessine plusieurs chemins avec un style Tron bleu néon
   */
  public drawTronPaths(randomPaths: RandomPath[], lineWidth: number = 2): void {
    // Sauvegarder l'état actuel du contexte
    this.context.save()
    
    // Configuration du style Tron
    this.context.lineCap = 'round'
    this.context.lineJoin = 'round'
    
    randomPaths.forEach((randomPath, index) => {
      if (randomPath.path) {
        this.drawTronPath(randomPath.path, lineWidth, index)
      }
    })
    
    // Restaurer l'état du contexte
    this.context.restore()
  }

  /**
   * Dessine un chemin unique avec le style Tron bleu néon
   */
  private drawTronPath(path: Point[], lineWidth: number = 2, pathIndex: number = 0): void {
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
    
    // Numéro du chemin (sans les cercles de points)
    const midPoint = path[Math.floor(path.length / 2)]
    this.drawTronText(`${pathIndex + 1}`, midPoint.x + 12, midPoint.y - 12)
  }

  /**
   * Dessine du texte avec style Tron
   */
  private drawTronText(text: string, x: number, y: number): void {
    this.context.save()
    
    // Configuration du texte Tron
    this.context.font = 'bold 12px monospace'
    this.context.textAlign = 'center'
    this.context.textBaseline = 'middle'
    
    // Effet de lueur sur le texte
    this.context.strokeStyle = '#00FFFF'
    this.context.lineWidth = 2
    this.context.globalAlpha = 0.3
    this.context.shadowBlur = 8
    this.context.shadowColor = '#00FFFF'
    this.context.strokeText(text, x, y)
    
    // Texte principal
    this.context.fillStyle = '#FFFFFF'
    this.context.globalAlpha = 1.0
    this.context.shadowBlur = 4
    this.context.shadowColor = '#00FFFF'
    this.context.fillText(text, x, y)
    
    this.context.restore()
  }

  /**
   * Anime les chemins Tron de manière progressive (de l'extérieur vers le centre)
   */
  public animateTronPaths(
    randomPaths: RandomPath[], 
    lineWidth: number = 2,
    animationSpeed: number = 50, // millisecondes entre chaque segment
    onComplete?: () => void
  ): void {
    if (randomPaths.length === 0) {
      onComplete?.()
      return
    }

    // État d'animation pour chaque chemin (avec direction inversée)
    const animationStates = randomPaths.map(randomPath => ({
      path: randomPath.path ? [...randomPath.path].reverse() : [], // INVERSION ICI
      currentSegment: 0,
      isComplete: false,
      pathIndex: randomPaths.indexOf(randomPath)
    }))

    // Fonction d'animation récursive
    const animateFrame = () => {
      // Effacer et redessiner la grille si nécessaire
      // (on suppose que cette méthode sera appelée après avoir effacé le canvas)
      
      let allComplete = true
      
      // Dessiner tous les segments animés jusqu'à présent
      this.context.save()
      this.context.lineCap = 'round'
      this.context.lineJoin = 'round'
      
      animationStates.forEach(state => {
        if (state.path.length < 2) return
        
        // Dessiner les segments jusqu'au segment actuel
        if (state.currentSegment > 0) {
          const segmentsToShow = Math.min(state.currentSegment, state.path.length - 1)
          const pathSegment = state.path.slice(0, segmentsToShow + 1)
          
          if (pathSegment.length >= 2) {
            this.drawTronPath(pathSegment, lineWidth, state.pathIndex)
          }
        }
        
        // Vérifier si ce chemin est terminé
        if (state.currentSegment >= state.path.length - 1) {
          state.isComplete = true
        } else {
          allComplete = false
          state.currentSegment++
        }
      })
      
      this.context.restore()
      
      // Continuer l'animation si pas terminée
      if (!allComplete) {
        setTimeout(() => {
          requestAnimationFrame(animateFrame)
        }, animationSpeed)
      } else {
        onComplete?.()
      }
    }
    
    // Démarrer l'animation
    requestAnimationFrame(animateFrame)
  }

  /**
   * Anime un seul chemin Tron de manière progressive (de l'extérieur vers le centre)
   */
  public animateTronPath(
    path: Point[], 
    pathIndex: number = 0,
    lineWidth: number = 2,
    animationSpeed: number = 50,
    onComplete?: () => void
  ): void {
    if (path.length < 2) {
      onComplete?.()
      return
    }

    // Inverser le chemin pour aller de l'extérieur vers le centre
    const reversedPath = [...path].reverse()
    let currentSegment = 0
    
    const animateSegment = () => {
      if (currentSegment >= reversedPath.length - 1) {
        onComplete?.()
        return
      }
      
      // Dessiner le segment jusqu'au point actuel
      const pathSegment = reversedPath.slice(0, currentSegment + 2)
      this.drawTronPath(pathSegment, lineWidth, pathIndex)
      
      currentSegment++
      
      setTimeout(() => {
        requestAnimationFrame(animateSegment)
      }, animationSpeed)
    }
    
    requestAnimationFrame(animateSegment)
  }
} 