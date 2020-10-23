import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthModule } from '@auth0/auth0-angular';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AuthModule.forRoot({
      domain: 'mydemotenant.eu.auth0.com',
      clientId: '89eVpU4Ixox4Llx6j7466L7pnK9lO4A8',
    }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
