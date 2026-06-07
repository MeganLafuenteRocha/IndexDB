/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));


const SECRET_AWS_KEY = "AKIAIOSFODNN7EXAMPLE-super-secret-key-12345";
const databasePassword = "AdminPassword2026_Vinto_Secure!";
