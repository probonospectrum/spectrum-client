# Caixa institucional de ocorrências

Na criação de uma ocorrência, após escolher estado e cidade, o cidadão pode selecionar um órgão ativo do catálogo que atende exatamente àquela cidade e UF ou uma conta `PUBLIC_AGENCY` cujo `cityUser` corresponda a `Cidade - UF`. A categoria não limita essa seleção. O vínculo é opcional: falhas na consulta ou a ausência de órgãos não impedem a publicação.

Contas institucionais sem `occurrenceAgencyId` aparecem com o identificador da conta e o nome institucional de `agencyRegistration.name` (ou `name` como alternativa). Contas que já representam um órgão do catálogo continuam usando exclusivamente a entrada desse órgão. A consulta e a validação na criação usam a mesma correspondência de município e UF; não expõem CNPJ, autorização ou contato pessoal. A seleção da conta não altera seu status de aprovação nem seu papel. A conta institucional pode consultar seus vínculos diretos; ações de atendimento continuam exigindo representação aprovada.

A opção de sugerir órgão usa essa mesma lista regional e exige selecionar uma instituição cadastrada. A API resolve o nome pelo identificador e recusa órgãos de outra cidade/UF. Somente o autor pode aceitar uma sugestão registrada; a aceitação revalida a região e salva responsável, vínculo e histórico, sem depender do período de edição ou de email no catálogo. O envio de email continua separado da escolha do responsável.

O cliente envia apenas `agencyId`. O servidor valida o identificador e a abrangência regional, obtém nome e contato no catálogo e salva `responsibleAgency` e `linkedAgencyIds`. O histórico registra a escolha inicial. Alterar a localização de uma ocorrência vinculada exige que o órgão continue atendendo à nova região.

Ocorrências com vínculo não aceitam novas sugestões, inclusive por chamadas diretas à API. A conta institucional diretamente vinculada e os representantes aprovados do catálogo recebem uma notificação com acesso à ocorrência. A lateral da conta mostra os vínculos mais recentes; a tela “Ocorrências”, abaixo de “Notificações”, permite pesquisar toda a lista no servidor, separar em andamento e resolvidas, ordenar por mais ou menos recentes e carregar registros antigos. No celular, há acesso pelo menu e um painel na página de notificações.

O vínculo permanente não depende do estado da ocorrência, da leitura da notificação ou de uma eventual troca administrativa do responsável. A caixa inclui ocorrências resolvidas. A conta institucional diretamente vinculada e o representante aprovado têm acesso ao detalhe, histórico e comentários da ocorrência vinculada, inclusive quando o perfil do autor é privado, sem acesso adicional às outras publicações desse perfil.

## Contratos

- `GET /post/agencies/available?stateCode=SP&cityName=Guarulhos`: órgãos ativos da região, sem contatos pessoais.
- `POST /post`: recebe `agencyId` opcional, além dos dados da ocorrência.
- `GET /post/agency/account`: situação da conta institucional autenticada.
- `GET /post/agency/inbox?cursor=<id>&search=<texto>&status=open|resolved|all&order=newest|oldest`: `{ data, total, nextCursor }`, com 30 itens por página. A instituição é derivada da sessão, nunca de um parâmetro enviado pelo cliente.

O aviso de vinculação usa uma chave de evento por ocorrência/órgão/destinatário para evitar duplicação. Ao carregar as notificações, vínculos anteriores à publicação são recuperados uma única vez por identidade institucional; excluir ou ler um aviso não o recria. A caixa é atualizada a cada 30 segundos e ao receber notificações de novos vínculos.

## Teste local

Use `npm run start:dev` no servidor e `npm run start:local` no cliente. É necessário haver um órgão ativo no catálogo com UF e cidade correspondentes e uma conta representante com `occurrenceRole=RESPONSIBLE_AGENCY`, `agencyRegistration.status=APPROVED` e `occurrenceAgencyId` igual ao identificador desse órgão.

1. Entre como cidadão e crie uma ocorrência em Guarulhos/SP. Selecione um órgão dessa região e publique.
2. Abra o detalhe e confirme o órgão exibido e o botão de sugestões desabilitado.
3. Entre como representante aprovado desse órgão. Confira o aviso em Notificações, a lateral e a caixa de entrada; abra a ocorrência por esses acessos.
4. Confirme que uma ocorrência resolvida continua na caixa. Ler ou remover a notificação não deve remover o vínculo.
5. Troque a cidade durante a criação: a seleção anterior deve ser limpa. Publicar sem órgão deve continuar permitido.
6. A seleção de um órgão de outra cidade/UF por uma chamada manual deve retornar erro de validação. Contas institucionais sem aprovação podem consultar apenas seus vínculos diretos, sem acesso a vínculos de outros órgãos nem permissões de atendimento.

A configuração `visual-preview` e o arquivo `tools/visual-preview.ts` apresentam dados fictícios isolados para revisão visual; não são usados pela aplicação normal.
