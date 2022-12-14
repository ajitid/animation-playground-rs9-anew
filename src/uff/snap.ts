// src: Popmotion

export function snap(x: number): (v: number) => number;
export function snap(x: number[]): (v: number) => [point: number, index: number];
export function snap(points: number | number[]) {
  if (typeof points === "number") {
    return (v: number) => Math.round(v / points) * points;
  } else {
    let i = 0;
    const numPoints = points.length;

    return (v: number) => {
      let lastDistance = Math.abs(points[0] - v);

      for (i = 1; i < numPoints; i++) {
        const point = points[i];
        const distance = Math.abs(point - v);

        if (distance === 0) return [point, i];

        if (distance > lastDistance) return [points[i - 1], i - 1];

        if (i === numPoints - 1) return [point, i];

        lastDistance = distance;
      }
    };
  }
}
