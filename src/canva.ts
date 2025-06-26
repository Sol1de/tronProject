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

  public initGrid(gridSizeWidth: number, gridSizeHeight: number, deadZoneWidth?: number, deadZoneHeight?: number, basePoint?: {x: number, y: number}): {gridSizeWidth: number, gridSizeHeight: number, gridPoints: Array<{x: number, y: number}>, deadZone?: {basePoint: {x: number, y: number}, deadZoneWidth: number, deadZoneHeight: number}} {
    const gridPoints: Array<{x: number, y: number}> = []
    let deadZone: {
      basePoint: {x: number, y: number}, 
      deadZoneWidth: number, 
      deadZoneHeight: number
    } | undefined

    gridSizeWidth = this.verifyGridSize(gridSizeWidth, 'width')
    gridSizeHeight = this.verifyGridSize(gridSizeHeight, 'height')
    
    if (deadZoneWidth && deadZoneHeight && basePoint) {
      deadZone = this.initDeadZone(basePoint, deadZoneWidth, deadZoneHeight)
    }
    
    for (let i = 0; i < this.width + gridSizeWidth; i += gridSizeWidth) {
      for (let j = 0; j < this.height + gridSizeHeight; j += gridSizeHeight) {
        if (deadZone && this.isPointInDeadZone(i, j, deadZone)) {
          continue
        }
        gridPoints.push({ x: i, y: j })
      }
    }

    return {gridSizeWidth, gridSizeHeight, gridPoints, deadZone}
  }

  private initDeadZone(basePoint: {x: number, y: number}, deadZoneWidth: number, deadZoneHeight: number): {basePoint: {x: number, y: number}, deadZoneWidth: number, deadZoneHeight: number} {
    return {
      basePoint: {
        x: basePoint.x,
        y: basePoint.y
      },
      deadZoneWidth,
      deadZoneHeight
    }
  }

  private isPointInDeadZone(x: number, y: number, deadZone: {basePoint: {x: number, y: number}, deadZoneWidth: number, deadZoneHeight: number}): boolean {
    const halfWidth = deadZone.deadZoneWidth / 2
    const halfHeight = deadZone.deadZoneHeight / 2
    
    return x > deadZone.basePoint.x - halfWidth && 
           x < deadZone.basePoint.x + halfWidth &&
           y > deadZone.basePoint.y - halfHeight && 
           y < deadZone.basePoint.y + halfHeight
  }

  public drawGrid(gridPoints: Array<{x: number, y: number}>, gridSizeWidth: number, gridSizeHeight: number, deadZone?: {basePoint: {x: number, y: number}, deadZoneWidth: number, deadZoneHeight: number}): void {
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

  private drawGridLineWithDeadZone(startX: number, startY: number, endX: number, endY: number, deadZone: {basePoint: {x: number, y: number}, deadZoneWidth: number, deadZoneHeight: number}, direction: 'horizontal' | 'vertical'): void {
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

  private drawDeadZoneBoundary(deadZone: {basePoint: {x: number, y: number}, deadZoneWidth: number, deadZoneHeight: number}, gridSizeWidth: number, gridSizeHeight: number): void {
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
  
}