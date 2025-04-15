import { Component, inject, Input, type OnInit } from '@angular/core';
import {
  FormBuilder,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Course, IndexedDBService } from '../../services/indexdb.service';

@Component({
  selector: 'app-course-form',
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.css'],
  imports: [ReactiveFormsModule],
})
export class CourseFormComponent implements OnInit {
  @Input() course: Course | null = null;
  @Input() userId = 0;
  courseForm: FormGroup;
  isEditing = false;
  categories: string[] = ['Branding', 'Diseño Web', 'Redes Sociales'];
  fb = inject(FormBuilder);
  activeModal = inject(NgbActiveModal);

  constructor(private dbService: IndexedDBService) {
    this.courseForm = this.fb.group({
      title: ['', [Validators.required]],
      image: ['', [Validators.required]],
      category: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    if (this.course) {
      this.isEditing = true;
      this.courseForm.patchValue({
        title: this.course.title,
        image: this.course.image,
        category: this.course.category,
      });
    }
  }

  onSubmit(): void {
    if (this.courseForm.invalid) {
      return;
    }

    const courseData: Course = {
      title: this.courseForm.value.title,
      image: this.courseForm.value.image,
      category: this.courseForm.value.category,
      userId: this.userId,
    };

    if (this.isEditing && this.course?.id) {
      courseData.id = this.course.id;
      this.dbService.updateCourse(courseData).subscribe((success) => {
        if (success) {
          this.activeModal.close(true);
        }
      });
    } else {
      this.dbService.addCourse(courseData).subscribe((id) => {
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
