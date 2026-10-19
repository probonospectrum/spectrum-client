# SpectrumClient

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.2.

## Desenvolvimento e autenticação

Para testar o cliente local com a API remota já configurada:

```bash
npm start
```

Abra `http://localhost:4200`. Este modo utiliza `https://spectrum-server-2qne.onrender.com`, incluindo contas e dados dessa API. Sugestões e outras ações são persistidas nesse ambiente. Reinicie o servidor de desenvolvimento após atualizar a configuração. `npm run start:stg` usa o mesmo ambiente.

Para usar um backend local, inicie-o na porta 3000 e execute:

```bash
npm run start:local
```

Sem backend em `http://localhost:3000`, login por senha, cadastro e troca do código Google não funcionam nesse modo. `ng serve` usa a API remota por padrão. O backend local é exclusivo de `npm run start:local` ou `ng serve --configuration=local`.

O login Google exige que `http://localhost:4200/auth/callback` esteja autorizado nos URIs de redirecionamento do cliente OAuth no Google e na configuração `GOOGLE_REDIRECT_URI` ou `GOOGLE_REDIRECT_URIS` do backend usado. A origem `http://localhost:4200` também precisa ser permitida pelo CORS do backend. Essas configurações externas não são alteradas pelo cliente.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
