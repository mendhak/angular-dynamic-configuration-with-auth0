## To just try the application

Create a host file entry. 

```
127.0.0.1       frontend.example
```

Run the frontend application

```
npm --prefix frontend start 
```

In a separate terminal window, run the API


```
npm --prefix api start
```

Browse to https://frontend.example:4200/.  Try logging in/sign up.  

Watch the network tab in developer tools for: 

* /api/uiconfig - dynamically loaded configuration for the Angular application
* authorize and token - for ID and Access Tokens
* /api/protected - secure API calls being made with Authorization headers





## Instructions from scratch


## Generate a new project. 

npm init
npx -p @angular/cli ng new frontend

Have a look at it

```
cd frontend
npm start
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
npm start
```

Now browse to

http://localhost:4200/api/uiconfig

And it's the same as http://localhost:3000/uiconfig

It's ready to serve the dynamic configuration to the frontend. 



## Get Angular to load Auth0 configuration dynamically

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
Note the IAppConfig which must match the JSON properties coming back from the HTTP Request. 
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


## Advanced - securing API calls. 

When calling APIs, we need to request an Access Token, then pass it as an Authorization: Bearer token in the header.  The API itself needs to validate the Access Token being passed in. 

### Node - create a secure endpoint. 

First create an API in the Auth0 tenant.  Give it an identifier of `my-api`.   This represents the Express API. 

Stop the Express app.  Install JWT dependencies. 

```
cd api
npm install --save express-jwt jwks-rsa express-jwt-authz
```


Now in index.js, add these imports

```
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');

```

And add this middleware, with the tenant domain, and the API Audience. 

```
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://mydemotenant.eu.auth0.com/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: 'my-api',
  issuer: `https://mydemotenant.eu.auth0.com/`,
  algorithms: ['RS256']
});

```


Finally add a protected endpoint

```
router.get('/api/protected', checkJwt, function(req, res) {
  res.json({
    message: 'This is a protected endpoint.'
  });
});
```

Restart the Express app. 

```
npm start
```

Then try browsing to http://localhost:3000/protected and get a 401 Unauthorized error.  It's expecting an Access Token in the Authorization header.  


### Angular - make the frontend a first party application

We need to get the Angular application to request an Access Token, but to not disrupt the user experience, we want to do this silently.  
And in order to do that, we need to make some changes to the frontend so that it is considered a First Party application by Auth0. 

This means we need to use a non-localhost domain, and apply a certificate. We'll go with `https://frontend.example:4200`. 

In Auth0's configuration for the application, add the new URL to all the existing entries with localhost, and save it.

Add an entry to your hosts file. 

```
127.0.0.1  frontend.example
```

Generate a certificate for https://frontend.example

```
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=GB/ST=London/L=London/O=Acme/OU=Org/CN=frontend.example"
```

Get Angular's server to use it, and disable host checking.  This goes in `angular.json` file under the same server.options. 

```

            "ssl": true,
            "sslKey": "../key.pem",
            "sslCert": "../cert.pem",
            "host": "0.0.0.0",
            "disableHostCheck": true,
```            

You will need to stop and restart the Angular application.  

```
Ctrl C
npm start
```

Now open https://frontend.example:4200 in your browser and accept the warning about a self signed certificate. Try the login, logout functionality, everything should work as before. 



### Configure Auth0 to secure calls to /api

Now we can get Auth0 to intercept our http requests, and add an Authorization header.  First we need Auth0 to intercept our http requests.    

In app.module.ts, import the interceptors required. 

```
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthHttpInterceptor } from '@auth0/auth0-angular';
```

 add an HTTP_INTERCEPTORS to the providers section. 

```
  providers: [
    AppConfigService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
    { provide: APP_INITIALIZER,useFactory: initializeApp, deps: [AppConfigService], multi: true}
  ],
```

Then in app-config.service.ts, modify the Auth0 Configuration to now include an `httpInterceptor`.  Here we are saying that all calls to `/api/` should have an Access Token with the `my-api` Audience. The Auth0 library will request this Access Token silently for us.  

```
this.authClientConfig.set({ 
                clientId: AppConfigService.settings.clientId, domain: AppConfigService.settings.domain,
                httpInterceptor: { allowedList: [
                    {
                        uri: "/api/*",
                        tokenOptions: {
                            audience: "my-api"
                        }
                    }
                ] }
                });
```


### Actually make a call to the API

In protected.component.ts, import HTTPClient. 

```
import { HttpClient } from '@angular/common/http';
```

Modify the constructor and have it call the API. 


```
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


```

And display the secureMessage in the HTML. 

```
<div *ngIf="secureMessage">{{ secureMessage.message }}</div>
```

Now refresh the page, and watch the network traffic. 
Note that the Auth0 `authorize` and `token` exchange happens twice, the first is for the normal ID Token, the second is for the Access Token with the right audience.  
Note that the `/api/protected` request has an Authorization header, which is the Access Token.  

