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