import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { routes } from './app/app.routes';


@NgModule({
  imports: [
    RouterModule.forRoot(routes, { useHash: true })
  ]
})
export class AppModule {}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
