import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { reload } from '@helpers/session.helper';
import { BodyHypOrderService } from '@services/body-hyp-order.service';
import { BodyHypOrder } from '@interfaces/body-hyp-order.interface';
import { Overview } from '@interfaces/admin.interfaces';
import { BodyHypOrderDialogComponent } from '../../components/body-hyp-order-dialog/body-hyp-order-dialog.component';

@Component({
  selector: 'app-body-hyp-orders-list',
  templateUrl: './body-hyp-orders-list.component.html',
  styleUrls: ['./body-hyp-orders-list.component.css'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class BodyHypOrdersListComponent implements OnInit {
  displayedColumns: string[] = ['index', 'title', 'description', 'status', 'created_at'];
  dataSource = new MatTableDataSource<BodyHypOrder>([]);
  total = 0;
  page = 1;
  perPage = 15;
  loading = false;

  itemOverview!: Overview;

  constructor(
    private readonly bodyHypOrderService: BodyHypOrderService,
    private readonly dialog: MatDialog,
    private readonly router: Router,
  ) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.itemOverview = {
      user: {
        name: user.name || user.nickname || 'Usuario',
        surname: user.surname || '',
        role: 'Body — HyP',
        email: user.email || '',
        picturepath: '',
      },
      pages: [
        {
          title: 'Órdenes HyP',
          icon: 'fi fi-rr-document',
          permalink: '/admin/body/ordenes',
        },
        {
          title: 'Imagen Studio',
          icon: 'fi fi-rr-picture',
          permalink: '/admin/body/imagen-studio',
        },
      ],
    };
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.bodyHypOrderService.list(this.page, this.perPage).subscribe({
      next: (res) => {
        this.loading = false;
        const p = res.data;
        this.total = p.total;
        this.dataSource.data = p.data;
      },
      error: (err: unknown) => {
        this.loading = false;
        reload(err, this.router);
      },
    });
  }

  onPage(ev: PageEvent): void {
    this.page = ev.pageIndex + 1;
    this.perPage = ev.pageSize;
    this.load();
  }

  openCreate(): void {
    const ref = this.dialog.open(BodyHypOrderDialogComponent, {
      width: 'min(96vw, 520px)',
      disableClose: true,
      data: {},
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.page = 1;
        this.load();
      }
    });
  }

  excerpt(text: string, max = 80): string {
    const t = (text || '').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max)}…`;
  }
}
