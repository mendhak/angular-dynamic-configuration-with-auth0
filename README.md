## Generate a new project. 

npm init
npx -p @angular/cli ng new frontend

Have a look at it

```
cd frontend
npx -p @angular/cli ng serve
```

http://localhost:4200/


## Add Auth0 integration

Using Auth0 in this example. Sign up free account, which creates a tenant.  
Create application in the tenant of type SPA.  You will need the Client ID and Domain shortly.

Scroll down and add `http://localhost:4200/` to the Allowed Callback URLs, Logout URLs and Web Origins, then click Save Changes. 


Back in the code.

```
npm install @auth0/auth0-angular
```

Now in app.module.ts, 

```
import { AuthModule } from '@auth0/auth0-angular';
```

And in imports, 

```
AuthModule.forRoot({
    domain: 'mydemotenant.eu.auth0.com',
    clientId: '89eVpU4Ixox4Llx6j7466L7pnK9lO4A8',
}),
```

Now to actually  use it, add a login/logout button to the main page. 


In app.component.ts, import the Auth0 service. 

```
import { AuthService } from '@auth0/auth0-angular';
```


Inject and set up the login and logout methods:

```
  constructor(public auth: AuthService) {}

  loginWithRedirect(): void {
    this.auth.loginWithRedirect();
  }

  logout(): void {
    this.auth.logout({ returnTo: window.location.origin });
  }


```  

In app.component.html, delete everything except the <router-outlet>.  

Add login and logout buttons. 

```

<p>This is the 'home page'</p>

<button
  *ngIf="(auth.isAuthenticated$ | async) === false"
  (click)="loginWithRedirect()"
>
  Log in
</button>

<button *ngIf="auth.isAuthenticated$ | async" (click)="logout()">
  Log out
</button>

<div *ngIf="auth.user$ | async as user">
Some info about you:
    <ul *ngIf="auth.user$ | async as user" >
    <li>Name: {{ user.name }}</li>
    <li>Email: {{ user.email }}</li>
    </ul>
</div>

```


