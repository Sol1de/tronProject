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
} 