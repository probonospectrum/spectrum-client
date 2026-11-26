# Contas de cidadão e órgão público

O cadastro comum e a conclusão do cadastro Google permitem escolher Cidadão ou Órgão público. O cadastro institucional pede CNPJ, nome oficial, cargo e referência pública da autorização do representante. O navegador valida o CNPJ numérico e alfanumérico e o backend repete essa validação.

As permissões institucionais só são liberadas após confirmação do e-mail e aprovação pela moderação. A revisão fica em `/moderacao` e pode criar a instituição no catálogo ou vincular uma existente de mesmo CNPJ. A pessoa acompanha a solicitação, reenvia a confirmação e atualiza suas permissões em `/orgao-publico`.

Representantes aprovados podem registrar andamento, protocolo e fechamento nas ocorrências atribuídas ao próprio órgão. O fechamento exige justificativa e uma evidência enviada pelo representante. As atualizações ficam no histórico e a comunidade mantém a contestação.

Os comentários permitem Responder como órgão público para representantes aprovados com vínculo institucional ativo do órgão responsável pela ocorrência e Responder como Spectrum para o perfil MODERATOR, usado pela comunicação do Spectrum. O backend consulta o perfil autenticado e bloqueia respostas de cidadãos, preservando os comentários comuns. A resposta guarda `parentCommentId` e recebe o nome, CNPJ e identificador da instituição conferidos no backend. O selo Resposta oficial é baseado nessa resposta do servidor; os cidadãos não podem fornecer o selo como parte do cadastro ou comentário.

Todos os formulários estão conectados às rotas do backend pelo interceptor de autenticação e pela URL de API existente. O CNPJ tem validação local de formato e dígitos, enquanto a conferência de inscrição ativa, natureza pública e autorização é realizada pela moderação. Não há integração automática com Receita Federal, gov.br ou SIORG neste recurso.

O texto completo sobre a pesquisa, identificador escolhido, funcionamento, segurança, endpoints e testes está em `docs/contas-publicas-cnpj.md` no repositório do backend.

As respostas são exibidas abaixo do comentário pai, com recuo. O campo de resposta abre junto ao comentário selecionado. Para cidadãos, contas institucionais sem aprovação e órgãos que não são responsáveis pela ocorrência, o botão explica a restrição ao passar o mouse, receber foco ou ser clicado. As ações de andamento e fechamento continuam exigindo atribuição ao órgão responsável.
