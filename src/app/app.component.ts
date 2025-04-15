import { Component, inject, type OnInit } from '@angular/core';
import { IndexedDBService } from './services/indexdb.service';
import { UserListComponent } from './components/user-list/user-list.component';

interface User {
  id: number;
  name: string;
  avatar: string;
  courses: Course[];
}

interface Course {
  id: number;
  title: string;
  image: string;
  category: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [UserListComponent],
})
export class AppComponent implements OnInit {
  title = 'Sistema de Gestión de Cursos';
  users: User[] = [];
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  selectedUser: User | null = null;
  categories: string[] = ['Todos', 'Branding', 'Diseño Web', 'Redes Sociales'];
  selectedCategory = 'Todos';

  dbService = inject(IndexedDBService);

  constructor() {}

  ngOnInit(): void {
    // Inicializar la base de datos
    this.dbService.getAllUsers().subscribe();

    // Datos de ejemplo
    this.users = [
      {
        id: 1,
        name: 'Carlos Rodríguez',
        avatar: 'https://static.vecteezy.com/system/resources/previews/011/490/381/original/happy-smiling-young-man-avatar-3d-portrait-of-a-man-cartoon-character-people-illustration-isolated-on-white-background-vector.jpg',
        courses: [
          {
            id: 1,
            title: 'Sitio web Tienda de Té',
            image: 'https://mir-s3-cdn-cf.behance.net/project_modules/1400/719cfa149694909.62ebdce122725.jpg',
            category: 'Diseño Web',
          },
          {
            id: 2,
            title: 'Portafolio Presencia',
            image: 'https://th.bing.com/th/id/R.e9aee3270d9a5d7fe174095ee917e9fc?rik=4pCKoyNpBgJoJw&pid=ImgRaw&r=0',
            category: 'Diseño Web',
          },
        ],
      },
      {
        id: 2,
        name: 'María López',
        avatar: 'https://cdn4.iconfinder.com/data/icons/avatars-of-people/5000/avatar_18-1024.png',
        courses: [
          {
            id: 3,
            title: 'Sitio web Hotel',
            image: 'https://th.bing.com/th/id/R.0d26602b938b8ebfba0ab55a95872722?rik=pzw4hmfgO8tIdQ&pid=ImgRaw&r=0',
            category: 'Diseño Web',
          },
          {
            id: 4,
            title: 'Aplicación web SkyStore',
            image: 'https://image.winudf.com/v2/image1/Y29tLmJza3liLnNreXN0b3JlLmFwcC5kZV9zY3JlZW5fMF8xNTUzODA5MTg2XzA2NQ/screen-0.jpg?fakeurl=1&type=.jpg',
            category: 'Branding',
          },
        ],
      },
      {
        id: 3,
        name: 'Juan Pérez',
        avatar: 'https://static.vecteezy.com/system/resources/previews/024/183/502/non_2x/male-avatar-portrait-of-a-young-man-with-a-beard-illustration-of-male-character-in-modern-color-style-vector.jpg',
        courses: [
          {
            id: 5,
            title: 'App Dashboard de Estudios',
            image: 'https://mir-s3-cdn-cf.behance.net/project_modules/max_3840/ed19df162786849.63db2d3fecae6.png',
            category: 'Redes Sociales',
          },
        ],
      },
    ];

    // Inicialmente mostrar todos los cursos
    this.updateCoursesList();
  }
  //comentario de prueba
  selectUser(user: User) {
    this.selectedUser = user;
    this.filteredCourses = user.courses;
    this.selectedCategory = 'Todos';
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.updateCoursesList();
  }

  updateCoursesList() {
    if (!this.selectedUser) {
      // Si no hay usuario seleccionado, mostrar todos los cursos
      this.courses = this.getAllCourses();
    } else {
      this.courses = this.selectedUser.courses;
    }

    // Aplicar filtro por categoría
    if (this.selectedCategory !== 'Todos') {
      this.filteredCourses = this.courses.filter(
        (course) => course.category === this.selectedCategory
      );
    } else {
      this.filteredCourses = this.courses;
    }
  }

  getAllCourses(): Course[] {
    const allCourses: Course[] = [];
    this.users.forEach((user) => {
      user.courses.forEach((course) => {
        allCourses.push(course);
      });
    });
    return allCourses;
  }

  showCourseDetails(course: Course) {
    // Aquí implementarías la lógica para mostrar los detalles del curso
    console.log('Mostrando detalles del curso:', course);
    // Por ejemplo, podrías abrir un modal o navegar a otra ruta
  }
}
