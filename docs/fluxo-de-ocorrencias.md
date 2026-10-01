# Fluxo de ocorrências

Consulte o [mapa técnico de fluxo e métodos](mapa-tecnico-ocorrencias.md) para diagramas, responsabilidades, chamadas HTTP e validação.

O fluxo segue encaminhamento.docx de 25/09/2026. Novas ocorrências aguardam encaminhamento por 15 minutos, período em que o autor pode editar os dados. Após esse prazo, o servidor analisa cidade, estado e categoria e procura um órgão cadastrado.

Um órgão com e-mail válido recebe automaticamente o documento. Empate, ausência de órgão e contato inválido geram pendências de moderação. O status só muda para Encaminhada após a confirmação do provedor. Uma falha permanece como Falha no encaminhamento.

O cliente mostra os status detalhados e mantém os agrupamentos Aberta, Em andamento e Fechada. Rejeição permanece em andamento por exigir reavaliação. O histórico mostra análise, encaminhamento, reenvio, pendências e classificação da resposta.

Os formulários existentes permitem à moderação selecionar órgãos e e-mails do catálogo e classificar respostas como resolvidas, em resolução ou rejeitadas. Não há cadastro de contatos. O órgão não pode validar a própria resolução.

## Painel de moderação

A rota `/moderacao` aparece no menu para usuários com `occurrenceRole: MODERATOR`. Após uma alteração administrativa de papel, saia e entre novamente para atualizar a sessão do cliente. O servidor confere o papel no banco em cada chamada protegida.

O painel consulta `GET /post/moderation/occurrences`: até 100 ocorrências mais recentemente atualizadas do fluxo, com histórico de encaminhamento ou pendência. Oferece busca por título, cidade, órgão ou identificador e filtros de pendências, aguardando retorno, respostas para analisar e resolvidas. Totais e filtros se aplicam somente à lista carregada; não há paginação nesta primeira versão.

Cada cartão abre os detalhes existentes: `Registrar resposta` leva o relato a `RESPOSTA_EM_APURACAO`; `Classificar resposta` permite escolher 01/02/03 com justificativa. Selecionar órgão e enviar também ocorre nos detalhes. A lista é atualizada ao entrar ou clicar em Atualizar; não há atualização em tempo real nem leitura automática de e-mails.

O servidor realiza um único reenvio após 15 dias sem retorno, usando o contato original. Uma resposta suspende reenvios e exige avaliação do moderador. A leitura automática da caixa de e-mail é futura.

## Persistência e compatibilidade

Os endpoints novos são GET /post/agencies e POST /post/:id/forward/response/review. O encaminhamento usa POST /post/:id/forward com canal EMAIL, identificador do órgão e contato cadastrado. Selecionar órgão em POST /post/:id/agency também aciona o envio. Consulte docs/encaminhamento.md no servidor para configuração e contratos.

Alterações remotas só são refletidas após a resposta da API. Ocorrências locais de demonstração não simulam envio nem são marcadas como encaminhadas. Tipos antigos continuam reconhecidos para preservar registros existentes.

O servidor precisa de configuração de e-mail e catálogo de órgãos preenchido. Testes do cliente usam HTTP simulado e não confirmam entrega real.

## Telas e edição

A página de detalhes usa o menu compartilhado, as cores e a tipografia do Spectrum, com layout responsivo e suporte ao tema escuro. Mostra a etapa atual, o próximo passo, evidências e histórico. As ações respeitam o perfil: comunidade acompanha; órgão registra a resposta; moderação encaminha e classifica.

A edição pelo formulário salva no servidor título, descrição, categoria, importância, localização e novas evidências. O servidor verifica a janela de 15 minutos e preserva as evidências existentes. O formulário só atualiza a cópia do navegador após sucesso da API.

Registrar uma resposta não encerra a ocorrência: mesmo com código 02, ela fica em apuração até a decisão do moderador.

## Prévia visual isolada

Para revisar as telas sem banco de dados ou envio de e-mails:

```sh
npm start -- --build-target spectrum-client:build:visual-preview --host 127.0.0.1 --port 4202
```

Abra http://127.0.0.1:4202/ocorrencias/66f1c0de0000000000000001. A barra superior identifica os dados fictícios e permite alternar os cenários e o tema. Todas as requisições são interceptadas localmente; essa configuração não faz parte da entrada de produção. A prévia verifica a apresentação, enquanto os testes automatizados verificam as regras e os contratos HTTP.
