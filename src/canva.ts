type Point = { x: number; y: number }
type DeadZone = { basePoint: Point; deadZoneWidth: number; deadZoneHeight: number }

export default class CanvasManager {

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
  }

  private getSizeMultiples(canvasSize: number): number[] {
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

  private verifyGridSize(gridSize: number, dimension: 'width' | 'height'): number {
    const canvasSize = dimension === 'width' ? this.width : this.height
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

  public drawLine(startX: number, startY: number, endX: number, endY: number, strokeStyle?: string, lineWidth?: number): void {
    this.context.beginPath()
    this.context.moveTo(startX, startY)
    this.context.lineTo(endX, endY)
    this.context.strokeStyle = strokeStyle || 'white'
    this.context.lineWidth = lineWidth || 1
    this.context.stroke()
    this.context.closePath()
  }

  public drawCircle(coordX: number, coordY: number, radius: number, fillStyle?: string): void {
    this.context.fillStyle = fillStyle || 'white'
    this.context.beginPath()
    this.context.arc(coordX, coordY, radius, 0, 2 * Math.PI)
    this.context.fill()
    this.context.closePath()
  }

  public drawRectangle(coordX: number, coordY: number, width: number, height: number, fillStyle?: string): void {
    this.context.fillStyle = fillStyle || 'white'
    this.context.beginPath()
    this.context.rect(coordX, coordY, width, height)
    this.context.fill()
    this.context.closePath()
  }

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

  public initGrid(gridSizeWidth: number, gridSizeHeight: number, deadZoneWidth?: number, deadZoneHeight?: number, basePoint?: Point): {gridSizeWidth: number, gridSizeHeight: number, gridPoints: Point[], deadZone?: DeadZone} {
    gridSizeWidth = this.verifyGridSize(gridSizeWidth, 'width')
    gridSizeHeight = this.verifyGridSize(gridSizeHeight, 'height')
    
    const deadZone = (deadZoneWidth && deadZoneHeight && basePoint) 
      ? { basePoint: { ...basePoint }, deadZoneWidth, deadZoneHeight }
      : undefined
    
    const pointsSet = new Set<string>()
    const addPoint = (x: number, y: number) => {
      if (x <= this.width && y <= this.height) {
        pointsSet.add(`${x},${y}`)
      }
    }
    
    const cols = Math.floor(this.width / gridSizeWidth) + 1
    const rows = Math.floor(this.height / gridSizeHeight) + 1
    
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = col * gridSizeWidth
        const y = row * gridSizeHeight
        
        if (!deadZone || !this.isPointInDeadZone(x, y, deadZone)) {
          addPoint(x, y)
        }
      }
    }
    
    if (deadZone) {
      this.addDeadZoneBorderPoints(deadZone, gridSizeWidth, gridSizeHeight, addPoint)
    }
    
    const gridPoints = Array.from(pointsSet).map(pointStr => {
      const [x, y] = pointStr.split(',').map(Number)
      return { x, y }
    })
    
    return { gridSizeWidth, gridSizeHeight, gridPoints, deadZone }
  }

  private isPointInDeadZone(x: number, y: number, deadZone: DeadZone): boolean {
    const halfWidth = deadZone.deadZoneWidth / 2
    const halfHeight = deadZone.deadZoneHeight / 2
    
    return x >= deadZone.basePoint.x - halfWidth && 
           x <= deadZone.basePoint.x + halfWidth &&
           y >= deadZone.basePoint.y - halfHeight && 
           y <= deadZone.basePoint.y + halfHeight
  }

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

  public drawGrid(gridPoints: Point[], gridSizeWidth: number, gridSizeHeight: number, deadZone?: DeadZone): void {
    gridPoints.forEach(point => {
      this.drawCircle(point.x, point.y, 3, 'yellow')
    })
    
    for (let row = 0; row <= this.height / gridSizeHeight; row++) {
      const y = row * gridSizeHeight

      if (deadZone) {
        this.drawGridLineWithDeadZone(0, y, this.width, y, deadZone, 'horizontal')
      } else {
        this.drawLine(0, y, this.width, y, 'white', 1)
      }
    }
    
    for (let col = 0; col <= this.width / gridSizeWidth; col++) {
      const x = col * gridSizeWidth
      if (deadZone) {
        this.drawGridLineWithDeadZone(x, 0, x, this.height, deadZone, 'vertical')
      } else {
        this.drawLine(x, 0, x, this.height, 'white', 1)
      }
    }
    
    if (deadZone) {
      this.drawDeadZoneBoundary(deadZone, gridSizeWidth, gridSizeHeight)
    }
  }

  private drawGridLineWithDeadZone(startX: number, startY: number, endX: number, endY: number, deadZone: DeadZone, direction: 'horizontal' | 'vertical'): void {
    const halfWidth = deadZone.deadZoneWidth / 2
    const halfHeight = deadZone.deadZoneHeight / 2
    const dzLeft = deadZone.basePoint.x - halfWidth
    const dzRight = deadZone.basePoint.x + halfWidth
    const dzTop = deadZone.basePoint.y - halfHeight
    const dzBottom = deadZone.basePoint.y + halfHeight
    
    if (direction === 'horizontal') {
      if (startY >= dzTop && startY <= dzBottom) {
        if (startX < dzLeft) {
          this.drawLine(startX, startY, dzLeft, startY, 'white', 1)
        }
        if (endX > dzRight) {
          this.drawLine(dzRight, startY, endX, startY, 'white', 1)
        }
      } else {
        this.drawLine(startX, startY, endX, startY, 'white', 1)
      }
    } else {
      if (startX >= dzLeft && startX <= dzRight) {
        if (startY < dzTop) {
          this.drawLine(startX, startY, startX, dzTop, 'white', 1)
        }
        if (endY > dzBottom) {
          this.drawLine(startX, dzBottom, startX, endY, 'white', 1)
        }
      } else {
        this.drawLine(startX, startY, startX, endY, 'white', 1)
      }
    }
  }

  private drawDeadZoneBoundary(deadZone: DeadZone, gridSizeWidth: number, gridSizeHeight: number): void {
    const halfWidth = deadZone.deadZoneWidth / 2
    const halfHeight = deadZone.deadZoneHeight / 2
    const left = deadZone.basePoint.x - halfWidth
    const right = deadZone.basePoint.x + halfWidth
    const top = deadZone.basePoint.y - halfHeight
    const bottom = deadZone.basePoint.y + halfHeight
    
    this.drawLine(left, top, right, top, 'red', 2)
    this.drawLine(right, top, right, bottom, 'red', 2)
    this.drawLine(right, bottom, left, bottom, 'red', 2)
    this.drawLine(left, bottom, left, top, 'red', 2)
    
    for (let x = Math.ceil(left / gridSizeWidth) * gridSizeWidth; x <= right; x += gridSizeWidth) {
      if (x >= left && x <= right) {
        this.drawCircle(x, top, 4, 'red')
        this.drawCircle(x, bottom, 4, 'red')
      }
    }
    
    for (let y = Math.ceil(top / gridSizeHeight) * gridSizeHeight; y <= bottom; y += gridSizeHeight) {
      if (y >= top && y <= bottom) {
        this.drawCircle(left, y, 4, 'red')
        this.drawCircle(right, y, 4, 'red')
      }
    }
  }

  // Getters and setters
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
  }

  public getHeight(): number {
    return this.height
  }

  public setHeight(height: number): void {
    this.height = height
  }  

  // A* Pathfinding Algorithm Implementation
  public aStar(debut: Point, objectif: Point, gridPoints: Point[], gridSizeWidth: number, gridSizeHeight: number, deadZone?: DeadZone): Point[] | null {
    // Initialisation
    const listeOuverte: Point[] = [debut]
    const listeFermee: Point[] = []
    
    const gScore = new Map<string, number>()
    const fScore = new Map<string, number>()
    const parent = new Map<string, Point | null>()
    
    const pointKey = (point: Point): string => `${point.x},${point.y}`
    
    gScore.set(pointKey(debut), 0)
    fScore.set(pointKey(debut), this.heuristique(debut, objectif))
    parent.set(pointKey(debut), null)
    
    while (listeOuverte.length > 0) {
      // Sélectionner le nœud avec le plus petit f_score
      let noeudCourant = listeOuverte[0]
      let indexCourant = 0
      
      for (let i = 1; i < listeOuverte.length; i++) {
        const currentFScore = fScore.get(pointKey(listeOuverte[i])) || Infinity
        const bestFScore = fScore.get(pointKey(noeudCourant)) || Infinity
        
        if (currentFScore < bestFScore) {
          noeudCourant = listeOuverte[i]
          indexCourant = i
        }
      }
      
      // Si on a atteint l'objectif
      if (noeudCourant.x === objectif.x && noeudCourant.y === objectif.y) {
        return this.reconstruireChemin(parent, objectif)
      }
      
      // Déplacer le nœud courant vers la liste fermée
      listeOuverte.splice(indexCourant, 1)
      listeFermee.push(noeudCourant)
      
      // Examiner tous les voisins
      const voisins = this.getVoisins(noeudCourant, gridPoints, gridSizeWidth, gridSizeHeight)
      
      for (const voisin of voisins) {
        const voisinKey = pointKey(voisin)
        
        // Si le voisin est dans la liste fermée, continuer
        if (listeFermee.some(p => p.x === voisin.x && p.y === voisin.y)) {
          continue
        }
        
        // Si le voisin est dans une zone morte, continuer
        if (deadZone && this.isPointInDeadZone(voisin.x, voisin.y, deadZone)) {
          continue
        }
        
        const gScoreTentative = (gScore.get(pointKey(noeudCourant)) || 0) + this.distance(noeudCourant, voisin)
        
        const voisinDansListeOuverte = listeOuverte.some(p => p.x === voisin.x && p.y === voisin.y)
        
        if (!voisinDansListeOuverte) {
          listeOuverte.push(voisin)
        } else if (gScoreTentative >= (gScore.get(voisinKey) || Infinity)) {
          continue
        }
        
        // Ce chemin vers le voisin est le meilleur jusqu'à présent
        parent.set(voisinKey, noeudCourant)
        gScore.set(voisinKey, gScoreTentative)
        fScore.set(voisinKey, gScoreTentative + this.heuristique(voisin, objectif))
      }
    }
    
    // Aucun chemin trouvé
    return null
  }

  private reconstruireChemin(parent: Map<string, Point | null>, noeud: Point): Point[] {
    const pointKey = (point: Point): string => `${point.x},${point.y}`
    const chemin: Point[] = [noeud]
    let noeudCourant = noeud
    
    while (parent.get(pointKey(noeudCourant)) !== null) {
      const parentNoeud = parent.get(pointKey(noeudCourant))
      if (parentNoeud) {
        noeudCourant = parentNoeud
        chemin.unshift(noeudCourant)
      } else {
        break
      }
    }
    
    return chemin
  }

  private heuristique(point1: Point, point2: Point): number {
    // Distance de Manhattan (plus adaptée pour une grille)
    return Math.abs(point1.x - point2.x) + Math.abs(point1.y - point2.y)
  }

  private distance(point1: Point, point2: Point): number {
    // Distance euclidienne
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2))
  }

  private getVoisins(point: Point, gridPoints: Point[], gridSizeWidth: number, gridSizeHeight: number): Point[] {
    const voisins: Point[] = []
    
    // Les 8 directions possibles (incluant les diagonales)
    const directions = [
      { x: 0, y: -gridSizeHeight },   // Haut
      { x: gridSizeWidth, y: 0 },     // Droite
      { x: 0, y: gridSizeHeight },    // Bas
      { x: -gridSizeWidth, y: 0 },    // Gauche
      { x: gridSizeWidth, y: -gridSizeHeight },   // Haut-Droite
      { x: gridSizeWidth, y: gridSizeHeight },    // Bas-Droite
      { x: -gridSizeWidth, y: gridSizeHeight },   // Bas-Gauche
      { x: -gridSizeWidth, y: -gridSizeHeight }   // Haut-Gauche
    ]
    
    for (const direction of directions) {
      const voisinX = point.x + direction.x
      const voisinY = point.y + direction.y
      
      // Vérifier si le voisin existe dans les points de grille
      const voisinExiste = gridPoints.some(p => p.x === voisinX && p.y === voisinY)
      
      if (voisinExiste) {
        voisins.push({ x: voisinX, y: voisinY })
      }
    }
    
    return voisins
  }

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
    
    // Marquer le point de départ et d'arrivée
    this.drawCircle(chemin[0].x, chemin[0].y, 6, 'blue')
    this.drawCircle(chemin[chemin.length - 1].x, chemin[chemin.length - 1].y, 6, 'red')
  }
  
}