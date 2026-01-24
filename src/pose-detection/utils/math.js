export function calculateAngle(pointA, pointB, pointC) {
  if (!pointA || !pointB || !pointC) {
    return null
  }

  const vectorAB = { x: pointA.x - pointB.x, y: pointA.y - pointB.y }
  const vectorCB = { x: pointC.x - pointB.x, y: pointC.y - pointB.y }
  const magnitudeAB = Math.hypot(vectorAB.x, vectorAB.y)
  const magnitudeCB = Math.hypot(vectorCB.x, vectorCB.y)

  if (!magnitudeAB || !magnitudeCB) {
    return null
  }

  const dotProduct = vectorAB.x * vectorCB.x + vectorAB.y * vectorCB.y
  const cosine = clamp(dotProduct / (magnitudeAB * magnitudeCB), -1, 1)
  const radians = Math.acos(cosine)

  return (radians * 180) / Math.PI
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function average(values) {
  if (!values.length) {
    return 0
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}
