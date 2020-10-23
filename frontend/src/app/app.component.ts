import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'frontend';

  public secureMessage;

  constructor(public auth: AuthService, private http: HttpClient) {
    this.getSecureMessage();
  }

  getSecureMessage(){
    this.auth.isAuthenticated$.subscribe(isLoggedIn => {
      if(isLoggedIn){
        this.http.get('/api/protected').subscribe(result => this.secureMessage=result);
      }
    });
  }

  loginWithRedirect(): void {
    this.auth.loginWithRedirect();
  }

  logout(): void {
    this.auth.logout({ returnTo: window.location.origin });
  }

}
