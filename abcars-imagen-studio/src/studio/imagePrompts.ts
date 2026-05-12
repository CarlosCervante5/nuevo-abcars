export type ImagePromptId = 'recuperar-sobreexpuesta' | 'mejorar-opaca' | 'recorte'

/** preserve = mismo lienzo; studio-recorte = recorte + fondo + imageConfig en API. */
export type ImagePromptOutputMode = 'preserve' | 'studio-recorte'

export type ImagePromptOption = {
  id: ImagePromptId
  label: string
  summary: string
  body: string
  outputMode: ImagePromptOutputMode
}

const PROMPT_1_SOBREEXPUESTA = `PROMPT 1 — RECUPERAR FOTO SOBREEXPUESTA / QUEMADA POR LUZ. Mejora técnica y recuperación documental de fotografía automotriz real.

La imagen corresponde a evidencia de hojalatería y pintura, por lo tanto es MUY IMPORTANTE conservar la autenticidad total de la fotografía y todos los daños visibles del vehículo.

OBJETIVO:
Recuperar una fotografía sobreexpuesta o quemada por exceso de luz, restaurando únicamente la información visual perdida por iluminación incorrecta.

INSTRUCCIONES IMPORTANTES:
• NO modificar la forma del vehículo
• NO eliminar golpes, rayones, abolladuras, diferencias de pintura, sombras, marcas ni imperfecciones
• NO embellecer la imagen
• NO aplicar efecto estudio fotográfico
• NO aplicar filtros artísticos
• NO suavizar superficies
• NO alterar colores reales del vehículo
• Mantener apariencia completamente natural y documental

CORRECCIONES PERMITIDAS:
• Recuperar altas luces quemadas
• Reducir brillo excesivo
• Balancear exposición
• Recuperar detalles en pintura y lámina
• Mejorar visibilidad de golpes y daños
• Reducir reflejos exagerados
• Corregir neblina causada por lente sucio
• Mejorar nitidez natural
• Reducir ruido digital sin perder textura real
• Restaurar contraste realista
• Corregir balance de blancos

RESULTADO DESEADO:
Una fotografía técnica clara y realista, con iluminación equilibrada y daños perfectamente visibles, manteniendo el aspecto original de evidencia automotriz tomada en taller o recepción de servicio.`

const PROMPT_2_OPACA = `PROMPT 2 — MEJORAR SATURACIÓN / FOTO OPACA / POCA LUZ. Optimización técnica de fotografía automotriz documental para evidencia de hojalatería y pintura.

La fotografía debe mantenerse completamente auténtica y real, conservando todos los daños visibles y detalles originales del vehículo.

OBJETIVO:
Mejorar una imagen con colores apagados, baja iluminación, poca saturación o apariencia opaca, sin convertirla en una fotografía de estudio.

INSTRUCCIONES IMPORTANTES:
• NO modificar daños visibles
• NO eliminar rayones, golpes, abolladuras ni diferencias de color
• NO generar reflejos falsos
• NO cambiar el tono real de la pintura
• NO aplicar retoque de estudio
• NO suavizar superficies
• NO crear acabado artificial
• Mantener apariencia de fotografía técnica real

MEJORAS PERMITIDAS:
• Mejorar exposición general
• Recuperar detalles en sombras
• Ajustar saturación de forma natural y moderada
• Mejorar claridad visual
• Corregir colores apagados
• Reducir dominante amarilla, azul o verdosa causada por iluminación
• Mejorar nitidez realista
• Reducir ruido digital
• Corregir suciedad ligera del lente
• Mejorar contraste leve
• Definir mejor los daños del vehículo

RESULTADO FINAL:
Fotografía automotriz técnica más clara y legible, con colores naturales y daños visibles correctamente, manteniendo apariencia auténtica de evidencia de taller.`

const PROMPT_RECORTE = `Recorte y fondo: detecta el vehículo principal, recorta y aísla el auto. Elimina por completo el entorno original (techo, paredes, columnas, suelo viejo, cielo, árboles, carteles): no lo dejes difuminado ni en una franja superior. Sustituye el 100% del fondo por un solo ciclorama continuo de catálogo (pared superior ~#fafbfc, horizonte ~#e4e8ec, suelo ~#e8ebef a #f2f4f7, sin texturas ni objetos). Embellece: suciedad leve, reflejos equilibrados, acabado premium. Mantén la identidad exacta del coche (modelo, proporciones, llantas, emblemas).`

export const IMAGE_PROMPT_OPTIONS: ImagePromptOption[] = [
  {
    id: 'recuperar-sobreexpuesta',
    label: 'Sobreexpuesta / quemada',
    summary: 'Recuperación documental sin embellecer; daños visibles.',
    body: PROMPT_1_SOBREEXPUESTA.trim(),
    outputMode: 'preserve',
  },
  {
    id: 'mejorar-opaca',
    label: 'Opaca / poca luz',
    summary: 'Saturación y exposición natural; evidencia de taller.',
    body: PROMPT_2_OPACA.trim(),
    outputMode: 'preserve',
  },
  {
    id: 'recorte',
    label: 'Recorte + fondo',
    summary: 'Aísla el auto, fondo tipo estudio y embellecido.',
    body: PROMPT_RECORTE.trim(),
    outputMode: 'studio-recorte',
  },
]

export function getImagePromptOptionsForMode(
  mode: 'full' | 'solo-embellecer',
): ImagePromptOption[] {
  if (mode === 'solo-embellecer') {
    return IMAGE_PROMPT_OPTIONS.filter((p) => p.id !== 'recorte')
  }
  return IMAGE_PROMPT_OPTIONS
}

export function getImagePromptById(id: ImagePromptId): ImagePromptOption {
  const found = IMAGE_PROMPT_OPTIONS.find((p) => p.id === id)
  if (!found) {
    throw new Error(`Prompt desconocido: ${id}`)
  }
  return found
}

export function getImagePromptBody(id: ImagePromptId): string {
  return getImagePromptById(id).body
}
