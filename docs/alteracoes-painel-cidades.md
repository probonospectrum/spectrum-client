# Alterações no painel de cidades do Spectrum

Data: 7 de outubro de 2026

## Objetivo

O painel foi reorganizado para apresentar informações conforme o nível geográfico selecionado. A visão geral compara estados; a seleção de um estado permite comparar suas cidades; a seleção de uma cidade permite consultar suas ocorrências recentes. A alteração também removeu gráficos que deixaram de fazer parte da apresentação solicitada.

Este documento descreve as mudanças mais recentes no painel de cidades, seus critérios de cálculo e as verificações realizadas.

## Gráficos removidos

Foram retirados da interface os seguintes gráficos:

- **Série histórica**, apresentado como “Evolução das ocorrências”.
- **Comparação objetiva**, apresentado como “Ocorrências por cidade”.
- **Prioridade declarada**, apresentado como “Distribuição por gravidade”.
- **Ocorrências por status**, removido na solicitação seguinte.

O gráfico **Ocorrências por categoria** permanece e ocupa a largura disponível da área de gráficos. Os cartões de resumo e os filtros de status e gravidade continuam disponíveis. Remover o gráfico de status não remove esses controles nem os dados das ocorrências.

A proposta de distribuição por zonas foi cancelada e não integra a implementação final.

## Regras de exibição

As seções usam os filtros efetivamente aplicados na consulta. Alterar um campo do formulário, antes de aplicar os filtros, não troca a seção para uma visão que não corresponde aos dados carregados.

| Seleção aplicada | Comparação dos estados | Comparação das cidades | Ocorrências recentes |
| --- | --- | --- | --- |
| Nenhum estado nem cidade | Aparece | Não aparece | Não aparecem |
| Estado, sem cidade | Não aparece | Aparece | Não aparecem |
| Estado e cidade | Não aparece | Aparece | Aparecem |

Ao selecionar uma cidade, o painel identifica seu estado. Ao mudar ou limpar o estado, a cidade e o bairro selecionados são limpos para evitar combinações incompatíveis.

A tabela de cidades respeita todos os filtros aplicados. Portanto, quando uma cidade específica também é selecionada, a tabela pode mostrar apenas essa cidade.

## Comparação percentual e ranking dos estados

Sem estado selecionado, o painel apresenta a seção **Comparação em porcentagem**, com uma linha por estado que possui ocorrências no recorte consultado. Cada linha informa:

- Quantidade de ocorrências criadas.
- Participação do estado no total de ocorrências criadas.
- Quantidade de ocorrências atualmente resolvidas.
- Participação do estado no total de ocorrências resolvidas.
- Taxa de resolução do próprio estado.

O servidor soma os registros das cidades de cada estado antes de calcular os percentuais. O ranking considera a proporção de resolvidas em relação às criadas, permitindo comparar estados com quantidades diferentes de registros.

### Fórmulas utilizadas

**Taxa de resolução do estado** = ocorrências resolvidas no estado ÷ ocorrências criadas no estado × 100.

**Participação nas criadas** = ocorrências criadas no estado ÷ total de ocorrências criadas no recorte × 100.

**Participação nas resolvidas** = ocorrências resolvidas no estado ÷ total de ocorrências resolvidas no recorte × 100.

O ranking é ordenado pela taxa de resolução, da maior para a menor. Em caso de empate, vem primeiro o estado com mais ocorrências criadas; persistindo o empate, a sigla do estado define a ordem. A ordenação usa a proporção antes do arredondamento exibido.

Os percentuais são exibidos com até uma casa decimal. Quando não há ocorrências resolvidas, a participação nas resolvidas é zero, evitando divisão por zero.

### Exemplo ilustrativo

| Estado | Criadas | Resolvidas | Taxa de resolução | Posição |
| --- | ---: | ---: | ---: | ---: |
| RJ | 10 | 8 | 80% | 1 |
| SP | 100 | 20 | 20% | 2 |

Neste exemplo, o RJ aparece primeiro porque resolveu uma proporção maior das ocorrências, mesmo tendo menos registros. Os números são ilustrativos e não representam dados reais da plataforma.

O cálculo usa o status atual **RESOLVIDA**. Ocorrências contestadas ou reabertas não entram nessa contagem. Os números respeitam o período e os demais filtros aplicados, além das regras existentes de visibilidade dos registros públicos e exclusão de repostagens.

O ranking descreve registros da plataforma e não constitui uma avaliação da qualidade urbana dos estados. Selecionar um estado no ranking abre seu recorte no painel.

## Carregamento dos dados

A lista de ocorrências recentes só é consultada no servidor quando existe uma cidade selecionada. Ao retornar à visão de estados ou cidades sem uma cidade específica, os dados dessa lista são limpos.

Quando uma nova consulta do painel começa, a assinatura da consulta anterior é cancelada. Esse ajuste evita que uma resposta antiga substitua os resultados dos filtros mais recentes.

## Arquivos principais alterados

No cliente, dentro de `spectrum-client`:

- `src/app/features/city-dashboard/city-dashboard-page/city-dashboard-page.html`: remoção dos gráficos e condições de exibição das seções.
- `src/app/features/city-dashboard/city-dashboard-page/city-dashboard-page.ts`: filtros aplicados, navegação entre recortes e carregamento condicionado à cidade.
- `src/app/features/city-dashboard/city-dashboard-page/city-dashboard-page.scss`: apresentação responsiva do ranking e das barras percentuais.
- `src/app/core/services/city-dashboard/city-dashboard.service.ts`: definição dos dados de comparação dos estados.
- `src/app/features/city-dashboard/city-dashboard-page/city-dashboard-page.spec.ts`: testes das visões geográficas e das consultas de ocorrências recentes.

No servidor, dentro de `spectrum-server`:

- `src/core/city-dashboard/city-dashboard.service.ts`: agrupamento dos totais por estado, cálculo dos percentuais e ordenação do ranking.
- `src/core/city-dashboard/city-dashboard.types.ts`: inclusão da comparação dos estados na resposta do painel.
- `src/core/city-dashboard/city-dashboard.service.spec.ts`: testes do agrupamento, ranking e casos sem resoluções.

## Validação e situação da entrega

Na reorganização do painel, passaram quatro testes do servidor e dois testes do cliente. Eles verificaram os percentuais, a ordem do ranking, o tratamento de ausência de resoluções e a exibição das seções conforme estado e cidade.

A compilação do servidor passou. O cliente foi compilado com a incorporação de fontes externas desativada para a validação, pois o download das fontes do Google falhou por um erro de certificado. Essa opção foi usada no comando de verificação e não foi adicionada como alteração permanente à configuração do projeto.

Após a remoção final do gráfico de status, a checagem do TypeScript do cliente passou e a verificação de espaços do diff não apontou problemas. Os seis testes do painel não foram repetidos depois dessa última remoção.

As alterações estão nos arquivos locais. Nesta tarefa, não foram feitos commit nem publicação do cliente ou do servidor. O novo ranking depende da atualização das duas partes, pois o servidor passou a fornecer os dados de comparação dos estados.
