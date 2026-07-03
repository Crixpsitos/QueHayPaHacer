export class Coordinates {
  constructor(
    public readonly latitude: number,
    public readonly longitude: number,
  ) {
    if (latitude < -90 || latitude > 90) {
      throw new Error("Latitud inválida")
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error("Longitud inválida")
    }
  }
}
