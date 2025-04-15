import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, from, of } from "rxjs";
import { catchError, map, switchMap, tap } from "rxjs/operators";

export interface User {
  id?: number;
  name: string;
  avatar: string;
}

export interface Course {
  id?: number;
  title: string;
  image: string;
  category: string;
  userId: number;
}

export interface Lesson {
  id?: number;
  title: string;
  content: string;
  duration: number;
  courseId: number;
}

@Injectable({
  providedIn: "root",
})
export class IndexedDBService {
  private dbName = "coursesDB";
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  // BehaviorSubjects para notificar cambios en los datos
  private usersSubject = new BehaviorSubject<User[]>([]);
  private coursesSubject = new BehaviorSubject<Course[]>([]);
  private lessonsSubject = new BehaviorSubject<Lesson[]>([]);

  // Observables públicos
  users$ = this.usersSubject.asObservable();
  courses$ = this.coursesSubject.asObservable();
  lessons$ = this.lessonsSubject.asObservable();

  constructor() {
    this.initDB();
  }

  // Inicializar la base de datos
  private initDB(): void {
    const request = indexedDB.open(this.dbName, this.dbVersion);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Crear almacén de usuarios si no existe
      if (!db.objectStoreNames.contains("users")) {
        const usersStore = db.createObjectStore("users", {
          keyPath: "id",
          autoIncrement: true,
        });
        usersStore.createIndex("name", "name", { unique: false });
      }

      // Crear almacén de cursos si no existe
      if (!db.objectStoreNames.contains("courses")) {
        const coursesStore = db.createObjectStore("courses", {
          keyPath: "id",
          autoIncrement: true,
        });
        coursesStore.createIndex("userId", "userId", { unique: false });
        coursesStore.createIndex("category", "category", { unique: false });
      }

      // Crear almacén de lecciones si no existe
      if (!db.objectStoreNames.contains("lessons")) {
        const lessonsStore = db.createObjectStore("lessons", {
          keyPath: "id",
          autoIncrement: true,
        });
        lessonsStore.createIndex("courseId", "courseId", { unique: false });
      }
    };

    request.onsuccess = (event: Event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
      console.log("IndexedDB inicializada correctamente");

      this.loadAllData();
    };

