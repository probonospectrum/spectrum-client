# Login Google: diagnóstico, execução e validação

## Objetivo

Permitir login com Google para contas existentes e pedir os dados obrigatórios antes de criar uma conta nova. O backend anterior tentava criar usuários sem senha, nascimento e cidade; o frontend não tratava uma etapa de cadastro pendente e ocultava erros ao sair do callback.

## Integração

O frontend precisa do contrato de cadastro Google no backend (`POST /auth/google` e `POST /auth/google/complete-registration`). O PR do backend é baseado na `main` e contém somente autenticação, cadastro e configuração de CORS. O frontend tem a `stg` como destino.

Ajustes de feed e realtime encontrados na investigação da `dev-sol` ficaram fora desse PR de autenticação.

## Fluxo implementado

1. O navegador solicita autorização ao Google e guarda o estado da tentativa na sessão da aba.
2. O Google volta para `/auth/callback`. O frontend confere o estado e remove os parâmetros da URL.
3. O frontend envia `{ code, redirectUri }` a `POST /auth/google`.
4. O backend aceita somente endereços configurados, troca o código e valida a identidade Google.
5. Uma conta existente recebe a sessão do Spectrum. Uma conta nova recebe `requiresRegistration: true`, perfil e credencial temporária de cadastro (15 minutos), sem sessão autenticada.
6. O frontend abre `/cadastro?google=1`, preenche nome/e-mail, bloqueia o e-mail e pede os dados faltantes. A senha solicitada é uma senha nova do Spectrum, não a senha Google.
7. `POST /auth/google/complete-registration` valida a credencial temporária, salva os dados completos com senha criptografada e retorna a sessão do Spectrum.

A credencial temporária não é aceita como token de acesso. E-mail e identificador Google são extraídos da credencial validada pelo servidor, não do formulário. O cliente guarda o cadastro pendente apenas no `sessionStorage` da aba e o remove ao concluir ou cancelar.

## Preparar o Google

Na credencial OAuth do tipo aplicação Web usada pelo grupo, conferir:

- O client ID precisa ser o mesmo no frontend e no backend.
- Para desenvolvimento, cadastrar a origem `http://localhost:4200` e o URI de redirecionamento **exato** `http://localhost:4200/auth/callback`.
- Para o site publicado, cadastrar também a origem e o callback exatos daquele domínio.
- Se o aplicativo estiver em modo de teste com acesso restrito, conferir se a conta usada está entre os usuários de teste.
- O segredo do cliente permanece somente no backend.

Referência: https://developers.google.com/identity/protocols/oauth2/web-server

## Executar localmente

Use o backend com as alterações de cadastro Google integradas. O arquivo `.env.google.example` do repositório `spectrum-server` descreve as configurações necessárias. Obtenha os valores de desenvolvimento com a responsável pelo backend e salve em `.env`, sem versioná-lo.

O projeto também inicializa o serviço de e-mail: suas variáveis são necessárias mesmo que o fluxo Google não envie e-mail. A configuração atual chama a chave Brevo de `RESEND_API_KEY`.

No primeiro terminal:

```bash
cd /caminho/para/spectrum-server
nvm use --lts
npm ci
npm run start:dev
```

No segundo terminal:

```bash
cd /caminho/para/spectrum-client
nvm use --lts
npm ci
npm start
```

Abra `http://localhost:4200/login`. Não troque localhost por 127.0.0.1 ou a porta durante o fluxo: isso muda o endereço de retorno e o armazenamento da aba.

O frontend usa o client ID já existente no projeto como padrão. Se o grupo usar outra credencial, configure `GOOGLE_CLIENT_ID` no `define` da configuração de desenvolvimento do `angular.json`. Para `npm run build`, o script aceita as variáveis `GOOGLE_CLIENT_ID` e `API_URL` do ambiente de build. Não inclui segredo Google.

## Usar API remota

```bash
npm run start:stg
```

