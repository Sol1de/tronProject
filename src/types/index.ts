export type Point = { x: number; y: number }

export type DeadZone = { 
  basePoint: Point; 
  deadZoneWidth: number; 
  deadZoneHeight: number 
}

export type PathPoint = Point & { 
  isUsed: boolean 
}

export type RandomPath = {
  startPath: Point;
  endPath: Point;
  path?: Point[];
}

export type GridConfig = {
  gridSizeWidth: number;
  gridSizeHeight: number;
  gridPoints: Point[];
  deadZone?: DeadZone;
}

export type PathfindingResult = {
  path: Point[] | null;
  pathFound: boolean;
  pathLength: number;
}

export type StatisticsData = {
  totalPaths: number;
  deadzonePointsAvailable: number;
  canvasPointsAvailable: number;
  deadzonePointsUsed: number;
  canvasPointsUsed: number;
} 