import { Component, inject, Input, type OnInit } from '@angular/core';
import {
  FormBuilder,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IndexedDBService, Lesson } from '../../services/indexdb.service';

@Component({
  selector: 'app-lesson-form',
  templateUrl: './lesson-form.component.html',
  styleUrls: ['./lesson-form.component.css'],
  imports: [ReactiveFormsModule],
})
export class LessonFormComponent implements OnInit {
  @Input() lesson: Lesson | null = null;
  @Input() courseId = 0;
  lessonForm: FormGroup;
  isEditing = false;
  fb = inject(FormBuilder);
  dbService = inject(IndexedDBService);
  activeModal = inject(NgbActiveModal);

  constructor() {
    this.lessonForm = this.fb.group({
      title: ['', [Validators.required]],
      content: ['', [Validators.required]],
      duration: [30, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    if (this.lesson) {
      this.isEditing = true;
      this.lessonForm.patchValue({
        title: this.lesson.title,
        content: this.lesson.content,
        duration: this.lesson.duration,
      });
    }
  }

  onSubmit(): void {
    if (this.lessonForm.invalid) {
      return;
    }

    const lessonData: Lesson = {
      title: this.lessonForm.value.title,
      content: this.lessonForm.value.content,
      duration: this.lessonForm.value.duration,
      courseId: this.courseId,
    };

    if (this.isEditing && this.lesson?.id) {
      lessonData.id = this.lesson.id;
      this.dbService.updateLesson(lessonData).subscribe((success) => {
        if (success) {
          this.activeModal.close(true);
        }
      });
    } else {
      this.dbService.addLesson(lessonData).subscribe((id) => {
        if (id !== -1) {
          this.activeModal.close(true);
        }
      });
    }
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}
