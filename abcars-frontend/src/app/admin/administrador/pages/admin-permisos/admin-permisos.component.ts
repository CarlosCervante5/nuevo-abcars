import { Component, OnInit } from '@angular/core';
import { AdminService } from '@services/admin.service';
import { RolesResponse, PermissionResponse, RoleDetailResponse } from '@interfaces/admin.interfaces';
import Swal from 'sweetalert2';

/** Orden y etiquetas en español para la vista (Spatie guarda el nombre técnico en inglés). */
const PERMISSION_GROUPS: { id: string; label: string; prefixOrIncludes: (name: string) => boolean }[] = [
  {
    id: 'vehicles',
    label: 'Vehículos',
    prefixOrIncludes: (n) => n.includes('vehicles')
  },
  {
    id: 'users',
    label: 'Usuarios',
    prefixOrIncludes: (n) => n.includes('users')
  },
  {
    id: 'content',
    label: 'Contenido (home / marketing)',
    prefixOrIncludes: (n) => n.includes('banner') || n.includes('delivery photos')
  },
  {
    id: 'analytics',
    label: 'Solicitudes y analítica',
    prefixOrIncludes: (n) => n.includes('analytics')
  },
  {
    id: 'crm',
    label: 'CRM / oportunidades (Strega)',
    prefixOrIncludes: (n) => n.includes('opportunities')
  }
];

const PERMISSION_LABELS_ES: Record<string, string> = {
  'create vehicles': 'Crear vehículos',
  'update vehicles': 'Editar vehículos',
  'delete vehicles': 'Eliminar vehículos',
  'list all vehicles': 'Ver listado de inventario',
  'list users': 'Listar usuarios',
  'create users': 'Crear usuarios',
  'update users': 'Editar usuarios',
  'delete users': 'Eliminar usuarios',
  'manage main banner': 'Editar banner principal (hero)',
  'manage delivery photos': 'Editar fotos de entregas (carrusel)',
  'view analytics dashboard': 'Ver métricas y solicitudes de formularios',
  'view opportunities': 'Ver oportunidades / leads (CRM)',
  'manage opportunities': 'Gestionar oportunidades (CRM)'
};

@Component({
    selector: 'app-admin-permisos',
    templateUrl: './admin-permisos.component.html',
    styleUrls: ['./admin-permisos.component.css'],
    standalone: false
})
export class AdminPermisosComponent implements OnInit {
    public roles: RolesResponse[] = [];
    public permissions: PermissionResponse[] = [];
    public selectedRole: RoleDetailResponse | null = null;
    public rolePermissions: Set<string> = new Set();
    public loading = true;
    public saving = false;

    constructor(private adminService: AdminService) {}

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading = true;
        this.adminService.getRoles().subscribe({
            next: (roles) => {
                this.roles = Array.isArray(roles) ? roles : [];
                this.adminService.getPermissions().subscribe({
                    next: (perms) => {
                        this.permissions = Array.isArray(perms) ? perms : [];
                        this.loading = false;
                    },
                    error: () => {
                        this.loading = false;
                        Swal.fire('Error', 'No se pudieron cargar los permisos', 'error');
                    }
                });
            },
            error: () => {
                this.loading = false;
                Swal.fire('Error', 'No se pudieron cargar los roles', 'error');
            }
        });
    }

    selectRole(role: RolesResponse) {
        this.adminService.getRole(role.id).subscribe({
            next: (detail) => {
                this.selectedRole = detail;
                this.rolePermissions = new Set((detail.permissions || []).map(p => p.name));
            },
            error: () => Swal.fire('Error', 'No se pudo cargar el rol', 'error')
        });
    }

    togglePermission(permName: string) {
        if (this.rolePermissions.has(permName)) {
            this.rolePermissions.delete(permName);
        } else {
            this.rolePermissions.add(permName);
        }
        this.rolePermissions = new Set(this.rolePermissions);
    }

    hasPermission(permName: string): boolean {
        return this.rolePermissions.has(permName);
    }

    savePermissions() {
        if (!this.selectedRole) return;
        this.saving = true;
        const permArray = Array.from(this.rolePermissions);
        this.adminService.updateRole(this.selectedRole.id, { permissions: permArray }).subscribe({
            next: () => {
                this.saving = false;
                Swal.fire('Guardado', 'Permisos actualizados correctamente', 'success');
                this.selectRole(this.selectedRole!);
            },
            error: () => {
                this.saving = false;
                Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
            }
        });
    }

    clearSelection() {
        this.selectedRole = null;
        this.rolePermissions = new Set();
    }

    /** Permisos agrupados para la UI; los no clasificados van en “Otros”. */
    get permissionGroupsForView(): { label: string; items: PermissionResponse[] }[] {
        const list = [...this.permissions];
        const used = new Set<string>();
        const blocks: { label: string; items: PermissionResponse[] }[] = [];

        for (const g of PERMISSION_GROUPS) {
            const items = list.filter((p) => {
                if (used.has(p.name)) {
                    return false;
                }
                if (g.prefixOrIncludes(p.name)) {
                    used.add(p.name);
                    return true;
                }
                return false;
            });
            items.sort((a, b) => a.name.localeCompare(b.name, 'es'));
            if (items.length) {
                blocks.push({ label: g.label, items });
            }
        }

        const rest = list.filter((p) => !used.has(p.name)).sort((a, b) => a.name.localeCompare(b.name, 'es'));
        if (rest.length) {
            blocks.push({ label: 'Otros', items: rest });
        }

        return blocks;
    }

    permissionLabelEs(technicalName: string): string {
        return PERMISSION_LABELS_ES[technicalName] || technicalName;
    }
}
