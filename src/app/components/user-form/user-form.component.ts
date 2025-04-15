import { Component, inject, Input, type OnInit } from '@angular/core';
import {
  FormBuilder,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IndexedDBService, User } from '../../services/indexdb.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css'],
  imports: [ReactiveFormsModule],
})
export class UserFormComponent implements OnInit {
  @Input() user: User | null = null;
  userForm: FormGroup;
  isEditing = false;

  fb = inject(FormBuilder);
  dbService = inject(IndexedDBService);
  activeModal = inject(NgbActiveModal);

  constructor() {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      avatar: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    if (this.user) {
      this.isEditing = true;
      this.userForm.patchValue({
        name: this.user.name,
        avatar: this.user.avatar,
      });
    }
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      return;
    }

    const userData: User = {
      name: this.userForm.value.name,
      avatar: this.userForm.value.avatar,
    };

    if (this.isEditing && this.user?.id) {
      userData.id = this.user.id;
      this.dbService.updateUser(userData).subscribe((success) => {
        if (success) {
          this.activeModal.close(true);
        }
      });
    } else {
      this.dbService.addUser(userData).subscribe((id) => {
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
