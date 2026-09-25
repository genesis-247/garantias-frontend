import { describe, expect, it } from "vitest";
import { cop, copCompacto, humano, porcentaje, puntos } from "../formato";

describe("formatos es-CO", () => {
  it("porcentaje convierte un ratio con coma decimal", () => {
    expect(porcentaje(0.866667)).toBe("86,67 %");
    expect(porcentaje(1.1, 1)).toBe("110,0 %");
    expect(porcentaje(null)).toBe("—");
  });

  it("puntos no vuelve a multiplicar por 100", () => {
    expect(puntos(75.67, 2)).toBe("75,67 %");
  });

  it("pesos sin decimales y compacto sin espacios que partan la línea", () => {
    expect(cop(2450000000).replace(/\s/g, " ")).toBe("$ 2.450.000.000");
    expect(copCompacto(62691100000)).not.toContain(" ");
  });

  it("humano usa la etiqueta en español con tildes", () => {
    expect(humano("ESTUDIO_JURIDICO")).toBe("Estudio jurídico");
    expect(humano("NO_IDONEA")).toBe("No idónea");
    expect(humano("MONITOREO")).toBe("Monitoreo");
    expect(humano(null)).toBe("—");
  });
});
