import { Component, inject, type OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserFormComponent } from '../user-form/user-form.component';
import { IndexedDBService, User } from '../../services/indexdb.service';
import { CourseListComponent } from '../course-list/course-list.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
  imports: [CourseListComponent],
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  selectedUser: User | null = null;

  dbService = inject(IndexedDBService);
  modalService = inject(NgbModal);

  constructor() {}

  ngOnInit(): void {
    this.loadUsers();

    // Cargar datos de ejemplo
    setTimeout(() => {
      this.dbService.loadSampleData().subscribe((loaded) => {
        if (loaded) {
          console.log('Datos de ejemplo cargados correctamente');
          this.loadUsers();
        }
      });
    }, 300);
  }

  loadUsers(): void {
    this.dbService.users$.subscribe((users) => {
      this.users = users;
    });
    this.dbService.getAllUsers().subscribe();
  }

  selectUser(user: User): void {
    this.selectedUser = user;
  }

  openUserForm(user?: User): void {
    const modalRef = this.modalService.open(UserFormComponent);
    modalRef.componentInstance.user = user || null;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadUsers();
        }
      },
      () => {}
    );
  }

  deleteUser(id: number): void {
    if (
      confirm(
        '¿Estás seguro de que deseas eliminar este usuario? Se eliminarán también todos sus cursos y lecciones.'
      )
    ) {
      this.dbService.deleteUser(id).subscribe((success) => {
        if (success) {
          if (this.selectedUser && this.selectedUser.id === id) {
            this.selectedUser = null;
          }
        }
      });
    }
  }
}
