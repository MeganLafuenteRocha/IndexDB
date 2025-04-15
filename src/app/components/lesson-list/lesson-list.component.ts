import {
  Component,
  inject,
  Input,
  type OnChanges,
  type OnInit,
  type SimpleChanges,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LessonFormComponent } from '../lesson-form/lesson-form.component';
import { IndexedDBService, Lesson } from '../../services/indexdb.service';

@Component({
  selector: 'app-lesson-list',
  templateUrl: './lesson-list.component.html',
  styleUrls: ['./lesson-list.component.css'],
})
export class LessonListComponent implements OnInit, OnChanges {
  @Input() courseId = 0;
  lessons: Lesson[] = [];
  dbService = inject(IndexedDBService);
  modalService = inject(NgbModal);

  constructor() {}

  ngOnInit(): void {
    if (this.courseId) {
      this.loadLessons();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['courseId'] && this.courseId) {
      this.loadLessons();
    }
  }

  loadLessons(): void {
    this.dbService.getLessonsByCourseId(this.courseId).subscribe((lessons) => {
      this.lessons = lessons;
    });
  }

  openLessonForm(lesson?: Lesson): void {
    const modalRef = this.modalService.open(LessonFormComponent);
    modalRef.componentInstance.lesson = lesson || null;
    modalRef.componentInstance.courseId = this.courseId;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadLessons();
        }
      },
      () => {}
    );
  }

  deleteLesson(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta lección?')) {
      this.dbService.deleteLesson(id).subscribe();
    }
  }
}
