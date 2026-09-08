import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  CarWashService,
  CarWashWhatsAppConversation,
  CarWashWhatsAppMessage
} from '@services/carwash.service';

@Component({
  selector: 'app-carwash-whatsapp',
  standalone: true,
  templateUrl: './carwash-whatsapp.component.html',
  styleUrls: ['./carwash-whatsapp.component.css'],
  imports: [CommonModule, FormsModule, RouterModule, MatProgressSpinnerModule]
})
export class CarWashWhatsAppComponent implements OnInit, OnDestroy {
  @ViewChild('messagesPane') messagesPane?: ElementRef<HTMLDivElement>;

  conversations: CarWashWhatsAppConversation[] = [];
  selected: CarWashWhatsAppConversation | null = null;
  messages: CarWashWhatsAppMessage[] = [];
  replyBody = '';
  query = '';
  onlyHuman = false;
  loading = false;
  loadingThread = false;
  sending = false;
  error: string | null = null;
  channelInfo: string | null = null;
  mobileShowThread = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private carwash: CarWashService) {}

  ngOnInit(): void {
    this.carwash.whatsappStatus().subscribe({
      next: (res) => {
        const d = res.data;
        const provider = (d.provider || 'whatsapp').toString();
        this.channelInfo = `${provider} · ${d.configured ? 'conectado' : 'sin config'} · agente ${
          d.agent_enabled ? 'ON' : 'OFF'
        }`;
      },
      error: () => {
        this.channelInfo = 'Canal no disponible';
      }
    });
    this.reload();
    this.pollTimer = setInterval(() => {
      if (this.selected) {
        this.openConversation(this.selected, false);
      } else {
        this.reload(false);
      }
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  reload(showSpinner = true): void {
    if (showSpinner) this.loading = true;
    this.error = null;
    this.carwash
      .listWhatsAppConversations({
        q: this.query || undefined,
        needs_human: this.onlyHuman || undefined,
        per_page: 50
      })
      .subscribe({
        next: (res) => {
          const data = res.data as { data?: CarWashWhatsAppConversation[] } | CarWashWhatsAppConversation[];
          this.conversations = Array.isArray(data) ? data : data?.data || [];
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'No se pudieron cargar conversaciones';
        }
      });
  }

  openConversation(item: CarWashWhatsAppConversation, showSpinner = true): void {
    this.selected = item;
    this.mobileShowThread = true;
    if (showSpinner) this.loadingThread = true;
    this.carwash.getWhatsAppMessages(item.uuid).subscribe({
      next: (res) => {
        this.selected = res.data.conversation;
        this.messages = res.data.messages || [];
        this.loadingThread = false;
        this.scrollToBottom();
      },
      error: (err) => {
        this.loadingThread = false;
        this.error = err?.error?.message || 'No se pudo abrir el hilo';
      }
    });
  }

  closeThread(): void {
    this.mobileShowThread = false;
  }

  sendReply(): void {
    if (!this.selected || !this.replyBody.trim()) return;
    this.sending = true;
    this.carwash.replyWhatsApp(this.selected.uuid, this.replyBody.trim()).subscribe({
      next: () => {
        this.sending = false;
        this.replyBody = '';
        this.openConversation(this.selected!);
        this.reload(false);
      },
      error: (err) => {
        this.sending = false;
        this.error = err?.error?.message || 'No se pudo enviar';
      }
    });
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendReply();
    }
  }

  toggleHandoff(): void {
    if (!this.selected) return;
    const next = !this.selected.needs_human;
    this.carwash.updateWhatsAppHandoff(this.selected.uuid, next).subscribe({
      next: (res) => {
        this.selected = res.data;
        this.reload(false);
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo actualizar handoff';
      }
    });
  }

  initials(c: CarWashWhatsAppConversation): string {
    const name = (c.customer_name || '').trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      const letters = (parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '');
      return letters.toUpperCase() || 'WA';
    }
    const digits = (c.phone || '').replace(/\D+/g, '');
    return (digits.slice(-2) || 'WA').toUpperCase();
  }

  formatPhone(phone: string | null | undefined): string {
    const raw = (phone || '').trim();
    if (!raw) return 'Sin teléfono';
    const digits = raw.replace(/\D+/g, '');
    if (digits.length >= 10) {
      const local = digits.slice(-10);
      return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
    }
    return raw;
  }

  relativeTime(iso: string | null | undefined): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diffSec = Math.round((Date.now() - then) / 1000);
    if (diffSec < 60) return 'ahora';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h`;
    if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} d`;
    return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }

  showDayDivider(index: number): boolean {
    if (index === 0) return true;
    const cur = this.dayKey(this.messages[index]?.created_at);
    const prev = this.dayKey(this.messages[index - 1]?.created_at);
    return !!cur && cur !== prev;
  }

  dayLabel(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (this.sameDay(d, today)) return 'Hoy';
    if (this.sameDay(d, yesterday)) return 'Ayer';
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  private dayKey(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      const el = this.messagesPane?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
