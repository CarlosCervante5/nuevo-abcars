import { Component } from '@angular/core';
import { AssistantService, AssistantResponse } from '@services/assistant.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  data?: Record<string, unknown> | null;
}

@Component({
  selector: 'app-assistant-floating',
  templateUrl: './assistant-floating.component.html',
  styleUrls: ['./assistant-floating.component.css'],
  standalone: false
})
export class AssistantFloatingComponent {
  open = false;
  messages: ChatMessage[] = [];
  inputText = '';
  loading = false;

  constructor(private assistantService: AssistantService) {
    this.messages.push({
      role: 'assistant',
      content: 'Hola, soy el asistente de ABCars. Pregúntame sobre usuarios, vehículos, sucursales, valuaciones o citas.'
    });
  }

  toggle(): void {
    this.open = !this.open;
  }

  isArray(val: unknown): boolean {
    return Array.isArray(val);
  }

  asArray(val: unknown): unknown[] {
    return Array.isArray(val) ? val : [];
  }

  /** Obtiene valor para mostrar: soporta formato nuevo { total } y legacy (número directo) */
  getStat(val: unknown): number | undefined {
    if (val === undefined || val === null) return undefined;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && val !== null && 'total' in val) return (val as { total: number }).total;
    if (Array.isArray(val)) return val.length;
    return undefined;
  }

  getActivos(data: Record<string, unknown> | null | undefined): number | undefined {
    const v = data?.['vehiculos'];
    if (v && typeof v === 'object' && 'activos' in v) return (v as { activos: number }).activos;
    return data?.['vehiculos_activos'] as number | undefined;
  }

  getPorRol(data: Record<string, unknown> | null | undefined): Record<string, number> {
    const u = data?.['usuarios'];
    if (u && typeof u === 'object' && 'por_rol' in u) return (u as { por_rol: Record<string, number> }).por_rol;
    return (data?.['por_rol'] as Record<string, number>) ?? {};
  }

  getPorEstado(data: Record<string, unknown> | null | undefined): Record<string, number> {
    const v = data?.['valuaciones'];
    if (v && typeof v === 'object' && 'por_estado' in v) return (v as { por_estado: Record<string, number> }).por_estado;
    return (data?.['por_estado'] as Record<string, number>) ?? {};
  }

  getVehiculosMuestra(data: Record<string, unknown> | null | undefined): unknown[] {
    const v = data?.['vehiculos'];
    if (v && Array.isArray(v)) return v;
    if (v && typeof v === 'object' && 'muestra' in v) return this.asArray((v as { muestra: unknown[] }).muestra);
    return this.asArray(data?.['lista']);
  }

  getTotalSimple(data: Record<string, unknown> | null | undefined): number | undefined {
    if (data?.['total'] !== undefined && typeof data['total'] === 'number') return data['total'] as number;
    return this.getStat(data?.['usuarios']) ?? this.getStat(data?.['valuaciones']) ?? this.getStat(data?.['citas']);
  }

  getActivosSimple(data: Record<string, unknown> | null | undefined): number | undefined {
    return (data?.['activos'] as number) ?? this.getActivos(data);
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.loading) return;

    this.messages.push({ role: 'user', content: text });
    this.inputText = '';
    this.loading = true;

    this.assistantService.query(text).subscribe({
      next: (res: AssistantResponse) => {
        this.messages.push({
          role: 'assistant',
          content: res.response,
          data: res.data
        });
        this.loading = false;
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          content: 'Error al consultar. Verifica tu conexión e intenta de nuevo.'
        });
        this.loading = false;
      }
    });
  }
}
