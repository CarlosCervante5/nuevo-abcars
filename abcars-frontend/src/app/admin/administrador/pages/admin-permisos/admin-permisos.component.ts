import { Component, OnInit } from '@angular/core';
import { AdminService } from '@services/admin.service';
import { Overview } from '@interfaces/admin.interfaces';
import { RolesResponse, PermissionResponse, RoleDetailResponse } from '@interfaces/admin.interfaces';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-admin-permisos',
    templateUrl: './admin-permisos.component.html',
    styleUrls: ['./admin-permisos.component.css'],
    standalone: false
})
export class AdminPermisosComponent implements OnInit {
    private user = JSON.parse(localStorage.getItem('user') || '{}');
    public itemOverview: Overview = {
        user: {
            name: this.user.name || 'Usuario',
            surname: this.user.surname || '',
            role: 'Admin',
            email: this.user.email || '',
            picturepath: ''
        },
        pages: []
    };

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
}
