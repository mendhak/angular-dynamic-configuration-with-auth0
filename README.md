## Try the application

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

