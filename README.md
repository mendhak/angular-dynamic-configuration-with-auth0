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

## Add an API with public configuration endpoint

Instead of hardcoding, let's load the Auth0 config from /api/uiconfig.
We'll need an Express API with a public endpoint for this. 

In a separate terminal window go back to the root of the project. 

```
npx express-generator api
```


Start the API

```
cd api
npm install
npm start
```

Browse to http://localhost:3000/


In the Express app's index.js, 

```
router.get('/uiconfig', function(req, res, next) {
  res.send({
    domain: 'mydemotenant.eu.auth0.com',
    clientId: '89eVpU4Ixox4Llx6j7466L7pnK9lO4A8',
  });
});

```

Browse to http://localhost:3000/uiconfig


To avoid any CORS issues, let's get Angular to load this API via `/api` - this can be done with Angular's proxy configuration.

Open up `angular.json` and look for the `"serve":{...}` section.

Add this line under serve.options:

```
"proxyConfig": "./proxy.conf.json"
```

Create a proxy.conf.json with this content

```
{
    "/api": {
      "target": "http://localhost:3000",
      "secure": false,
      "pathRewrite": {
        "^/api": ""
      },
      "logLevel": "debug"
    }
}
```

You will need to stop and restart the Angular application. 

```
Ctrl+C
npx -p @angular/cli ng serve
```

Now browse to

http://localhost:4200/api/uiconfig

And it's the same as http://localhost:3000/uiconfig

It's ready to serve the dynamic configuration to the frontend. 




Now we need to get the Angular frontend to load this configuration dynamically. 


Back in the Angular application, in app.module.ts, change the AuthModule.forRoot() line to 

```
AuthModule.forRoot()
```

Import APP_INITIALIZER and HttpClientModule too. 

```
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
```

Add an `APP_INITIALIZER` to the providers[] section, with an AppConfigService (will create this soon)

```
  providers: [
    AppConfigService,
    { provide: APP_INITIALIZER,useFactory: initializeApp, deps: [AppConfigService], multi: true}
  ],
```

Create the `initializeApp` method just outside the @NgModule section. 

```
import { AppConfigService } from './app-config.service';


export function initializeApp(appConfigService: AppConfigService) {
  return (): Promise<any> => { 
    return appConfigService.load();
  }
}
```

Now create the `app-config.service.ts` which loads from `/api/uiconfig`.
Note the IAppConfig which must match the properties coming back from the HTTP Request. 
The actual Auth0 configuration happens on the `authClientConfig.set` line. 


```
import { Injectable }  from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { AuthClientConfig, AuthConfig, AuthConfigService } from '@auth0/auth0-angular';

@Injectable()
export class AppConfigService {
    static settings: IAppConfig;
    httpClient: HttpClient;
    handler: HttpBackend;
    authClientConfig: AuthClientConfig;

    constructor(private http: HttpClient, handler: HttpBackend, authClientConfig: AuthClientConfig) {
        this.httpClient = http;
        this.handler = handler;
        this.authClientConfig = authClientConfig;
    }

    load() {

        const jsonFile = `/api/uiconfig`;
        return new Promise<void>((resolve, reject) => {
            this.httpClient = new HttpClient(this.handler);
            this.httpClient.get(jsonFile).toPromise().then((response : IAppConfig) => {
               AppConfigService.settings = <IAppConfig>response;

               this.authClientConfig.set({ 
                clientId: AppConfigService.settings.clientId, domain: AppConfigService.settings.domain
                });

               console.log('Config Loaded');
               console.log( AppConfigService.settings);
               resolve();
               
            /*}).catch((response: any) => {
               reject(`Could not load the config file`);*/
            });
        });
    }
}

export interface IAppConfig {
    clientId: string
    domain: string
}
```

Reload the page, and this time watch developer tools. You'll see a request made to /api/uiconfig, and the config is printed out.  The application's normal login and logout functionality should work as normal.  

