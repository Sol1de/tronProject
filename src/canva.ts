type Point = { x: number; y: number }
type DeadZone = { basePoint: Point; deadZoneWidth: number; deadZoneHeight: number }
type PathPoint = Point & { isUsed: boolean }
type RandomPath = {
  startPath: Point;
  endPath: Point;
  path?: Point[];
}

export default class CanvasManager {
  private gridPoints: Point[] = []
  private gridSizeWidth: number = 0
  private gridSizeHeight: number = 0
  private deadZone?: DeadZone
  private startPoint: Point | null = null
  private endPoint: Point | null = null
  private randomPaths: RandomPath[] = []

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
    const allValidPoints = [...this.gridPoints]
    if (this.deadZone) {
      const deadZoneBorderPoints = this.getDeadzoneBorderPoints()
      for (const borderPoint of deadZoneBorderPoints) {
        const exists = allValidPoints.some(p => p.x === borderPoint.x && p.y === borderPoint.y)
        if (!exists) {
          allValidPoints.push(borderPoint)
        }
      }
    }
    
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
    
    if (classicNeighbors.length > 0) {
      return classicNeighbors
    }
    
    const flexibleNeighbors = allValidPoints.filter(candidate => {
      if (candidate.x === point.x && candidate.y === point.y) return false
      
      const dx = Math.abs(candidate.x - point.x)
      const dy = Math.abs(candidate.y - point.y)
      
      const maxDistance = Math.max(this.gridSizeWidth, this.gridSizeHeight) * 1.5
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      const isReasonableDistance = distance <= maxDistance && distance > 0
      const isValid = isReasonableDistance &&
        (!this.deadZone || !this.isPointInDeadZone(candidate.x, candidate.y, this.deadZone))
      
      return isValid
    })
    
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
    
