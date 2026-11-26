# Notificações

A tela `/notificacoes` usa dados da API. O serviço global acompanha a sessão, conecta ao namespace autenticado `/realtime`, atualiza o contador do menu e consulta os avisos após eventos ou reconexão. Sair ou trocar de conta limpa os dados e encerra requisições e a conexão anterior.

O usuário pode abrir a ocorrência, marcar um aviso ou todos como lidos, excluir avisos e carregar páginas anteriores. Alterações só são confirmadas após resposta da API; falhas aparecem na tela. Curtidas de ocorrências reais passam pela API, enquanto registros demonstrativos continuam locais.

Geram avisos ao autor: curtidas, comentários, confirmações comunitárias, evidências, sugestão/identificação de órgão, encaminhamento e falha, resposta registrada, início de análise, solução informada, resolução confirmada, contestação e reabertura. Há também aviso de novo seguidor e nova publicação de pessoa seguida. A própria ação do destinatário não gera aviso; remover curtida ou descurtir não notifica.

Publicar o back correspondente antes do front. O contrato e o roteiro de aceite estão em `docs/notifications.md` do backend. Não houve validação contra o ambiente publicado.