    request.onerror = (event: Event) => {
      console.error(
        "Error al abrir IndexedDB:",
        (event.target as IDBOpenDBRequest).error
      );
    };
  }

  private loadAllData(): void {
    this.getAllUsers().subscribe();
    this.getAllCourses().subscribe();
    this.getAllLessons().subscribe();
  }

  // Genéricos para transacciones
  private executeTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest
  ): Observable<T> {
    return new Observable<T>((subscriber) => {
      if (!this.db) {
        subscriber.error("Base de datos no inicializada");
        return;
      }

      try {
        const transaction = this.db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = callback(store);

        request.onsuccess = () => {
          subscriber.next(request.result);
          subscriber.complete();
        };

        request.onerror = () => {
          subscriber.error(request.error);
        };
      } catch (error) {
        subscriber.error(error);
      }
    });
  }

  // CRUD para Usuarios
  getAllUsers(): Observable<User[]> {
    return this.executeTransaction<User[]>("users", "readonly", (store) => {
      return store.getAll();
    }).pipe(
      tap((users) => this.usersSubject.next(users)),
      catchError((error) => {
        console.error("Error al obtener usuarios:", error);
        return of([]);
      })
    );
  }

  getUserById(id: number): Observable<User | undefined> {
    return this.executeTransaction<User>("users", "readonly", (store) => {
      return store.get(id);
    }).pipe(
      catchError((error) => {
        console.error(`Error al obtener usuario con ID ${id}:`, error);
        return of(undefined);
      })
    );
  }

  addUser(user: User): Observable<number> {
    return this.executeTransaction<IDBValidKey>(
      "users",
      "readwrite",
      (store) => {
        return store.add(user);
      }
    ).pipe(
      switchMap((id) => {
        return this.getAllUsers().pipe(map(() => id as number));
      }),
      catchError((error) => {
        console.error("Error al añadir usuario:", error);
        return of(-1);
      })
    );
  }

  updateUser(user: User): Observable<boolean> {
    return this.executeTransaction<IDBValidKey>(
      "users",
      "readwrite",
      (store) => {
        return store.put(user);
      }
    ).pipe(
      switchMap(() => this.getAllUsers()),
      map(() => true),
      catchError((error) => {
        console.error("Error al actualizar usuario:", error);
        return of(false);
      })
    );
  }

  deleteUser(id: number): Observable<boolean> {
    // Primero eliminamos los cursos asociados
    return this.getCoursesByUserId(id).pipe(
      switchMap((courses) => {
        const deleteCourses$ = courses.map((course) =>
          this.deleteCourse(course.id!)
        );
        if (deleteCourses$.length === 0) {
          return of(true);
        }
        return from(
          Promise.all(deleteCourses$.map((obs) => obs.toPromise()))
        ).pipe(map(() => true));
      }),
      switchMap(() => {
        return this.executeTransaction<undefined>(
          "users",
          "readwrite",
          (store) => {
            return store.delete(id);
          }
        );
      }),
      switchMap(() => this.getAllUsers()),
      map(() => true),
      catchError((error) => {
        console.error(`Error al eliminar usuario con ID ${id}:`, error);
        return of(false);
      })
    );
  }

  // CRUD para Cursos
  getAllCourses(): Observable<Course[]> {
    return this.executeTransaction<Course[]>("courses", "readonly", (store) => {
      return store.getAll();
    }).pipe(
      tap((courses) => this.coursesSubject.next(courses)),
      catchError((error) => {
        console.error("Error al obtener cursos:", error);
        return of([]);
      })
    );
  }

  getCourseById(id: number): Observable<Course | undefined> {
    return this.executeTransaction<Course>("courses", "readonly", (store) => {
      return store.get(id);
    }).pipe(
      catchError((error) => {
        console.error(`Error al obtener curso con ID ${id}:`, error);
        return of(undefined);
      })
    );
  }

  getCoursesByUserId(userId: number): Observable<Course[]> {
    return this.getAllCourses().pipe(
      map((courses) => courses.filter((course) => course.userId === userId))
    );
  }

  getCoursesByCategory(category: string): Observable<Course[]> {
    return this.getAllCourses().pipe(
      map((courses) => courses.filter((course) => course.category === category))
    );
  }

  addCourse(course: Course): Observable<number> {
    return this.executeTransaction<IDBValidKey>(
      "courses",
      "readwrite",
      (store) => {
        return store.add(course);
      }
    ).pipe(
      switchMap((id) => {
        return this.getAllCourses().pipe(map(() => id as number));
      }),
      catchError((error) => {
        console.error("Error al añadir curso:", error);
        return of(-1);
      })
    );
  }

  updateCourse(course: Course): Observable<boolean> {
    return this.executeTransaction<IDBValidKey>(
      "courses",
      "readwrite",
      (store) => {
        return store.put(course);
      }
    ).pipe(
      switchMap(() => this.getAllCourses()),
      map(() => true),
      catchError((error) => {
        console.error("Error al actualizar curso:", error);
        return of(false);
      })
    );
  }

  deleteCourse(id: number): Observable<boolean> {
    // Primero eliminamos las lecciones asociadas
    return this.getLessonsByCourseId(id).pipe(
      switchMap((lessons) => {
        const deleteLessons$ = lessons.map((lesson) =>
          this.deleteLesson(lesson.id!)
        );
        if (deleteLessons$.length === 0) {
          return of(true);
        }
        return from(
          Promise.all(deleteLessons$.map((obs) => obs.toPromise()))
        ).pipe(map(() => true));
      }),
      switchMap(() => {
        return this.executeTransaction<undefined>(
          "courses",
          "readwrite",
          (store) => {
            return store.delete(id);
          }
        );
      }),
      switchMap(() => this.getAllCourses()),
      map(() => true),
      catchError((error) => {
        console.error(`Error al eliminar curso con ID ${id}:`, error);
        return of(false);
      })
    );
  }

  // CRUD para Lecciones
  getAllLessons(): Observable<Lesson[]> {
    return this.executeTransaction<Lesson[]>("lessons", "readonly", (store) => {
      return store.getAll();
    }).pipe(
      tap((lessons) => this.lessonsSubject.next(lessons)),
      catchError((error) => {
        console.error("Error al obtener lecciones:", error);
        return of([]);
      })
    );
  }

  getLessonById(id: number): Observable<Lesson | undefined> {
    return this.executeTransaction<Lesson>("lessons", "readonly", (store) => {
      return store.get(id);
    }).pipe(
      catchError((error) => {
        console.error(`Error al obtener lección con ID ${id}:`, error);
        return of(undefined);
      })
    );
  }

  getLessonsByCourseId(courseId: number): Observable<Lesson[]> {
    return this.getAllLessons().pipe(
      map((lessons) => lessons.filter((lesson) => lesson.courseId === courseId))
    );
  }

  addLesson(lesson: Lesson): Observable<number> {
    return this.executeTransaction<IDBValidKey>(
      "lessons",
      "readwrite",
      (store) => {
        return store.add(lesson);
      }
    ).pipe(
      switchMap((id) => {
        return this.getAllLessons().pipe(map(() => id as number));
      }),
      catchError((error) => {
        console.error("Error al añadir lección:", error);
        return of(-1);
      })
    );
  }

  updateLesson(lesson: Lesson): Observable<boolean> {
    return this.executeTransaction<IDBValidKey>(
      "lessons",
      "readwrite",
      (store) => {
        return store.put(lesson);
      }
    ).pipe(
      switchMap(() => this.getAllLessons()),
      map(() => true),
      catchError((error) => {
        console.error("Error al actualizar lección:", error);
        return of(false);
      })
    );
  }

  deleteLesson(id: number): Observable<boolean> {
    return this.executeTransaction<undefined>(
      "lessons",
      "readwrite",
      (store) => {
        return store.delete(id);
      }
    ).pipe(
      switchMap(() => this.getAllLessons()),
      map(() => true),
      catchError((error) => {
        console.error(`Error al eliminar lección con ID ${id}:`, error);
        return of(false);
      })
    );
  }

  loadSampleData(): Observable<boolean> {
    return this.getAllUsers().pipe(
      switchMap((users) => {
        if (users.length > 0) {
          return of(false);
        }

        // Usuarios de ejemplo
        const sampleUsers: User[] = [
          { name: "Carlos Rodríguez", avatar: "/assets/avatars/user1.jpg" },
        ];

        // Añadir usuarios, luego cursos y lecciones
        const addUsers$ = sampleUsers.map((user) => this.addUser(user));

        return from(Promise.all(addUsers$.map((obs) => obs.toPromise()))).pipe(
          switchMap((userIds) => {
            const addCourses$ = [
              this.addCourse({
                title: "Sitio web Tienda de Barrio",
                image: "https://eprendy.com/storage/1687300553_c_html.png",
                category: "Diseño Web",
                userId: userIds[0] as number,
              }),
              this.addCourse({
                title: "Portafolio Presencia",
                image: "/assets/images/project2.jpg",
                category: "Diseño Web",
                userId: userIds[0] as number,
              }),
            ];

            return from(Promise.all(addCourses$.map((obs) => obs.toPromise())));
          }),
          switchMap((courseIds) => {
            const addLessons$ = [
              this.addLesson({
                title: "Introducción al diseño web",
                content: "Contenido de la lección...",
                duration: 30,
                courseId: courseIds[0] as number,
              }),
              this.addLesson({
                title: "HTML y CSS básicos",
                content: "Contenido de la lección...",
                duration: 45,
                courseId: courseIds[0] as number,
              }),
              this.addLesson({
                title: "Diseño responsivo",
                content: "Contenido de la lección...",
                duration: 60,
                courseId: courseIds[0] as number,
              }),
            ];

            return from(Promise.all(addLessons$.map((obs) => obs.toPromise())));
          }),
          map(() => true)
        );
      }),
      catchError((error) => {
        console.error("Error al cargar datos de ejemplo:", error);
        return of(false);
      })
    );
  }
}
