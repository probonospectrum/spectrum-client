# Fluxo de ocorrências

Consulte o [mapa técnico de fluxo e métodos](mapa-tecnico-ocorrencias.md) para diagramas, responsabilidades, chamadas HTTP e validação.

O fluxo segue encaminhamento.docx de 25/09/2026. Novas ocorrências aguardam encaminhamento por 15 minutos, período em que o autor pode editar os dados. Após esse prazo, o servidor analisa cidade, estado e categoria e procura um órgão cadastrado. A comunidade também pode sugerir órgãos do catálogo. Na página da ocorrência, somente seu autor vê as sugestões, pesquisa por órgão ou pessoa que sugeriu e escolhe uma opção cadastrada. Após a janela de edição, essa escolha é validada pelo servidor antes do encaminhamento.

Uma ocorrência passa para **em andamento** quando o encaminhamento por e-mail é confirmado pelo provedor, quando um encaminhamento manual é registrado pela moderação ou quando uma solução é informada para verificação. O órgão associado pode registrar o início da análise e descrever a ação realizada. O sistema diferencia encaminhamento registrado, análise iniciada e solução aguardando verificação; o registro de um encaminhamento não comprova que o órgão recebeu ou iniciou um serviço.

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

## Regras da implementação

- Confirmações comunitárias não mudam o estado nem aumentam automaticamente a importância.
- O cadastro informa critérios de importância e exige localização que permita encontrar o problema.
- A aceitação de uma sugestão associa o órgão cadastrado e inicia o envio do dossiê por e-mail. O status só muda após a confirmação do provedor; isso não comprova leitura pelo órgão. Contatos de destino não são expostos no catálogo do cliente.
- O protocolo é opcional; a ausência de protocolo não deve ser interpretada como recebimento confirmado.
- Uma solução informada continua em andamento até a verificação. Não existe fechamento automático por prazo.
- Moradores podem sugerir órgãos; somente o autor da ocorrência pode aceitar uma sugestão daquela ocorrência. O servidor valida o vínculo e o cadastro do órgão antes de encaminhar. A moderação mantém as ações administrativas e de verificação; o órgão associado pode registrar análise e verificar soluções.
- Os três estados visuais agrupam os estados detalhados já usados pela API. Registros antigos com importância crítica são exibidos como alta; novos registros oferecem baixa, média e alta.
- Esta versão fecha apenas como resolvida. Encerramento por duplicidade ou outros motivos exige um contrato específico com o backend e não foi acrescentado.

## Persistência e validação

Ocorrências com identificador da API continuam usando os endpoints existentes do servidor. Alterações só aparecem como concluídas depois da resposta; erros são mostrados na interface. O fluxo local mantém os dados e o histórico no navegador para demonstração e testes. Isso não substitui a persistência e a autorização do servidor para uso entre usuários.

Builds de produção do cliente e do backend e as suítes automatizadas foram concluídos: 57 testes do cliente e 121 do backend passaram. A cobertura inclui autorização, envio e interface. O envio real não foi executado nesta conferência e depende da configuração de e-mail e de órgãos ativos no catálogo do backend.

## Sugestões enquanto o catálogo está vazio

Sem órgãos cadastrados, moradores podem sugerir um nome real por texto. Exemplos são apenas orientação no formulário, sem registros fictícios. O autor vê uma seção permanente, com sugestões agrupadas pelo identificador do órgão ou pelo nome normalizado e ordenadas pelo número de participantes identificados distintos. Repetições da mesma pessoa não aumentam a contagem; registros sem identificador de autor não comprovam participantes distintos. Sugestões sem cadastro permanecem visíveis, mas não permitem encaminhamento. A escolha existente ainda encaminha pelo servidor e respeita sua janela de 15 minutos; separar associação de encaminhamento depende de um novo contrato no backend.

## Teste com órgãos fictícios

Abra http://127.0.0.1:4202/ocorrencias/66f1c0de0000000000000001. A barra superior identifica os dados fictícios e permite alternar os cenários e o tema. Todas as requisições são interceptadas localmente; essa configuração não faz parte da entrada de produção. A prévia verifica a apresentação, enquanto os testes automatizados verificam as regras e os contratos HTTP.
