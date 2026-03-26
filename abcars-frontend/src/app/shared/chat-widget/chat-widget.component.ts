import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicAssistantService, ChatMessage, AssistantResponse } from '@services/public-assistant.service';
import { TimeoutError } from 'rxjs';

const SESSION_KEY = 'abcars_chat_history';
const WELCOME_MESSAGE = '¡Hola! Soy el asistente virtual de ABCars. Puedo ayudarte a buscar vehículos disponibles, agendar citas y consultar el estado de tus citas. ¿En qué puedo ayudarte?';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  isOpen: boolean = false;
  messages: ChatMessage[] = [];
  isLoading: boolean = false;
  currentMessage: string = '';
  isLoggedIn: boolean = false;

  private welcomeShown: boolean = false;
  private shouldScrollToBottom: boolean = false;
  private authCheckInterval: any;

  constructor(private publicAssistantService: PublicAssistantService) {}

  ngOnInit(): void {
    this.isLoggedIn = !!localStorage.getItem('user_token');
    this.loadHistory();
    if (this.messages.length > 0) {
      this.welcomeShown = true;
    }
    // Check auth every 2 seconds instead of every change detection cycle
    this.authCheckInterval = setInterval(() => {
      const loggedIn = !!localStorage.getItem('user_token');
      if (loggedIn !== this.isLoggedIn) {
        this.isLoggedIn = loggedIn;
        if (loggedIn) {
          this.isOpen = false;
        }
      }
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && !this.welcomeShown) {
      this.messages.push({
        role: 'assistant',
        content: WELCOME_MESSAGE,
        timestamp: new Date()
      });
      this.welcomeShown = true;
      this.saveHistory();
      this.shouldScrollToBottom = true;
    }
    if (this.isOpen) {
      this.shouldScrollToBottom = true;
    }
  }

  sendMessage(): void {
    const text = this.currentMessage.trim();
    if (!text || this.isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    this.messages.push(userMessage);
    this.currentMessage = '';
    this.isLoading = true;
    this.shouldScrollToBottom = true;
    this.saveHistory();

    const history = this.messages.slice(0, -1);

    console.log('Sending to API:', { message: text, conversation_history: history.map(m => ({ role: m.role, content: m.content })) });

    this.publicAssistantService.sendMessage(text, history).subscribe({
      next: (res: AssistantResponse) => {
        this.messages.push({
          role: 'assistant',
          content: res.response,
          timestamp: new Date()
        });
        this.isLoading = false;
        this.shouldScrollToBottom = true;
        this.saveHistory();
      },
      error: (err: unknown) => {
        const isTimeout = err instanceof TimeoutError ||
          (err instanceof Error && err.name === 'TimeoutError');

        this.messages.push({
          role: 'assistant',
          content: isTimeout
            ? 'No pudimos obtener respuesta. Intenta de nuevo.'
            : 'Error de conexión. Verifica tu internet e intenta de nuevo.',
          timestamp: new Date()
        });
        this.isLoading = false;
        this.shouldScrollToBottom = true;
        this.saveHistory();
      }
    });
  }

  loadHistory(): void {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        this.messages = parsed.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      }
    } catch {
      this.messages = [];
    }
  }

  saveHistory(): void {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(this.messages));
    } catch {
      // sessionStorage not available
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch {
      // ignore
    }
  }

  renderMarkdown(text: string): string {
    if (!text) return '';
    let html = text
      // Imágenes: ![alt](url)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" class="chat-vehicle-img" loading="lazy">')
      // Links: [texto](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener" class="chat-link">$1</a>')
      // Negrita: **texto**
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Saltos de línea
      .replace(/\n/g, '<br>');
    return html;
  }
}
