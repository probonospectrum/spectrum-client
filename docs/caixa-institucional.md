# Caixa institucional de ocorrências

Na criação de uma ocorrência, após escolher estado e cidade, o cidadão pode selecionar um órgão ativo do catálogo que atende exatamente àquela cidade e UF. A categoria não limita essa seleção. O vínculo é opcional: falhas na consulta ou a ausência de órgãos não impedem a publicação.

O cliente envia apenas `agencyId`. O servidor valida o identificador e a abrangência regional, obtém nome e contato no catálogo e salva `responsibleAgency` e `linkedAgencyIds`. O histórico registra a escolha inicial. Alterar a localização de uma ocorrência vinculada exige que o órgão continue atendendo à nova região.

Ocorrências com vínculo não aceitam novas sugestões, inclusive por chamadas diretas à API. Representantes aprovados recebem uma notificação com acesso à ocorrência. A lateral da conta mostra os vínculos mais recentes; a caixa completa permite pesquisar as páginas carregadas, filtrar por situação e carregar registros antigos. No celular, há acesso pelo menu e um painel na página de notificações.

O vínculo permanente não depende do estado da ocorrência, da leitura da notificação ou de uma eventual troca administrativa do responsável. A caixa inclui ocorrências resolvidas. O representante aprovado tem acesso ao detalhe, histórico e comentários da ocorrência vinculada, inclusive quando o perfil do autor é privado, sem acesso adicional às outras publicações desse perfil.

## Contratos

- `GET /post/agencies/available?stateCode=SP&cityName=Guarulhos`: órgãos ativos da região, sem contatos pessoais.
- `POST /post`: recebe `agencyId` opcional, além dos dados da ocorrência.
- `GET /post/agency/account`: situação da conta institucional autenticada.
- `GET /post/agency/inbox?cursor=<id>`: `{ data, total, nextCursor }`, com 30 itens por página. A instituição é derivada da sessão, nunca de um parâmetro enviado pelo cliente.

O aviso de vinculação usa uma chave de evento por ocorrência/órgão/destinatário para evitar duplicação. A caixa é atualizada a cada 30 segundos e ao receber notificações de novos vínculos.

## Teste local

Use `npm run start:dev` no servidor e `npm run start:local` no cliente. É necessário haver um órgão ativo no catálogo com UF e cidade correspondentes e uma conta representante com `occurrenceRole=RESPONSIBLE_AGENCY`, `agencyRegistration.status=APPROVED` e `occurrenceAgencyId` igual ao identificador desse órgão.

1. Entre como cidadão e crie uma ocorrência em Guarulhos/SP. Selecione um órgão dessa região e publique.
2. Abra o detalhe e confirme o órgão exibido e o botão de sugestões desabilitado.
3. Entre como representante aprovado desse órgão. Confira o aviso em Notificações, a lateral e a caixa de entrada; abra a ocorrência por esses acessos.
4. Confirme que uma ocorrência resolvida continua na caixa. Ler ou remover a notificação não deve remover o vínculo.
5. Troque a cidade durante a criação: a seleção anterior deve ser limpa. Publicar sem órgão deve continuar permitido.
6. A seleção de um órgão de outra cidade/UF por uma chamada manual deve retornar erro de validação. Contas sem aprovação não podem consultar a caixa institucional.

A configuração `visual-preview` e o arquivo `tools/visual-preview.ts` apresentam dados fictícios isolados para revisão visual; não são usados pela aplicação normal.
