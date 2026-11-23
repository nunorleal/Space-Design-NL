# SpacePlan 3D

PWA local-first em português europeu para desenhar plantas com medidas exatas e consultá-las em 3D. Esta versão entrega as fases 0 a 6. Abre inicialmente com uma garagem de **5,00 × 3,00 × 2,50 m**, com **15,00 m²** de área útil e **16,00 m** de perímetro.

## Executar no Mac

Use Node.js 20.19 ou posterior na série 20, ou Node.js 22.12 ou posterior, com npm.

```sh
npm install
npm run dev
```

Abra o endereço apresentado pelo Vite. Para experimentar a instalação e o modo offline, use a compilação de produção.

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

1. Abra `http://127.0.0.1:4173` em Safari ou Chrome. Confirme as medidas da garagem em **Propriedades**.
2. Em **Novo**, crie um projeto. Use **Retângulo** e arraste na planta, ou clique na planta e introduza três medidas. O botão **Nova divisão** abre diretamente o formulário.
3. Escolha **Polígono** para criar uma divisão em L. Pode introduzir os pontos no painel de propriedades, por exemplo `[0, 0], [5, 0], [5, 2], [3, 2], [3, 4], [0, 4]`, e clicar em **Fechar divisão**. Confirme os **16,00 m²**.
4. Escolha um vértice, arraste-o ou introduza as coordenadas no painel. Selecione uma parede para alterar o comprimento ou a espessura. **Dividir parede** insere um vértice no ponto escolhido da parede. **Medir** calcula a distância entre dois pontos.
5. Experimente **Desfazer** e **Refazer**. Aguarde por **Guardado no dispositivo** e recarregue. Para validar o modo offline, carregue primeiro a app online, desligue a ligação de rede ou pare o servidor e recarregue no mesmo endereço.
6. No Safari, use **Ficheiro → Adicionar à Dock** para experimentar a janela de app. Depois de a abrir e de deixar carregar a instalação, repita o teste offline nessa janela. [Instruções da Apple para Mac](https://support.apple.com/pt-pt/104996)

## Publicar no GitHub Pages

1. Envie o repositório para o GitHub com o ramo principal chamado `main`. No GitHub Free, use um repositório público. [Disponibilidade do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
2. No repositório, abra **Settings → Pages** e escolha **GitHub Actions** em **Build and deployment → Source**. [Configurar a publicação](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
3. Abra **Actions → Publicar no GitHub Pages → Run workflow** para a primeira publicação. As alterações enviadas para `main` voltam a compilar e publicar a app. O endereço da publicação aparece em **Settings → Pages**, por exemplo `https://utilizador.github.io/spaceplan-3d/`.
4. Abra o endereço publicado uma vez com ligação à Internet para preparar o modo offline. Para levar uma garagem do endereço local para o endereço publicado, faça **Exportar → Exportar ZIP do projeto** na app local e **Importar** no novo endereço. O site público serve a app. Os projetos ficam guardados no navegador de cada pessoa.

## Validar a vista 3D

1. Abra a garagem e escolha **Vista dividida**. Altere a largura em **Propriedades** e confirme que o pavimento, as paredes e as dimensões indicadas na vista 3D acompanham a planta. Experimente também com uma divisão em L.
2. Escolha um modo em **Câmara 3D**. **Órbita** permite rodar em perspetiva. **Isométrica** e **Superior** usam projeção ortográfica. **Ao nível dos olhos** começa dentro da divisão selecionada. Use a roda ou a pinça para ampliar e os botões para ampliar, afastar ou reenquadrar.
3. Selecione uma parede na planta. Em **Adicionar abertura**, crie uma porta com **0,80 × 2,10 m** e uma janela com peitoril ajustável. Defina posições diferentes. Escolha **Todas as paredes** para ver os dois recortes e selecione o símbolo na planta ou a moldura visível em 3D para editar as medidas.
4. Abra **Adicionar objeto** e escolha, por exemplo, a **Estante**. O objeto aparece nas duas vistas. Ajuste posições, elevação, rotação e dimensões em **Propriedades**. Pode adicionar outra instância com medidas próprias.
5. Em **Materiais da divisão**, experimente trocar o revestimento do pavimento. Selecione uma parede para trocar a tinta dessa parede. Em **Opções 3D**, alterne o teto e as sombras.

## Validar o posicionamento

1. Abra a garagem e selecione **Adicionar objeto → Estante**. Em **Propriedades**, confirme **0,90 × 0,40 × 1,80 m**. Na secção **Encaixe**, escreva **0,12 m** em **Folga à parede**. Na garagem vazia a estante fica com a posição Z de **0,32 m**. Aguarde por **Guardado no dispositivo**, recarregue e selecione a estante na lista para rever as medidas.
2. Em **Vista dividida**, arraste o objeto na planta para pré-visualizar o movimento em 3D. A pega circular na planta roda o objeto. Em 3D, ative **Mover em 3D** ou **Rodar em 3D** e arraste o eixo ou anel. Os campos em **Posição local** continuam disponíveis para medidas exatas.
3. Para selecionar vários objetos da mesma divisão, prima **Shift** ao selecionar ou ative **Selecionar vários objetos** junto ao título **Objetos**. Nas ações de seleção, experimente alinhar, distribuir pelo espaço entre objetos e agrupar. Um grupo mantém as posições relativas durante o movimento. Pode copiar e colar dentro da app, duplicar, bloquear ou ocultar.
4. Adicione uma caixa e coloque-a sobre a estante usando as coordenadas. Confirme o aviso de colisão. Pode assinalar **Permitir sobreposição** no objeto ou alterar a elevação. Desloque o objeto para fora do perímetro para verificar o aviso independente de saída da divisão. Ajuste o limiar em **Grelha e unidades → Folga mínima para avisos**.
5. Na biblioteca, use a pesquisa, as categorias e os favoritos. **Novo modelo de caixa** permite guardar um paralelepípedo reutilizável com medidas próprias. **Gerir modelo** permite duplicar um modelo e renomear ou eliminar modelos personalizados. A eliminação fica indisponível enquanto existir uma instância do modelo.
6. Para testar o espaço na garagem, escolha **Adicionar objeto → Veículos**. O **Carro** e a **Mota** têm formas simplificadas. Pode editar as três medidas em **Propriedades**. Para estes veículos, **Profundidade do objeto** indica o comprimento de uma ponta à outra.

## Validar a importação 3D

1. Na garagem, abra **Importar GLB/GLTF** no painel de divisões ou na biblioteca. Para um **GLB**, escolha o ficheiro único. Para **GLTF**, selecione o manifesto e os recursos juntos. Se houver subpastas, escolha a pasta ou compacte o conteúdo num ZIP que preserve os caminhos relativos.
2. Confira a pré-visualização e as três medidas. O glTF usa normalmente metros e +Y para cima. Se o ficheiro foi modelado em centímetros ou noutro eixo, escolha a **Unidade original** e a **Orientação do modelo** correspondentes. A rotação em planta e o fator adicional permitem corrigir o modelo antes de guardar.
3. Deixe **Colocar na divisão** selecionado para inserir já o modelo. Na biblioteca, procure o mesmo modelo na categoria **Importados** para reutilizar o original. A escala uniforme é a predefinição de cada instância. **Por eixo** permite escalar X, Y e Z separadamente e altera as proporções.
4. Aguarde por **Guardado no dispositivo** e reabra o projeto. Confirme a textura e as medidas. Depois de a PWA ter carregado a cache de produção, pode abrir e importar modelos locais em modo offline.
5. Em **Definições**, ajuste o limite de importação, a qualidade da vista 3D e o número de objetos renderizados. Em **Opções 3D**, pode alternar as sombras e os reflexos de estúdio.

## Validar a partilha e a recuperação

1. Importe um modelo com recursos e escolha **Exportar → Exportar ZIP do projeto**. O ficheiro `.spaceplan.zip` inclui o manifesto, os modelos e as texturas. Envie-o pelo método que preferir ou guarde-o em Ficheiros.
2. Noutro navegador ou dispositivo, abra a app e escolha **Importar**. A validação confirma a versão do manifesto, os caminhos, os tipos e o tamanho dos recursos antes de guardar uma cópia com um novo identificador. O limite do pacote é 200 MB, incluindo o conteúdo extraído, com até 511 recursos. A exportação JSON continua disponível para projetos sem ficheiros externos.
3. Na **Vista dividida**, abra **Exportar** e escolha a planta ou a vista 3D em PNG. As imagens correspondem ao enquadramento atual. O PNG 2D inclui grelha, geometria e cotas visíveis. O PNG 3D usa o enquadramento e as opções gráficas atuais.
4. Abra **Abrir projeto → Gerir projeto** para recuperar a versão anterior guardada. A recuperação pede confirmação e mantém a última gravação disponível. A eliminação do projeto e da versão anterior também pede confirmação.
5. Abra **Definições → Armazenamento local** para consultar a estimativa de utilização, pedir persistência ao navegador ou libertar ficheiros sem referências após confirmação.

## Usar o teclado

- Prima **Tab** para percorrer os controlos. Use **Escape** para fechar um diálogo ou painel e retomar a navegação no controlo que o abriu.
- Com o foco na planta, as **setas** deslocam a vista ou os objetos selecionados. **Shift + seta** desloca os objetos dez passos. **+** e **−** mudam o zoom e **0** reenquadra a planta.
- Escolha **Medir → Medir por coordenadas** em **Propriedades**. Introduza as coordenadas X e Z de cada ponto no referencial da planta e prima **Calcular distância**.
- **1**, **2** e **3** alternam entre planta, 3D e vista dividida. **?** abre a ajuda. Pode desativar estes atalhos e os atalhos de ferramentas em **Definições → Atalhos de uma tecla**.
- **⌘ Z** e **⇧ ⌘ Z** desfazem e refazem. **⌘ C**, **⌘ V** e **⌘ D** copiam, colam e duplicam objetos. **⌘ S** guarda. Use **Ctrl** no lugar de **⌘** nos restantes teclados.

## Validar no iPad

1. Com o Mac e o iPad na mesma rede, execute `npm run preview -- --host 0.0.0.0` após o build. Abra no Safari do iPad o endereço **Network** apresentado pelo Vite, com o IP do Mac.
2. Rode o iPad e confirme que consegue abrir **Divisões** e **Propriedades**. Toque numa parede ou num vértice, ajuste uma medida por teclado e arraste um vértice com um dedo ou com o Apple Pencil. Experimente mover e ampliar com dois dedos. Em **Vista 3D**, rode com um dedo e aproxime com uma pinça ou com os botões.
3. Para validar a instalação e o modo offline no iPad, sirva a compilação via **HTTPS com um certificado que o iPad considere válido**. Também pode usar um servidor HTTPS na rede local. Se já tiver o certificado e a chave para o endereço LAN, pode fornecê-los ao Vite assim. [Requisitos do service worker](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker)

```sh
SPACEPLAN_TLS_CERT=/caminho/certificado.pem SPACEPLAN_TLS_KEY=/caminho/chave.pem \
  npm run preview -- --host 0.0.0.0
```

4. No Safari, use **Partilhar → Adicionar ao ecrã principal** e ative **Abrir como aplicação web**, quando disponível. Abra a app instalada uma primeira vez online, faça uma alteração, confirme a gravação, ative o modo de voo e reabra a app. [Instruções da Apple para iPad](https://support.apple.com/pt-pt/guide/ipad/ipad8f1f7a29/27/ipados/27)
5. Para transferir um projeto entre dispositivos, use **Exportar ZIP do projeto** no primeiro e **Importar** no segundo. Pode usar JSON para um projeto sem modelos externos.

## Verificações

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium webkit
npm run test:e2e
```

A suite de navegador usa o build de produção e cobre criação e edição, seleção, arrasto, undo/redo, medição, transferência JSON, alterações renderizadas em 3D, aberturas, posicionamento e grupos, persistência da folga exata, catálogo, importação de modelos com texturas, transferência de um projeto ZIP para outro perfil offline, exportação PNG e recuperação de gravações. Também verifica navegação por teclado, foco dos diálogos e painéis, regras automáticas WCAG com axe, pinça e eventos de caneta simulados. A instalação no ecrã principal, os gestos físicos, o Apple Pencil e o desempenho sustentado requerem um iPad real.

## Decisões e limites

- A geometria é guardada em metros, com X/Z no pavimento e Y reservado para a altura. Cada divisão tem uma origem mundial e vértices locais. As cotas referem-se ao contorno interior. A espessura é desenhada para o exterior e os encontros de paredes em ângulos são representações 2D.
- As paredes acompanham o polígono. Alterar um comprimento move o vértice final da parede e ajusta a parede adjacente. Alterar a largura ou profundidade redimensiona a extensão completa da divisão nesse eixo. A validação rejeita polígonos cruzados, sobreposições de arestas e áreas degeneradas.
- O encaixe aplica-se ao desenho com ponteiro. Os campos numéricos aceitam vírgula ou ponto decimal e preservam a medida introduzida. O histórico mantém até 100 operações por sessão. Um arrasto completo conta como uma operação.
- A gravação usa IndexedDB com atraso de 420 ms. Um registo suplementar, quando o navegador permite, recupera alterações pendentes após um fecho inesperado. Cada navegador, perfil e endereço tem armazenamento próprio. Limpar os dados do site pode apagar projetos e a cache offline. As gravações mais antigas são recusadas quando já existe uma versão mais recente. Um separador antigo não restaura automaticamente um projeto eliminado. A app não combina alterações concorrentes entre separadores.
- A vista 3D usa Three.js, React Three Fiber e Drei. O módulo é carregado quando se abre uma vista com 3D e é incluído na cache de produção. Requer WebGL 2. A planta continua disponível perante uma falha gráfica.
- Portas, janelas e vãos são recortes ao longo de toda a espessura. Portas e janelas têm molduras simples junto às faces, com o vão aberto. O pavimento e o teto seguem a planta, incluindo polígonos côncavos. O catálogo inicial usa geometrias paramétricas e materiais de cor simples.
- A colisão usa caixas delimitadoras orientadas em 3D e testa os seus eixos separadores. O contacto entre caixas não conta como interseção. As paredes são testadas pelos seus segmentos sólidos, incluindo os recortes. A colisão é um aviso e a opção de sobreposição intencional aplica-se aos pares que envolvem esse objeto. A geometria detalhada do mobiliário pode deixar espaços vazios dentro da caixa delimitadora.
- As cotas em planta são medidas entre as projeções no pavimento. Para objetos inclinados, a proximidade entre volumes combina a distância das projeções e a separação vertical como estimativa conservadora. O encaixe por arrasto usa a grelha e referências da divisão e de outros objetos em planta. O manipulador 3D usa a grelha e o chão. Mudar a referência de um objeto preserva a posição da sua geometria.
- A biblioteca de modelos personalizados e os favoritos são guardados no projeto local. A importação lê glTF 2.0 com texturas PNG, JPEG ou WebP, incluindo GLB, GLTF com recursos soltos e ZIP de modelo. O limite inicial é 30 MB e também se aplica ao conteúdo extraído. Cada textura está limitada a 4096 × 4096 píxeis, com 24 megapíxeis no total, além dos limites de geometria descodificada.
- Os ficheiros originais ficam no IndexedDB, separados do projeto. Instâncias reutilizam geometria, materiais e texturas na mesma sessão e têm escala e posição próprias. A caixa delimitadora é medida após as correções de unidade e orientação. Uma espessura mínima de 1 mm permite posicionar modelos planos.
- A vista importa materiais e texturas glTF e usa a pose inicial do modelo. As câmaras e luzes do ficheiro são substituídas pela iluminação da app. Draco e texturas Basis/KTX2 exigem reexportação. A iluminação de estúdio é gerada localmente, sem descarregar mapas de ambiente.
- A qualidade automática reduz a resolução durante a navegação. Em aparelhos com ponteiro de toque, começa com sombras e reflexos desligados. Os perfis alteram os limites de pixel ratio e de resolução das sombras. Se for atingido o limite de objetos, a vista 3D indica a omissão e a planta conserva todos os objetos.
- O ZIP de modelo pertence à biblioteca. O ZIP de projeto é versionado e contém todos os dados e recursos referenciados. A gravação da cópia importada e dos seus binários é uma transação única. Projetos com dados ilegíveis são mantidos, e a app tenta abrir a versão anterior quando existe.
- A limpeza de armazenamento preserva ficheiros referenciados por projetos, versões guardadas, registos pendentes e pelo histórico e área de transferência da sessão. Ficheiros escritos recentemente são preservados durante 24 horas. A estimativa de quota e a concessão de persistência dependem do navegador.
- Durante o arrasto na planta, a app agrupa as pré-visualizações por fotograma. Reutiliza os diagnósticos de colisão e folga das divisões que conservam a mesma geometria e os mesmos objetos.