Este comando usa a API Render configurada no projeto. **O fluxo novo de completar cadastro só funcionará quando as alterações correspondentes do backend forem publicadas nesse servidor.** A API também precisa autorizar o callback local e ter CORS configurado para a origem local.

No backend:

- `GOOGLE_REDIRECT_URI`: um callback autorizado, por exemplo o local.
- `GOOGLE_REDIRECT_URIS`: callbacks adicionais separados por vírgula, quando houver mais de um ambiente.
- `CLIENT_URL`/`CLIENT_URLS`: origens do frontend autorizadas pelo CORS.

Todos os callbacks aceitos pelo backend devem também estar cadastrados na mesma credencial do Google.

## Publicação

Antes de publicar, conferir no Render os callbacks permitidos em `GOOGLE_REDIRECT_URI`/`GOOGLE_REDIRECT_URIS`, o client ID e o segredo já configurados. Preservar o callback do site e adicionar o callback local quando necessário. Integrar o backend na `main` e o frontend na `stg` de forma coordenada: a interface antiga não interpreta a resposta de cadastro pendente, e o backend antigo não possui a rota de conclusão.

Depois dos deploys, validar uma conta existente e uma nova no navegador. Builds e testes com serviços simulados não comprovam as credenciais do ambiente publicado.

## Teste manual de aceite

1. Conta existente: entrar com Google, chegar às publicações, atualizar a página e confirmar que a sessão permanece.
2. Conta nova: entrar com Google, confirmar que aparece completar cadastro; não deve haver sessão do Spectrum antes de preencher tudo.
3. Preencher nome de usuário disponível, nascimento, cidade e uma senha do Spectrum. Concluir e confirmar acesso às publicações.
4. Sair e entrar novamente com a mesma conta Google; o formulário de cadastro não deve reaparecer.
5. Cancelar no Google: a mensagem deve permanecer visível e permitir voltar ao login.
6. Nome de usuário ocupado: manter o formulário e permitir corrigir.
7. API desligada: mostrar erro de conexão; não ficar indefinidamente no carregamento.
8. Conferir que o login comum por e-mail/senha continua funcionando.

No navegador, use F12 > Rede para verificar `POST /auth/google` e, para conta nova, `POST /auth/google/complete-registration`. Não compartilhe códigos Google, tokens ou senhas capturados nessa tela.

## Como interpretar falhas

| Sintoma                             | Verificação                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `redirect_uri_mismatch` no Google   | Callback exato cadastrado na credencial correta, inclusive protocolo, porta e caminho.                              |
| `ERR_CONNECTION_REFUSED` / status 0 | Backend está ativo? API configurada corretamente? CORS permite a origem?                                            |
| 400 em `/auth/google`               | `redirectUri` está em `GOOGLE_REDIRECT_URI` ou `GOOGLE_REDIRECT_URIS`?                                              |
| 401 em `/auth/google`               | Credencial/segredo do backend, código expirado ou reutilizado, e-mail Google não verificado. Iniciar um novo login. |
| 404 em `complete-registration`      | Backend antigo; publicar ou executar as alterações deste trabalho.                                                  |
| 401 ao completar cadastro           | Credencial temporária expirada; entrar com Google novamente.                                                        |
| 409 ao completar cadastro           | E-mail ou nome de usuário já existente.                                                                             |

## Verificações automatizadas

Frontend:

```bash
npm test -- --watch=false --include='src/app/core/services/user/google-auth.service.spec.ts' --include='src/app/core/services/authApi/auth-api.service.spec.ts' --include='src/app/features/callback/callback.spec.ts' --include='src/app/features/user/login-page/login-page.spec.ts'
npm run build
```

Backend:

```bash
npm test -- --runInBand auth.service.spec.ts
npm run build
```

Os testes simulam Google e banco. Eles não substituem o teste real com as credenciais, MongoDB e conta Google do grupo.

