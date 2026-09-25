# Fluxo de ocorrências

O fluxo segue encaminhamento.docx de 25/09/2026. Novas ocorrências aguardam encaminhamento por 15 minutos, período em que o autor pode editar os dados. Após esse prazo, o servidor analisa cidade, estado e categoria e procura um órgão cadastrado.

Um órgão com e-mail válido recebe automaticamente o documento. Empate, ausência de órgão e contato inválido geram pendências de moderação. O status só muda para Encaminhada após a confirmação do provedor. Uma falha permanece como Falha no encaminhamento.

O cliente mostra os status detalhados e mantém os agrupamentos Aberta, Em andamento e Fechada. Rejeição permanece em andamento por exigir reavaliação. O histórico mostra análise, encaminhamento, reenvio, pendências e classificação da resposta.

Os formulários existentes permitem à moderação selecionar órgãos e e-mails do catálogo e classificar respostas como resolvidas, em resolução ou rejeitadas. Não há cadastro de contatos nem página específica de moderação. O órgão não pode validar a própria resolução.

O servidor realiza um único reenvio após 15 dias sem retorno, usando o contato original. Uma resposta suspende reenvios e exige avaliação do moderador. A leitura automática da caixa de e-mail é futura.

## Persistência e compatibilidade

Os endpoints novos são GET /post/agencies e POST /post/:id/forward/response/review. O encaminhamento usa POST /post/:id/forward com canal EMAIL, identificador do órgão e contato cadastrado. Selecionar órgão em POST /post/:id/agency também aciona o envio. Consulte docs/encaminhamento.md no servidor para configuração e contratos.

Alterações remotas só são refletidas após a resposta da API. Ocorrências locais de demonstração não simulam envio nem são marcadas como encaminhadas. Tipos antigos continuam reconhecidos para preservar registros existentes.

O servidor precisa de configuração de e-mail e catálogo de órgãos preenchido. Testes do cliente usam HTTP simulado e não confirmam entrega real.
