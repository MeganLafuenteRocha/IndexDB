import {
  Component,
  inject,
  Input,
  type OnChanges,
  type OnInit,
  type SimpleChanges,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CourseFormComponent } from '../course-form/course-form.component';
import { Course, IndexedDBService } from '../../services/indexdb.service';
import { LessonListComponent } from '../lesson-list/lesson-list.component';

@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.css'],
  imports: [LessonListComponent],
})
export class CourseListComponent implements OnInit, OnChanges {
  @Input() userId = 0;
  courses: Course[] = [];
  selectedCourse: Course | null = null;
  categories: string[] = ['Todos', 'Branding', 'Diseño Web', 'Redes Sociales'];
  selectedCategory = 'Todos';
  dbService = inject(IndexedDBService);
  modalService = inject(NgbModal);

  constructor() {}

  ngOnInit(): void {
    if (this.userId) {
      this.loadCourses();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && this.userId) {
      this.loadCourses();
      this.selectedCourse = null;
    }
  }

  loadCourses(): void {
    this.dbService.getCoursesByUserId(this.userId).subscribe((courses) => {
      this.courses = courses;
    });
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
  }

  getFilteredCourses(): Course[] {
    if (this.selectedCategory === 'Todos') {
      return this.courses;
    }
    return this.courses.filter(
      (course) => course.category === this.selectedCategory
    );
  }

  selectCourse(course: Course): void {
    this.selectedCourse = course;
  }

  openCourseForm(course?: Course): void {
    const modalRef = this.modalService.open(CourseFormComponent);
    modalRef.componentInstance.course = course || null;
    modalRef.componentInstance.userId = this.userId;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadCourses();
        }
      },
      () => {}
    );
  }

  deleteCourse(id: number): void {
    if (
      confirm(
        '¿Estás seguro de que deseas eliminar este curso? Se eliminarán también todas sus lecciones.'
      )
    ) {
      this.dbService.deleteCourse(id).subscribe((success) => {
        if (success) {
          if (this.selectedCourse && this.selectedCourse.id === id) {
            this.selectedCourse = null;
          }
        }
      });
    }
  }
}
