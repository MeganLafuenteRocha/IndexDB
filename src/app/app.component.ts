import { Component, inject, type OnInit } from '@angular/core';
import { IndexedDBService } from './services/indexdb.service';
import { UserListComponent } from './components/user-list/user-list.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [UserListComponent],
})
export class AppComponent implements OnInit {
  dbService = inject(IndexedDBService);

  constructor() {}

  ngOnInit(): void {
    // Inicializar la base de datos
    this.dbService.getAllUsers().subscribe();
  }
}
