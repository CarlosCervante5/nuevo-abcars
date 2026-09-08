import { Component, OnDestroy, OnInit } from '@angular/core';
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
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private carwash: CarWashService) {}

  ngOnInit(): void {
    this.carwash.whatsappStatus().subscribe({
      next: (res) => {
        const d = res.data;
        this.channelInfo = `${d.provider} · configurado=${d.configured ? 'sí' : 'no'} · agente=${d.agent_enabled ? 'sí' : 'no'}`;
      },
      error: () => {
        this.channelInfo = 'No se pudo leer el estado del canal';
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
    if (showSpinner) this.loadingThread = true;
    this.carwash.getWhatsAppMessages(item.uuid).subscribe({
      next: (res) => {
        this.selected = res.data.conversation;
        this.messages = res.data.messages || [];
        this.loadingThread = false;
      },
      error: (err) => {
        this.loadingThread = false;
        this.error = err?.error?.message || 'No se pudo abrir el hilo';
      }
    });
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
}