    this.drawCircle(chemin[0].x, chemin[0].y, 6, 'blue')
    this.drawCircle(chemin[chemin.length - 1].x, chemin[chemin.length - 1].y, 6, 'red')
  }

  public setupInteractivePathfinding(): void {
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this))
    this.setupButtons()
    this.redraw()
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
      } else if (!this.endPoint) {
        this.endPoint = nearestPoint
        this.redraw()
        this.drawCircle(this.startPoint.x, this.startPoint.y, 8, 'blue')
        this.drawCircle(this.endPoint.x, this.endPoint.y, 8, 'red')
        
        const path = this.aStar(this.startPoint, this.endPoint)
        if (path) {
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
      }
    }
  }

  private findNearestGridPoint(x: number, y: number): Point | null {
    const availablePoints = [...this.gridPoints]
    
    if (this.deadZone) {
      const deadZoneBorderPoints = this.getDeadzoneBorderPoints()
      
      for (const borderPoint of deadZoneBorderPoints) {
        const exists = this.gridPoints.some(p => p.x === borderPoint.x && p.y === borderPoint.y)
        if (!exists) {
          availablePoints.push(borderPoint)
        }
      }
    }

    return availablePoints.reduce((nearest: Point | null, point) => {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2)
      if (distance < 25 && (!nearest || distance < Math.sqrt((x - nearest.x) ** 2 + (y - nearest.y) ** 2))) {
        return point
      }
      return nearest
    }, null)
  }

  /**
   * Retourne tous les points composant la bordure de la deadzone
   */
  public getDeadzoneBorderPoints(): PathPoint[] {
    if (!this.deadZone) return []
    
    const points: PathPoint[] = []
    const halfWidth = this.deadZone.deadZoneWidth / 2
    const halfHeight = this.deadZone.deadZoneHeight / 2
    const bounds = {
      left: this.deadZone.basePoint.x - halfWidth,
      right: this.deadZone.basePoint.x + halfWidth,
      top: this.deadZone.basePoint.y - halfHeight,
      bottom: this.deadZone.basePoint.y + halfHeight
    }

    // Points sur les bordures horizontales (haut et bas)
    for (let x = Math.ceil(bounds.left / this.gridSizeWidth) * this.gridSizeWidth; x <= bounds.right; x += this.gridSizeWidth) {
      if (x >= bounds.left && x <= bounds.right && x >= 0 && x <= this.width) {
        if (bounds.top >= 0 && bounds.top <= this.height) {
          points.push({ x, y: bounds.top, isUsed: false })
        }
        if (bounds.bottom >= 0 && bounds.bottom <= this.height) {
          points.push({ x, y: bounds.bottom, isUsed: false })
        }
      }
    }

    // Points sur les bordures verticales (gauche et droite)
    for (let y = Math.ceil(bounds.top / this.gridSizeHeight) * this.gridSizeHeight; y <= bounds.bottom; y += this.gridSizeHeight) {
      if (y >= bounds.top && y <= bounds.bottom && y >= 0 && y <= this.height) {
        if (bounds.left >= 0 && bounds.left <= this.width) {
          points.push({ x: bounds.left, y, isUsed: false })
        }
        if (bounds.right >= 0 && bounds.right <= this.width) {
          points.push({ x: bounds.right, y, isUsed: false })
        }
      }
    }

    // Suppression des doublons
    const uniquePoints = new Map<string, PathPoint>()
    points.forEach(point => {
      const key = `${point.x},${point.y}`
      if (!uniquePoints.has(key)) {
        uniquePoints.set(key, point)
      }
    })

    return Array.from(uniquePoints.values())
  }

  /**
   * Retourne tous les points composant la bordure du canevas
   */
  public getCanvasBorderPoints(): PathPoint[] {
    const points: PathPoint[] = []
    
    // Points sur la bordure gauche (x = 0)
    for (let y = 0; y <= this.height; y += this.gridSizeHeight) {
      if (!this.deadZone || !this.isPointInDeadZone(0, y, this.deadZone)) {
        points.push({ x: 0, y, isUsed: false })
      }
    }
    
    // Points sur la bordure droite (x = width)
    for (let y = 0; y <= this.height; y += this.gridSizeHeight) {
      if (!this.deadZone || !this.isPointInDeadZone(this.width, y, this.deadZone)) {
        points.push({ x: this.width, y, isUsed: false })
      }
    }
    
    // Points sur la bordure haut (y = 0)
    for (let x = 0; x <= this.width; x += this.gridSizeWidth) {
      if (!this.deadZone || !this.isPointInDeadZone(x, 0, this.deadZone)) {
        points.push({ x, y: 0, isUsed: false })
      }
    }
    
    // Points sur la bordure bas (y = height)
    for (let x = 0; x <= this.width; x += this.gridSizeWidth) {
      if (!this.deadZone || !this.isPointInDeadZone(x, this.height, this.deadZone)) {
        points.push({ x, y: this.height, isUsed: false })
      }
    }
    
    // Suppression des doublons
    const uniquePoints = new Map<string, PathPoint>()
    points.forEach(point => {
      const key = `${point.x},${point.y}`
      if (!uniquePoints.has(key)) {
        uniquePoints.set(key, point)
      }
    })

    return Array.from(uniquePoints.values())
  }

  /**
   * Vérifie si deux points sont identiques
   */
  private arePointsEqual(p1: Point, p2: Point): boolean {
    return p1.x === p2.x && p1.y === p2.y
  }

  /**
   * Calcule la distance entre deux points
   */
  private getPointDistance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
  }

  /**
   * Vérifie si un point est sur un segment de ligne
   */
  private isPointOnSegment(point: Point, segStart: Point, segEnd: Point): boolean {
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
  private doLinesIntersectOrTouch(line1Start: Point, line1End: Point, line2Start: Point, line2End: Point): boolean {
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
   * Vérifie si un chemin croise, touche ou partage des points avec les chemins existants
   */
  private doesPathIntersectWithExisting(newPath: Point[], existingPaths: RandomPath[]): boolean {
    if (newPath.length < 2) return false
    
    for (const existingPath of existingPaths) {
      if (!existingPath.path || existingPath.path.length < 2) continue
      
      // 1. Vérifier si les chemins partagent des points communs (sauf les points de départ/arrivée sur les bordures)
      for (let i = 1; i < newPath.length - 1; i++) { // Ignorer les points de départ et d'arrivée
        const newPoint = newPath[i]
        
        for (let j = 1; j < existingPath.path.length - 1; j++) { // Ignorer les points de départ et d'arrivée
          const existingPoint = existingPath.path[j]
          
          if (this.arePointsEqual(newPoint, existingPoint)) {
            console.log(`🔍 Conflit détecté: point partagé à (${newPoint.x}, ${newPoint.y})`)
            return true
          }
        }
      }
      
      // 2. Vérifier chaque segment du nouveau chemin contre chaque segment des chemins existants
      for (let i = 0; i < newPath.length - 1; i++) {
        const newSegmentStart = newPath[i]
        const newSegmentEnd = newPath[i + 1]
        
        for (let j = 0; j < existingPath.path.length - 1; j++) {
          const existingSegmentStart = existingPath.path[j]
          const existingSegmentEnd = existingPath.path[j + 1]
          
          if (this.doLinesIntersectOrTouch(newSegmentStart, newSegmentEnd, existingSegmentStart, existingSegmentEnd)) {
            console.log(`🔍 Conflit détecté: segments se touchent/croisent`)
            console.log(`  Nouveau: (${newSegmentStart.x},${newSegmentStart.y}) -> (${newSegmentEnd.x},${newSegmentEnd.y})`)
            console.log(`  Existant: (${existingSegmentStart.x},${existingSegmentStart.y}) -> (${existingSegmentEnd.x},${existingSegmentEnd.y})`)
            return true
          }
        }
      }
      
      // 3. Vérifier si les chemins passent trop près l'un de l'autre (optionnel, distance minimale)
      const minDistance = Math.min(this.gridSizeWidth, this.gridSizeHeight) * 0.8 // 80% de la taille de grille
      
      for (let i = 0; i < newPath.length; i++) {
        const newPoint = newPath[i]
        
        for (let j = 0; j < existingPath.path.length; j++) {
          const existingPoint = existingPath.path[j]
          
          // Ne pas vérifier la distance pour les points de bordure (départ/arrivée)
          const isNewPointBorder = (i === 0 || i === newPath.length - 1)
          const isExistingPointBorder = (j === 0 || j === existingPath.path.length - 1)
          
          if (!isNewPointBorder && !isExistingPointBorder) {
            const distance = this.getPointDistance(newPoint, existingPoint)
            if (distance < minDistance && distance > 0) {
              console.log(`🔍 Conflit détecté: chemins trop proches (${distance.toFixed(1)} < ${minDistance.toFixed(1)})`)
              console.log(`  Point 1: (${newPoint.x},${newPoint.y})`)
              console.log(`  Point 2: (${existingPoint.x},${existingPoint.y})`)
              return true
            }
          }
        }
      }
    }
    
    return false
  }

    /**
   * Génère des chemins aléatoires entre la bordure de la deadzone et la bordure du canevas
   * Évite les croisements en essayant différents points de destination
   * Génère automatiquement le nombre maximum possible de chemins
   * Phase 1: Points bordure deadzone vers bordure canvas
   * Phase 2: Points proches deadzone vers bordure canvas
   * Phase 3: Points éloignés (proches bordure canvas) vers points proches deadzone
   */
  public setRandomPaths(numberOfPaths?: number): RandomPath[] {
    const deadzoneBorderPoints = this.getDeadzoneBorderPoints()
    const canvasBorderPoints = this.getCanvasBorderPoints()
    const paths: RandomPath[] = []
    
    // Copie des tableaux pour pouvoir les modifier
    const availableDeadzonePoints = [...deadzoneBorderPoints]
    const availableCanvasPoints = [...canvasBorderPoints]
    
    // Obtenir tous les points triés par proximité à la deadzone pour utilisation ultérieure
    const proximityPoints = this.getPointsByProximityToDeadzone()
    let availableProximityPoints = [...proximityPoints]
    
    // Calculer le nombre maximum possible de chemins (maintenant illimité grâce aux proximity points)
    const maxPossiblePathsWithBorder = Math.min(availableDeadzonePoints.length, availableCanvasPoints.length)
    const maxPossiblePathsTotal = availableCanvasPoints.length // Limité par les points de bordure canvas
    const targetPaths = numberOfPaths !== undefined ? Math.min(numberOfPaths, maxPossiblePathsTotal) : maxPossiblePathsTotal
    
    console.log(`🎯 Tentative de génération de ${targetPaths} chemins`)
    console.log(`📍 Points deadzone border: ${availableDeadzonePoints.length}`)
    console.log(`📍 Points canvas border: ${availableCanvasPoints.length}`)
    console.log(`📍 Points proximité deadzone: ${availableProximityPoints.length}`)
    
    let pathIndex = 0
    
    // Phase 1 et 2: Points deadzone/proximité vers bordure canvas
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
        console.log(`🎯 Chemin ${pathIndex + 1}: Utilisation d'un point proche de la deadzone (distance: ${this.getDistanceToDeadzone(selectedPoint).toFixed(1)})`)
      } 
      // Fin des phases 1 et 2
      else {
        console.log(`🔄 Fin des phases 1 et 2. Passage à la phase 3...`)
        break
      }
      
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
        const path = this.aStar(startPoint, endPoint)
        
        if (path) {
          // Vérifier si ce chemin croise avec les chemins existants
          if (!this.doesPathIntersectWithExisting(path, paths)) {
            // Chemin valide trouvé !
            paths.push({
              startPath: { x: startPoint.x, y: startPoint.y },
              endPath: { x: endPoint.x, y: endPoint.y },
              path: path
            })
            
            // Marquer les points comme utilisés et les retirer des listes disponibles
            startPoint.isUsed = true
            endPoint.isUsed = true
            availableCanvasPoints.splice(randomCanvasIndex, 1)
            
            // Retirer le point de départ de la bonne liste
            if (isUsingBorderPoint) {
              const indexToRemove = availableDeadzonePoints.findIndex(p => p.x === startPoint.x && p.y === startPoint.y)
              if (indexToRemove !== -1) {
                availableDeadzonePoints.splice(indexToRemove, 1)
              }
            } else {
              const indexToRemove = availableProximityPoints.findIndex(p => p.x === startPoint.x && p.y === startPoint.y)
              if (indexToRemove !== -1) {
                availableProximityPoints.splice(indexToRemove, 1)
              }
            }
            
            pathFound = true
            console.log(`✅ Chemin ${pathIndex + 1} créé sans conflit`)
          } else {
            console.log(`❌ Chemin ${pathIndex + 1} entre en conflit avec un chemin existant, tentative ${attempts + 1}`)
          }
        } else {
          console.log(`⚠️ Aucun chemin A* trouvé pour la tentative ${attempts + 1}`)
        }
        
        attempts++
      }
      
      if (!pathFound) {
        console.log(`🚫 Impossible de créer le chemin ${pathIndex + 1} sans conflit après ${attempts} tentatives`)
        // Retirer le point de départ pour éviter de le réessayer
        if (isUsingBorderPoint) {
          const indexToRemove = availableDeadzonePoints.findIndex(p => p.x === startPoint.x && p.y === startPoint.y)
          if (indexToRemove !== -1) {
            availableDeadzonePoints.splice(indexToRemove, 1)
          }
        } else {
          const indexToRemove = availableProximityPoints.findIndex(p => p.x === startPoint.x && p.y === startPoint.y)
          if (indexToRemove !== -1) {
            availableProximityPoints.splice(indexToRemove, 1)
          }
        }
      } else {
        pathIndex++
      }
    }
    
    // Phase 3: Points éloignés vers points proches deadzone
    console.log(`🚀 Début de la Phase 3: Points éloignés → Points proches deadzone`)
    
    // Récupérer les points de bordure deadzone et proximité non utilisés
    let availableDeadzonePointsPhase3 = deadzoneBorderPoints.filter(p => !p.isUsed)
    let availableProximityPointsPhase3 = proximityPoints.filter(p => !p.isUsed)
    
    // Obtenir les points éloignés (ordre inverse de proximité)
    const distantPoints = [...proximityPoints].reverse().filter(p => !p.isUsed)
    let availableDistantPoints = [...distantPoints]
    
    console.log(`📍 Points éloignés disponibles: ${availableDistantPoints.length}`)
    console.log(`📍 Points deadzone border disponibles: ${availableDeadzonePointsPhase3.length}`)
    console.log(`📍 Points proximité disponibles: ${availableProximityPointsPhase3.length}`)
    
    while (availableDistantPoints.length > 0 && 
           (availableDeadzonePointsPhase3.length > 0 || availableProximityPointsPhase3.length > 0)) {
      
      // Sélectionner un point de départ éloigné
      const topDistantCount = Math.min(10, availableDistantPoints.length)
      const randomDistantIndex = Math.floor(Math.random() * topDistantCount)
      const startPoint = availableDistantPoints[randomDistantIndex]
      
      let endPoint: PathPoint | null = null
      let isUsingDeadzonePoint = false
      
      // Prioriser les points de bordure deadzone, puis les points proches
      if (availableDeadzonePointsPhase3.length > 0) {
        const randomDeadzoneIndex = Math.floor(Math.random() * availableDeadzonePointsPhase3.length)
        endPoint = availableDeadzonePointsPhase3[randomDeadzoneIndex]
        isUsingDeadzonePoint = true
        console.log(`🎯 Phase 3 - Chemin ${pathIndex + 1}: Point éloigné (distance: ${this.getDistanceToDeadzone(startPoint).toFixed(1)}) → Bordure deadzone`)
      } else if (availableProximityPointsPhase3.length > 0) {
        const topClosestCount = Math.min(5, availableProximityPointsPhase3.length)
        const randomProximityIndex = Math.floor(Math.random() * topClosestCount)
        endPoint = availableProximityPointsPhase3[randomProximityIndex]
        isUsingDeadzonePoint = false
        console.log(`🎯 Phase 3 - Chemin ${pathIndex + 1}: Point éloigné (distance: ${this.getDistanceToDeadzone(startPoint).toFixed(1)}) → Point proche deadzone`)
      }
      
      if (!endPoint) {
        console.log(`🚫 Aucun point d'arrivée disponible en Phase 3`)
        break
      }
      
      // Calcul du chemin avec A*
      const path = this.aStar(startPoint, endPoint)
      
      if (path && !this.doesPathIntersectWithExisting(path, paths)) {
        // Chemin valide trouvé !
        paths.push({
          startPath: { x: startPoint.x, y: startPoint.y },
          endPath: { x: endPoint.x, y: endPoint.y },
          path: path
        })
        
        // Marquer les points comme utilisés
        startPoint.isUsed = true
        endPoint.isUsed = true
        
        // Retirer les points des listes disponibles
        const distantIndex = availableDistantPoints.findIndex(p => p.x === startPoint.x && p.y === startPoint.y)
        if (distantIndex !== -1) {
          availableDistantPoints.splice(distantIndex, 1)
        }
        
        if (isUsingDeadzonePoint) {
          const deadzoneIndex = availableDeadzonePointsPhase3.findIndex(p => p.x === endPoint.x && p.y === endPoint.y)
          if (deadzoneIndex !== -1) {
            availableDeadzonePointsPhase3.splice(deadzoneIndex, 1)
          }
        } else {
          const proximityIndex = availableProximityPointsPhase3.findIndex(p => p.x === endPoint.x && p.y === endPoint.y)
          if (proximityIndex !== -1) {
            availableProximityPointsPhase3.splice(proximityIndex, 1)
          }
        }
        
        pathIndex++
        console.log(`✅ Phase 3 - Chemin ${pathIndex} créé sans conflit`)
      } else {
        console.log(`❌ Phase 3 - Chemin impossible ou en conflit, retrait du point de départ`)
        // Retirer le point de départ pour éviter de le réessayer
        const distantIndex = availableDistantPoints.findIndex(p => p.x === startPoint.x && p.y === startPoint.y)
        if (distantIndex !== -1) {
          availableDistantPoints.splice(distantIndex, 1)
        }
      }
    }
    
    this.randomPaths = paths
    console.log(`🎯 Génération terminée: ${paths.length} chemins créés sans conflit`)
    console.log(`🏁 Phase 3 terminée: Plus de chemins disponibles`)
    return paths
  }

  /**
   * Efface tous les chemins aléatoires
   */
  public clearRandomPaths(): void {
    this.randomPaths = []
  }

  /**
   * Retourne les statistiques sur la génération de chemins aléatoires
   */
  public getRandomPathsStats(): {
    totalPaths: number;
    deadzonePointsAvailable: number;
    canvasPointsAvailable: number;
    deadzonePointsUsed: number;
    canvasPointsUsed: number;
  } {
    const deadzonePoints = this.getDeadzoneBorderPoints()
    const canvasPoints = this.getCanvasBorderPoints()
    
    return {
      totalPaths: this.randomPaths.length,
      deadzonePointsAvailable: deadzonePoints.filter(p => !p.isUsed).length,
      canvasPointsAvailable: canvasPoints.filter(p => !p.isUsed).length,
      deadzonePointsUsed: deadzonePoints.filter(p => p.isUsed).length,
      canvasPointsUsed: canvasPoints.filter(p => p.isUsed).length
    }
  }

  /**
   * Dessine tous les chemins aléatoires générés avec informations de debug
   */
  public drawRandomPaths(strokeStyle: string = 'orange', lineWidth: number = 2): void {
    this.randomPaths.forEach((randomPath, index) => {
      if (randomPath.path) {
        // Utiliser une couleur différente pour chaque chemin
        const colors = ['orange', 'cyan', 'magenta', 'lime', 'yellow', 'pink', 'lightblue', 'lightgreen']
        const color = colors[index % colors.length]
        this.drawPath(randomPath.path, color, lineWidth)
        
        // Ajouter des numéros aux chemins pour le debug
        const midPoint = randomPath.path[Math.floor(randomPath.path.length / 2)]
        this.context.fillStyle = 'white'
        this.context.font = '12px Arial'
        this.context.fillText(`${index + 1}`, midPoint.x + 10, midPoint.y - 10)
      }
    })
  }

  private setupButtons(): void {
    document.getElementById('resetBtn')?.addEventListener('click', () => {
      this.startPoint = null
      this.endPoint = null
      this.redraw()
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
          this.drawPath(path)
        }
      }
    })

    document.getElementById('clearPathBtn')?.addEventListener('click', () => {
      this.redraw()
      if (this.startPoint) this.drawCircle(this.startPoint.x, this.startPoint.y, 8, 'blue')
      if (this.endPoint) this.drawCircle(this.endPoint.x, this.endPoint.y, 8, 'red')
    })

    document.getElementById('generateRandomPathsBtn')?.addEventListener('click', () => {
      this.clearRandomPaths()
      this.setRandomPaths() // Pas de paramètre = génération du maximum possible
      this.redraw()
      this.drawRandomPaths()
      if (this.startPoint) this.drawCircle(this.startPoint.x, this.startPoint.y, 8, 'blue')
      if (this.endPoint) this.drawCircle(this.endPoint.x, this.endPoint.y, 8, 'red')
    })

    document.getElementById('clearRandomPathsBtn')?.addEventListener('click', () => {
      this.clearRandomPaths()
      this.redraw()
      if (this.startPoint) this.drawCircle(this.startPoint.x, this.startPoint.y, 8, 'blue')
      if (this.endPoint) this.drawCircle(this.endPoint.x, this.endPoint.y, 8, 'red')
    })

    document.getElementById('showStatsBtn')?.addEventListener('click', () => {
      const stats = this.getRandomPathsStats()
      const message = `📊 Statistiques des chemins aléatoires:
      
• Chemins créés: ${stats.totalPaths}
• Points deadzone disponibles: ${stats.deadzonePointsAvailable}
• Points deadzone utilisés: ${stats.deadzonePointsUsed}
• Points canvas disponibles: ${stats.canvasPointsAvailable}
• Points canvas utilisés: ${stats.canvasPointsUsed}

Consultez la console pour plus de détails.`
      
      alert(message)
      console.log('📊 Statistiques complètes:', stats)
      console.log('🔍 Chemins actuels:', this.randomPaths)
    })
  }

  private redraw(): void {
    this.context.clearRect(0, 0, this.width, this.height)
    this.drawGrid(this.gridPoints, this.gridSizeWidth, this.gridSizeHeight, this.deadZone)
  }

  /**
   * Calcule la distance minimale d'un point à la deadzone
   */
  private getDistanceToDeadzone(point: Point): number {
    if (!this.deadZone) return Infinity
    
    const halfWidth = this.deadZone.deadZoneWidth / 2
    const halfHeight = this.deadZone.deadZoneHeight / 2
    const bounds = {
      left: this.deadZone.basePoint.x - halfWidth,
      right: this.deadZone.basePoint.x + halfWidth,
      top: this.deadZone.basePoint.y - halfHeight,
      bottom: this.deadZone.basePoint.y + halfHeight
    }
    
    // Si le point est dans la deadzone, retourner une distance très grande
    if (this.isPointInDeadZone(point.x, point.y, this.deadZone)) {
      return Infinity
    }
    
    // Calculer la distance au rectangle de la deadzone
    let dx = 0
    let dy = 0
    
    if (point.x < bounds.left) {
      dx = bounds.left - point.x
    } else if (point.x > bounds.right) {
      dx = point.x - bounds.right
    }
    
    if (point.y < bounds.top) {
      dy = bounds.top - point.y
    } else if (point.y > bounds.bottom) {
      dy = point.y - bounds.bottom
    }
    
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Retourne les points de grille triés par proximité à la deadzone (excluant les points dans la deadzone)
   */
  private getPointsByProximityToDeadzone(): PathPoint[] {
    if (!this.deadZone) return []
    
    const availablePoints: PathPoint[] = this.gridPoints
      .filter(point => !this.isPointInDeadZone(point.x, point.y, this.deadZone!))
      .map(point => ({ ...point, isUsed: false }))
    
    // Trier par distance à la deadzone (du plus proche au plus éloigné)
    availablePoints.sort((a, b) => {
      const distA = this.getDistanceToDeadzone(a)
      const distB = this.getDistanceToDeadzone(b)
      return distA - distB
    })
    
    return availablePoints
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