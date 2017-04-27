## ml.js: Framework para Aprendizado de Máquina com JavaScript

**Resumo**

Aprendizagem de máquina possui técnicas que permite o desenvolvimento de sistemas computacionais que aprendem de forma automática a partir de dados passados. Com a constante evolução da tecnologia, o uso dessas técnicas está cada vez mais comum e muitas vezes passam despercebidas. As mais diversas áreas estão usando aprendizagem de máquina no intuito de melhorar seus resultados. Este trabalho objetiva o desenvolvimento de uma ferramenta que possa ser utilizada para a aplicação de técnicas de aprendizado de máquina de forma simples por meio de um navegador Web através da linguagem de programação JavaScript. O presente texto apresenta conceitos sobre aprendizagem de máquina, descreve as ferramentas e processo de desenvolvimento do framework ml.js, uma breve discussão sobre Open data, descreve os experimentos e resultados obtidos neste trabalho.

Texto completo [aqui](https://www.dropbox.com/s/2f1uap2pfwonqb6/Fernando_TCC_MLJS_DCOMP_UFS.pdf?dl=0)

Trabalho de Conclusão de Curso

José Fernando Santana Andrade

Orientador: Prof. Dr. Hendrik Teixeira Macedo

São Cristóvão – Sergipe - 2016

___

### Instalação

``` html
<script src="/src/utils.js"></script>
<script src="/src/dataSet.js"></script>
<script src="/src/plot.js"></script>
<script src="/src/confusionMatrix.js"></script>
<script src="/src/ml.models.js"></script>
```
### Algoritmos
```javascript
// agrupamento
modelDBSCAN = new DBSCAN();
clusters = modelDBSCAN.buildClusterer(options)

modelKmeans = new Kmeans (options);
clusters = modelKmeans.buildClusterer(options)

// classificação
modelkNN = new kNN(options);
confusionMatrix = modelkNN.buildClassifier(options);
classification = modelkNN.classify(newExample);

modelID3 = new ID3();
confusionMatrix = modelID3.buildClassifier(options);
tree = modelID3.getTree();
classification = modelID3.classify(newExample);

// regressão
modelGradientDescent = new linearRegressionGradientDescent();
modelGradientDescent.train(options);
prediction = modelGradientDescent.predict(newExamples);
```
#### Arquivo e gráficos
``` javascript
// leitura de arquivo
myDataset = new DataSet();
myDataset.loadFile({
	"loadend": function() {
		console.log('Arquivo carregado: ', myDataset.file.name);
		console.log('Tamanho: ', myDataset.file.extra.prettySize);
	}
});

// plotando gráficos
plotDataSet = new plot({
	"containerPlot": "container-mydataset",
	"title": "Dataset: My Dataset"
}).plot2D(
	myDataset.data,
	{"label": "Axis x"},
	{"label": "Axis y"}
);

```