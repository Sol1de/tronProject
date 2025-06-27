type Point = { x: number; y: number }
type DeadZone = { basePoint: Point; deadZoneWidth: number; deadZoneHeight: number }

export default class CanvasManager {
  private gridPoints: Point[] = []
  private gridSizeWidth: number = 0
  private gridSizeHeight: number = 0
  private deadZone?: DeadZone
  private startPoint: Point | null = null
  private endPoint: Point | null = null

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
    this.gridSizeWidth = this.verifyGridSize(gridSizeWidth, 'width')
    this.gridSizeHeight = this.verifyGridSize(gridSizeHeight, 'height')
    
    this.deadZone = (deadZoneWidth && deadZoneHeight && basePoint) 
      ? { basePoint: { ...basePoint }, deadZoneWidth, deadZoneHeight }
      : undefined
    
    const pointsSet = new Set<string>()
    const addPoint = (x: number, y: number) => {
      if (x <= this.width && y <= this.height) {
        pointsSet.add(`${x},${y}`)
      }
    }
    
    const cols = Math.floor(this.width / this.gridSizeWidth) + 1
    const rows = Math.floor(this.height / this.gridSizeHeight) + 1
    
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
    
    this.gridPoints = Array.from(pointsSet).map(pointStr => {
      const [x, y] = pointStr.split(',').map(Number)
      return { x, y }
    })
    
    return { gridSizeWidth: this.gridSizeWidth, gridSizeHeight: this.gridSizeHeight, gridPoints: this.gridPoints, deadZone: this.deadZone }
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

  public aStar(debut: Point, objectif: Point): Point[] | null {
    const openSet: Point[] = [debut]
    const closedSet = new Set<string>()
    const gScore = new Map<string, number>()
    const fScore = new Map<string, number>()
    const parent = new Map<string, Point>()
    
    const key = (p: Point): string => `${p.x},${p.y}`
    const h = (p1: Point, p2: Point): number => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y)
    
    gScore.set(key(debut), 0)
    fScore.set(key(debut), h(debut, objectif))
    
    while (openSet.length > 0) {
      // Find node with lowest f_score
      const current = openSet.reduce((best, node) => 
        (fScore.get(key(node)) || Infinity) < (fScore.get(key(best)) || Infinity) ? node : best
      )
      
      if (current.x === objectif.x && current.y === objectif.y) {
        return this.reconstructPath(parent, current)
      }
      
      openSet.splice(openSet.indexOf(current), 1)
      closedSet.add(key(current))
      
      for (const neighbor of this.getNeighbors(current)) {
        const neighborKey = key(neighbor)
        
        if (closedSet.has(neighborKey) || (this.deadZone && this.isPointInDeadZone(neighbor.x, neighbor.y, this.deadZone))) {
          continue
        }
        
        const tentativeG = (gScore.get(key(current)) || 0) + this.distance(current, neighbor)
        
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

  private reconstructPath(parent: Map<string, Point>, current: Point): Point[] {
    const path = [current]
    const key = (p: Point): string => `${p.x},${p.y}`
    
    while (parent.has(key(current))) {
      current = parent.get(key(current))!
      path.unshift(current)
    }
    
    return path
  }

  private distance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
  }

  private getNeighbors(point: Point): Point[] {
    // Créer une liste combinée incluant les points de bordure de deadZone
    const allValidPoints = [...this.gridPoints]
    if (this.deadZone) {
      const deadZoneBorderPoints = this.getDeadZoneBorderPoints(this.deadZone)
      for (const borderPoint of deadZoneBorderPoints) {
        const exists = allValidPoints.some(p => p.x === borderPoint.x && p.y === borderPoint.y)
        if (!exists) {
          allValidPoints.push(borderPoint)
        }
      }
    }
    
    // Essayer d'abord la méthode classique (directions fixes)
    const directions = [
      [0, -this.gridSizeHeight], [this.gridSizeWidth, 0], [0, this.gridSizeHeight], [-this.gridSizeWidth, 0],
      [this.gridSizeWidth, -this.gridSizeHeight], [this.gridSizeWidth, this.gridSizeHeight], 
      [-this.gridSizeWidth, this.gridSizeHeight], [-this.gridSizeWidth, -this.gridSizeHeight]
    ]
    
    const classicNeighbors = directions
      .map(([dx, dy]) => ({ x: point.x + dx, y: point.y + dy }))
      .filter(neighbor => 
        allValidPoints.some(p => p.x === neighbor.x && p.y === neighbor.y) &&
        (!this.deadZone || !this.isPointInDeadZone(neighbor.x, neighbor.y, this.deadZone))
      )
    
    // Si la méthode classique trouve des voisins, l'utiliser
    if (classicNeighbors.length > 0) {
      console.log(`Voisins trouvés (méthode classique) pour (${point.x}, ${point.y}):`, classicNeighbors)
      return classicNeighbors
    }
    
    // Sinon, utiliser la méthode flexible pour les points problématiques
    console.log(`Méthode classique échouée pour (${point.x}, ${point.y}), utilisation de la méthode flexible`)
    
    const flexibleNeighbors = allValidPoints.filter(candidate => {
      if (candidate.x === point.x && candidate.y === point.y) return false
      
      // Calculer la distance
      const dx = Math.abs(candidate.x - point.x)
      const dy = Math.abs(candidate.y - point.y)
      
      // Accepter les connexions dans un rayon raisonnable
      const maxDistance = Math.max(this.gridSizeWidth, this.gridSizeHeight) * 1.5
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      const isReasonableDistance = distance <= maxDistance && distance > 0
      const isValid = isReasonableDistance &&
        (!this.deadZone || !this.isPointInDeadZone(candidate.x, candidate.y, this.deadZone))
      
      return isValid
    })
    
    console.log(`Voisins trouvés (méthode flexible) pour (${point.x}, ${point.y}):`, flexibleNeighbors)
    return flexibleNeighbors
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

  // Interactive Pathfinding Methods
  public setupInteractivePathfinding(): void {
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this))
    this.setupButtons()
    this.redraw()
    this.showDemo()
  }

