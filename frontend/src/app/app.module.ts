import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthModule } from '@auth0/auth0-angular';
import { HttpClientModule } from '@angular/common/http';
import { AppConfigService } from './app-config.service';


export function initializeApp(appConfigService: AppConfigService) {
  return (): Promise<any> => { 
    return appConfigService.load();
  }
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    AuthModule.forRoot(),
  ],
  providers: [
    AppConfigService,
    { provide: APP_INITIALIZER,useFactory: initializeApp, deps: [AppConfigService], multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