  private handleCanvasClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const nearestPoint = this.findNearestGridPoint(x, y)
    
    if (nearestPoint) {
      if (!this.startPoint) {
        this.startPoint = nearestPoint
        this.redraw()
        this.drawCircle(this.startPoint.x, this.startPoint.y, 8, 'blue')
        console.log('Point de départ:', this.startPoint)
      } else if (!this.endPoint) {
        this.endPoint = nearestPoint
        this.redraw()
        this.drawCircle(this.startPoint.x, this.startPoint.y, 8, 'blue')
        this.drawCircle(this.endPoint.x, this.endPoint.y, 8, 'red')
        
        const path = this.aStar(this.startPoint, this.endPoint)
        if (path) {
          console.log('Chemin trouvé:', path)
          this.drawPath(path)
        } else {
          console.log('Aucun chemin trouvé!')
          alert('Aucun chemin trouvé!')
        }
      } else {
        this.startPoint = nearestPoint
        this.endPoint = null
        this.redraw()
        this.drawCircle(this.startPoint.x, this.startPoint.y, 8, 'blue')
        console.log('Nouveau départ:', this.startPoint)
      }
    }
  }

  private findNearestGridPoint(x: number, y: number): Point | null {
    // Créer une liste combinée de tous les points disponibles
    const availablePoints = [...this.gridPoints]
    
    // Si une deadZone existe, ajouter les points de bordure qui ne sont pas déjà dans gridPoints
    if (this.deadZone) {
      const deadZoneBorderPoints = this.getDeadZoneBorderPoints(this.deadZone)
      console.log('Points de bordure deadZone générés:', deadZoneBorderPoints)
      
      for (const borderPoint of deadZoneBorderPoints) {
        const exists = this.gridPoints.some(p => p.x === borderPoint.x && p.y === borderPoint.y)
        if (!exists) {
          availablePoints.push(borderPoint)
          console.log('Point de bordure ajouté:', borderPoint)
        }
      }
    }

    // Chercher le point le plus proche dans la liste combinée
    const result = availablePoints.reduce((nearest: Point | null, point) => {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
      if (distance < 25 && (!nearest || distance < Math.sqrt((x - nearest.x) ** 2 + (y - nearest.y) ** 2))) {
        return point
      }
      return nearest
    }, null)
    
    if (result) {
      console.log('Point le plus proche trouvé:', result)
    }
    
    return result
  }

  private getDeadZoneBorderPoints(deadZone: DeadZone): Point[] {
    const points: Point[] = []
    const halfWidth = deadZone.deadZoneWidth / 2
    const halfHeight = deadZone.deadZoneHeight / 2
    const bounds = {
      left: deadZone.basePoint.x - halfWidth,
      right: deadZone.basePoint.x + halfWidth,
      top: deadZone.basePoint.y - halfHeight,
      bottom: deadZone.basePoint.y + halfHeight
    }

    // Points sur les bordures horizontales (haut/bas) - alignés sur la grille
    for (let x = Math.ceil(bounds.left / this.gridSizeWidth) * this.gridSizeWidth; x <= bounds.right; x += this.gridSizeWidth) {
      if (x >= bounds.left && x <= bounds.right && x >= 0 && x <= this.width) {
        if (bounds.top >= 0 && bounds.top <= this.height) {
          points.push({ x, y: bounds.top })
        }
        if (bounds.bottom >= 0 && bounds.bottom <= this.height) {
          points.push({ x, y: bounds.bottom })
        }
      }
    }

    // Points sur les bordures verticales (gauche/droite) - alignés sur la grille
    for (let y = Math.ceil(bounds.top / this.gridSizeHeight) * this.gridSizeHeight; y <= bounds.bottom; y += this.gridSizeHeight) {
      if (y >= bounds.top && y <= bounds.bottom && y >= 0 && y <= this.height) {
        if (bounds.left >= 0 && bounds.left <= this.width) {
          points.push({ x: bounds.left, y })
        }
        if (bounds.right >= 0 && bounds.right <= this.width) {
          points.push({ x: bounds.right, y })
        }
      }
    }

    // Ajouter les coins exacts de la deadZone (seulement s'ils sont dans les limites du canvas)
    const corners = [
      { x: bounds.left, y: bounds.top },
      { x: bounds.right, y: bounds.top },
      { x: bounds.left, y: bounds.bottom },
      { x: bounds.right, y: bounds.bottom }
    ]
    
    corners.forEach(corner => {
      if (corner.x >= 0 && corner.x <= this.width && corner.y >= 0 && corner.y <= this.height) {
        points.push(corner)
      }
    })

    // Filtrer les doublons
    const uniquePoints = new Map<string, Point>()
    points.forEach(point => {
      const key = `${point.x},${point.y}`
      if (!uniquePoints.has(key)) {
        uniquePoints.set(key, point)
      }
    })

    const result = Array.from(uniquePoints.values())
    console.log('Points de bordure deadZone calculés:', result)
    return result
  }

  private setupButtons(): void {
    document.getElementById('resetBtn')?.addEventListener('click', () => {
      this.startPoint = null
      this.endPoint = null
      this.redraw()
      console.log('Reset')
    })

    document.getElementById('randomPathBtn')?.addEventListener('click', () => {
      if (this.gridPoints.length < 2) return
      
      const randomStart = this.gridPoints[Math.floor(Math.random() * this.gridPoints.length)]
      const randomEnd = this.gridPoints[Math.floor(Math.random() * this.gridPoints.length)]
      
      if (randomStart !== randomEnd) {
        this.startPoint = randomStart
        this.endPoint = randomEnd
        this.redraw()
        
        this.drawCircle(this.startPoint.x, this.startPoint.y, 8, 'blue')
        this.drawCircle(this.endPoint.x, this.endPoint.y, 8, 'red')
        
        const path = this.aStar(this.startPoint, this.endPoint)
        if (path) {
          console.log('Chemin aléatoire:', path)
          this.drawPath(path)
        }
      }
    })

    document.getElementById('clearPathBtn')?.addEventListener('click', () => {
      this.redraw()
      if (this.startPoint) this.drawCircle(this.startPoint.x, this.startPoint.y, 8, 'blue')
      if (this.endPoint) this.drawCircle(this.endPoint.x, this.endPoint.y, 8, 'red')
    })
  }

  private redraw(): void {
    this.context.clearRect(0, 0, this.width, this.height)
    this.drawGrid(this.gridPoints, this.gridSizeWidth, this.gridSizeHeight, this.deadZone)
  }

  private showDemo(): void {
    setTimeout(() => {
      const demo = this.aStar({ x: 0, y: 0 }, { x: 500, y: 500 })
      if (demo) {
        console.log('Démo A*:', demo)
        this.drawPath(demo, 'purple', 2)
        this.drawCircle(0, 0, 6, 'purple')
        this.drawCircle(500, 500, 6, 'purple')
      }
    }, 500)
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
  
}