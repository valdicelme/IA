/**
 * Classe que implementa o DBSCAN
 */
function DBSCAN () {
    var self = this;
    // valores baseados no WEKA
    self.eps = 0.9;
    self.minPts = 6;
    self.clusters = [];
    self.labels = [];
    self.distance = utils.getDistanceFunction();
}

// Extendendo à classe Clusterer
DBSCAN.prototype = new Clusterer();

/**
 * Método que executa o agrupamento
 * @param  {Object} options - Objeto com as opções na forma:
 * {
 *     eps: {number} Valor do raio
 *     minPts: {number} Número mínimo do pontos
 *     data: {Array} Conjunto de dados
 *     distance: {Function} Função de para calcular a distância entre os
 *     objetos do conjunto de dados
 * }
 * @return {Object}         Clusters resultantes
 */
DBSCAN.prototype.buildClusterer = function(options){
    var self = this;
    var settings = options || {};
    self.eps = +settings['eps'] || 0.9;
    self.minPts = +settings['minPts'] || 6;
    self.clusters = [];
    self.labels = [];
    self.data = self._formatDataset(settings['data']);
    self.distance = utils.getDistanceFunction(settings['distance']);
    var originalData = utils.clone(self.data);

    for(var i = 0, l = self.data.length; i < l; i++){
        if(self.labels[i] === undefined){
            self.labels[i] = 0;
            var neighbors = self.getNeighbors(i);
            var number_neighbors = neighbors.length;
            if(number_neighbors < self.minPts){
                self.labels[i] = 0; //noise
            }else {
                self.clusters.push([]);
                var cluster_idx = self.clusters.length;
                self.expandCluster(i, neighbors, cluster_idx);
            }
        }
    }

    for (var i = 0, l = self.data.length; i < l; i++) {
        var idxCluster = self.labels[i] == 0 ? -1 : self.labels[i];
        originalData[i].cluster = idxCluster;
    }

    self.clusters = originalData;
    return {clusters: originalData};
}

/**
 * Método que agrupa os pontos de forma recursiva
 * @param  {number} point_idx   - Índice do ponto atual
 * @param  {Array} neighbors   - Array com os pontos da vizinhos
 * @param  {number} cluster_idx - Índece do novo cluster
 * @return {void}             Atualiza as variáveis internas
 */
DBSCAN.prototype.expandCluster = function(point_idx, neighbors, cluster_idx) {

    var self = this;
    var minPts = self.minPts;
    //adiciona o ponto ao cluster
    self.clusters[cluster_idx - 1].push(point_idx);
    self.labels[point_idx] = cluster_idx;

    for(var i = 0, nl = neighbors.length; i < nl; i++){
        var current_point_idx = neighbors[i];
        if(self.labels[current_point_idx] === undefined){
            self.labels[current_point_idx] = 0; //marca com visitado e noise
            var current_neighbor = self.getNeighbors(current_point_idx);
            var current_number_neighbor = current_neighbor.length;
            if(current_number_neighbor >= minPts){
                self.expandCluster(current_point_idx, current_neighbor,
                    cluster_idx);
            }
        }
        if(self.labels[current_point_idx] < 1){
            self.labels[current_point_idx] = cluster_idx;
            self.clusters[cluster_idx - 1].push(current_point_idx);
        }
    }
}

/**
 * Método para retornar os vizinhos de um ponto
 * @param  {number} point_idx - Índice do ponto no conjunto de dados
 * @return {Array}           Array com pontos vizinhos
 */
DBSCAN.prototype.getNeighbors = function(point_idx) {
    var neighbors = [];
    var self = this;

    var instance = self.data[point_idx].attributes;

    for (var i = 0, length = self.data.length; i < length; i++) {
        if (self.distance(instance, self.data[i].attributes) <= self.eps)
            neighbors.push(i);
    };

    return neighbors;
};


/**
 * Implementação original de Fernando Simeone e Isaías Alves Ferreira
 * Disponível em: <https://github.com/fernandosimeone/id3>
 * Modificado por José Fernando Santana Andrade
 */

/**
 * Classe que implementa o algoritmo ID3.
 * @param {array} data       dataset de treinamento
 * @param {string} targetAttr classe
 */
var ID3 = function (data, targetAttr) {
    var self = this;

    self.language = 'pt';
    self.entropy = [];
    self.tree = [];
};

/**
 * Método executa o ID3
 * @param  {Object} options - Objecto com as opções para a construção da árvore
 * {
 *     data: {Array} Conjunto de dados
 *     targetAttribute: {Number} Índice o atributo que representa a classe,
 *         valor padrão é a ultima coluna
 *     attributesNames: {Array} Nomes dos atributos presentes no conjunto de
 *         dados
 *     test: {Array} - Opcional, array com o conjunto de dados de teste, se
 *         omitido utiliza holdout para dividir o conjunto de dados
 *     percentSplit: Porcentagem do conjunto de dados a ser usada como
 *         base de treinamento, valor padrão é 2/3
 *
 * }
 * @return {object}         instância de ConfusionMatrix
 */
ID3.prototype.buildClassifier = function(options) {
    var self = this;
    var trainData, testData;
    var copyDataset = utils.clone(options['data']);
    var odata = utils.holdout(copyDataset, options['percentSplit']);
        trainData = odata.train;
        testData = odata.test;

    if (options['test'] !== undefined) {
        trainData = utils.clone(copyDataset);
        testData = utils.clone(options['test']);
    }

    var attrNames = options['attributesNames'];

    // precisa do nome dos atributos na posição 0 do dataset
    trainData.splice(0, 0, attrNames);

    var dataset = new Data2ID3(trainData);

    self.targetAttr = options['targetAttribute'] ||
        dataset.attributes[dataset.attributes.length - 1];

    self.data = dataset;
    self.root = {
        dados: dataset
    };

    self._buildClassifier();
    self.getTree();


    var classifieds = [];
    var label = self.targetAttr.name;
    var attributes = self.data.attributes;

    self.frequency = utils.getFrequency(self.data.instances,
        self.targetAttr.collumn);
    var frequencyDataset = self.frequency;
    var labels = Object.keys(self.frequency).sort();
    self.ConfusionMatrix = new ConfusionMatrix(labels);
    self.ConfusionMatrix.setLanguage(self['language'] || 'pt');
    var unClassified = 0;
    for (var i = 0, l = testData.length; i < l; i++) {
        var newInstance = self.createInstance(testData[i]);
        var classified = self.classify(newInstance);

        if (classified == null) {
            unClassified++;
            continue;
        }
        if (! self.ConfusionMatrix.matrix[newInstance[label]]){
            self.ConfusionMatrix.matrix[newInstance[label]] = new Object();
        }
        if (! self.ConfusionMatrix.matrix[newInstance[label]][classified]) {
            self.ConfusionMatrix.matrix[newInstance[label]][classified] = 0;
        }

        self.ConfusionMatrix.matrix[newInstance[label]][classified] += 1;
    }

    self.ConfusionMatrix.unClassified = unClassified;
    //frequencia dos exemplos de teste
    var frequencyTest = utils.getFrequency(testData,
        self.targetAttr.collumn);
    self.ConfusionMatrix.frequency = utils.completeFrequency(frequencyTest,
        frequencyDataset);

    return self.ConfusionMatrix.calculate();
}

/**
 * Método para criar instâncias no formato que o algoritmo possa classificar
 * @param  {array} inst atributos da nova instância
 * @return {object}      nova instância a ser classificada
 */
ID3.prototype.createInstance = function (inst) {

    var self = this;
    var attributes = self.data.attributes;
    var instance = new Object();
    var normalInst = inst.map(function(el){
        return utils.fixedValue(el);
    });
    for (var t = 0, u = attributes.length; t < u; t++) {
        instance[attributes[t].name] = normalInst[attributes[t].collumn];
    }

    return instance;
}

/**
 * Método que executa o algoritmo
 * @param  {Object} nodo - nó raiz
 */
ID3.prototype._buildClassifier = function(nodo) {
    var self = this;
    nodo = nodo || self.root;

    // Se todos os registros possuem mesma classificacao ou e restou apenas o
    // atributo alvo.
    if (nodo.dados.allSameValue(self.targetAttr) ||
        nodo.dados.attributes.length == 1) {

        nodo.leaf = true;
        nodo.classe = nodo.dados.getAttributeValue(0, self.targetAttr);
        nodo.name = nodo.classe;

    } else {

        nodo.children = [];
        nodo.atributo = self.getAttrHigherGain(nodo);
        nodo.name = nodo.atributo.name;
        var partitions = nodo.dados.partition(nodo.atributo);

        for (var valor in partitions) {
            var child = {
                parent: nodo,
                dados: partitions[valor],
                valorClassificacao: valor
            };

            nodo.children.push(child);
            self._buildClassifier(child);
        }
    }
}

/**
 * Busca atributo com maior ganho.
 * Ganho do atributo = entropia total - entropia do atributo.
 * @param  {Object} nodo - Nó da árvore
 * @return {Object}      Melhor atributo
 */
ID3.prototype.getAttrHigherGain = function(nodo) {
    var self = this;
    var totalEntropy = self.calcEntropy(nodo.dados);
    var attributes = nodo.dados.attributes;
    var bestAttribute, bestGain = -1;

    for (var i = 0, l = attributes.length; i < l; i++) {
        // Desconsiderando atributo alvo
        if (attributes[i].collumn == self.targetAttr.collumn)
            continue;
        var attributeGain = totalEntropy -
                self.calcEntropyAttr(nodo.dados, attributes[i]);
        // se o ganho do atributo for maior
        if (! bestAttribute || attributeGain > bestGain) {

            bestAttribute = attributes[i];
            bestGain = attributeGain;
        }
    }
    // self.bestAttribute.push(bestAttribute);
    return bestAttribute;
};
/**
 * Método que calcula a entropia para os dados passados
 * @param  {object} data     - Conjunto de dados
 * @param  {object} instances - Instâncias consideradas para calcular a entropia
 * @return {float}           Valor da entropia total
 */
ID3.prototype.calcEntropy = function(data, instances) {
    var self = this;
    instances = instances || data.instances;
    var frequencies = data.getFrequencyByAttrValue(self.targetAttr, instances);
    var total = instances.length;
    var sum = 0;

    for (var attrValue in frequencies) {
        var proportion = frequencies[attrValue] / total;
        sum += (-1) * (proportion) * ( Math.log(proportion) / Math.log(2) );
    }

    return sum;
};

/**
 * Método que calcula a entropia do atributo passado
 * @param  {object} data    - Conjuto de dados
 * @param  {object} atributo - Atributo para calcular a entropia
 * @return {float}          Valor da entropia do atributo
 */
ID3.prototype.calcEntropyAttr = function(data, attribute) {
    var self = this;
    var regByValue = data.getInstancesByAttrValue(attribute);
    var sum = 0;
    var total = data.instances.length;

    for (var value in regByValue) {
        var entropy = self.calcEntropy(data, regByValue[value]);
        var proportion = regByValue[value].length / total;
        sum += entropy * proportion;
    }

    return sum;
};

/**
 * Método que classifica um exemplo passado
 * @param  {Object} instance - Instância a ser classificada
 * @return {String}          O valor da classificação
 */
ID3.prototype.classify = function (instance) {
    var self = this;
    var label = null;
    var found = false;
    var treeRoot = self.tree[0];
    var node = treeRoot.name;

    traverse(treeRoot, node, instance);

    function traverse(treeRoot, node, instance) {
        // no folha
        if (treeRoot.color) {
            found = true;
            label = treeRoot.name;
            return label;
        }

        if (treeRoot.children) {
            for (var i = 0, lc = treeRoot.children.length; i < lc; i++) {
                var child = treeRoot.children[i];
                var value = child.rule;
                if (instance[node] === value && ! found) {
                    traverse(child, child.name, instance);
                }
            }
        }

        return treeRoot.name;
    }

    // console.log('label ' , label);
    return label;
}

/**
 * Método que retorna um objeto com a estrutura da árvore gerada
 * @return {Object} Estrutura da árvore
 */
ID3.prototype.getTree = function () {
    var self = this;
    self.nodoCount = 0;
    self._treeLayout(self.root);

    return self.tree;
};

/**
 * Método responsável por montar a estrutura da árvore
 * @param  {Object} nodo - Nó raiz da árvore
 * @return {Object}      Estrutura da árvore
 */
ID3.prototype._treeLayout = function(nodo) {
    var parentNodo = this._getNodoDataTree(nodo);
    this.nodoCount++;

    if (! nodo.parent) {
        this.tree.push(parentNodo);
    }

    if (nodo.children) {
        for (var i = 0, lf = nodo.children.length; i < lf; i++) {

            var childNodo = this._treeLayout(nodo.children[i]);
            parentNodo.children.push(childNodo);
        }
    }

    return parentNodo;
};

/**
 * Método para preencher informações dos nós da árvore, por exemplo cor, tipo,
 * formatar a regra.
 * @param  {Object} nodo - Nó corrente
 * @return {Object}      Nó preenchido com as informações
 */
ID3.prototype._getNodoDataTree = function(nodo) {

    if (! nodo.parent) { // Nodo raiz
        return {
            'parent': "null",
            'name':nodo.name,
            'children': []
        };

    } else if (nodo.leaf) {

        return {
            'color': "green",
            'parent': nodo.parent.name,
            'name':nodo.name,
            'rule': utils.fixedValue(nodo.valorClassificacao)
        };

    } else {

        return {
            'parent': nodo.parent.name,
            'name':nodo.name,
            'rule': utils.fixedValue(nodo.valorClassificacao),
            'children': [],
        };
    }
};

/**
 * Classe responsável por manipular os dados para o algoritmo ID3
 */
function Data2ID3() {
    var self = this;
    self.instances = [];
    self.attributes = [];

    if (arguments.length === 2) {
        var attributes = arguments[0];
        self.instances = arguments[1] || [];

        if (attributes) {
            for (var i = 0, m = attributes.length; i < m; i++)
                self.attributes.push(attributes[i]);
        }

    } else if (arguments.length === 1) {
        var data = arguments[0];
        var attrNames = data[0];

        for (var i = 0, j = attrNames.length; i < j; i++) {
            self.attributes.push({
                name: attrNames[i],
                collumn: i
            });
        }

        for (var i = 1, k = data.length; i < k; i++) {
            self.instances.push(data[i]);
        }
    }

};

/* Cria objeto com os possíveis valores do atributo como chaves dos
 atributos do objeto e a frequencia como sendo o valor dos atributos.
 Por exemplo, cálculo para o atributo "tempo" :
 {
    "sol": 4
    "chuvoso": 3
 }
*/
Data2ID3.prototype.getFrequencyByAttrValue = function(attribute, instances) {
    var self = this;
    instances = instances || self.instances;
    var frequency = {};

    for (var i = 0; i < instances.length; i++) {
        var value = instances[i][attribute.collumn];
        if (! frequency[value])
            frequency[value] = 0;

        frequency[value]++;
    }

    return frequency;
};

/**
 * Separa os registros de acordo com cada possível valor para o atributo
 * @param  {object} attr atributo considerado para retornar valores
 * @return {object}      objecto contendo resgistros por valor do atributo
 */
Data2ID3.prototype.getInstancesByAttrValue = function(attr) {
    var self = this;
    var regByAttrValue = {};

    for (var i = 0, j = self.instances.length; i < j; i++) {

        var value = self.instances[i][attr.collumn];

        if (!regByAttrValue[value])
            regByAttrValue[value] = [];

        regByAttrValue[value].push(self.instances[i]);
    }

    return regByAttrValue;
};

/**
 * Verifica se todos os registros de attr têm o mesmo valor
 * @param  {object} atributo atributo considerado
 * @return {boolean}          todos os registro possuem mesmo valor
 */
Data2ID3.prototype.allSameValue = function(attr) {
    var self = this;

    if (self.instances.length < 2)
        return true;

    var valor = self.instances[0][attr.collumn];

    for(var i = 1; i < self.instances.length; i++) {

        if (valor !== self.instances[i][attr.collumn])
            return false;
    }

    return true;
};

/**
 * Retorna o valor (classe) do atributo passado para determinada instância
 * @param  {integer} numRegistro índice da instância no dataset
 * @param  {object} atributo    atributo do qual se quer o valor
 * @return {string}             classe da instância
 */
Data2ID3.prototype.getAttributeValue = function (numRegistro, atributo) {
    var self = this;
    return self.instances[numRegistro][atributo.collumn];
};

/**
 * Método para fazer o particionamento do dados, o 'dividir para conquistar'
 * @param  {object} attribute atributo considerada para o particionamento do
 *                            dataset
 * @return {object}           um objecto formado pelas partições
 * Por exemplo, cálculo para o atributo "tempo" :
 * {
 *   "sol": Data2ID3
 *   "chuvoso": Data2ID3
 * }
 */
Data2ID3.prototype.partition = function(attribute) {
    var self = this;
    var instancesByValue = this.getInstancesByAttrValue(attribute);
    var partitions = {};
    var attrPartitions = [];

    for (var i = 0, l = self.attributes.length; i < l; i++) {

        if (attribute.collumn != self.attributes[i].collumn) {
            attrPartitions.push(self.attributes[i]);
        }
    }

    for (var value in instancesByValue) {
        partitions[value] = new Data2ID3(attrPartitions, instancesByValue[value]);
    }

    return partitions;
};


/**
 * Classe que implementa o algoritmo Kmeans
 */
function Kmeans (opts) {
    var self = this;
    self.K = 1;
    self.maxIterations = 500;
    return self;
}

// Extendendo à classe Clusterer
Kmeans.prototype = new Clusterer();

/**
 * Método para setar o valor de K
 * @return {Object} self
 */
Kmeans.prototype.setK = function(k) {
    var self = this;
    this.K = k;

    return self;
}

/**
 * Método para escolha aleatória do centroides inciais
 * @return {Array} Array com pontos usados com centroides iniciais
 */
Kmeans.prototype.randomCentroids = function() {
    var self = this;
    var _k = self.K;
    var centroids = [];
    var idx = [];
    var data = self.data;
    var dl = data.length;
    for (var i = 0; i < dl; i++) {
        idx.push(i);
    }
    var idxCentroids = utils.array_rand(idx, _k);

    for (var i = 0; i < _k; i++){
        var cen = self.data[idxCentroids[i]].attributes;
        centroids.push(cen);
    }

    return centroids;
}

/**
 * Método que implementa Kmeans
 * @param  {Object} options - Objecto contendo as opções para o modelo na forma:
 * {
 *     k: {number} - Valor de K
 *     maxIterations: {number} - Número máximo de iterações, padrão 500
 *     distance: {Function} - Função para calcular a distância entre os objetos
 *     do conjunto de dados
 *     normalize: {boolean} - Se true normaliza as distâncias no calculo da
 *     SSE, padrão é true
 *     data: {Array} - Conjunto de dados
 *     centroids: {Array} - Centroides iniciais, padrão são escolhidos
 *     aleatóriamente
 *     saveSteps: {boolean} - Salva em steps (array) as mudanças de grupos de
 *     todos os pontos ao longo da execução do algoritmo
 * }
 * @return {[type]}         Objecto na forma:
 * {
 *     clusters: {Array} - Array com objectos de cada grupos
 *     centroids: {Array} - Array com os centroides finais
 *     initialCentroids: {Array} - Array com os centroides iniciais
 * }
 */
Kmeans.prototype.buildClusterer = function(options) {

    var self = this;
    self.K = +options['k'] || self.K;
    self.maxIterations = +options['maxIterations'] || self.maxIterations;
    self.distance = utils.getDistanceFunction(options['distance']);
    self.normalize = utils.isSet(options['normalize'], self.normalize);

    var data = utils.clone(options['data']);
    var fData = self._formatDataset(data);
    //como arrays são passados por referência, clonamos o dataset
    self.data = utils.clone(fData);
    self.iterations = 0;

    var dataset = utils.clone(fData);
    var dataClusters;
    var centroids = options['centroids'] || [];
    var saveSteps = options['saveSteps'] || false;

    var debug = false;
    var m_squaredErrors = new Array(self.K);

    if (self.K > dataset.length) {
        throw "Select k value between 1 and dataset length";
    }

    if (! centroids.length){
        centroids =  self.randomCentroids();
    }

    if (! centroids.length == self.K) {
        throw "Number of centroid and K are not equal";
    }

    var initCentroid = centroids.slice(0);
    // console.log('initCentroid ' , initCentroid);

    var i = 0;
    var converge = false;
    var steps = [];

    do {

        dataClusters = self.createClusters(centroids, dataset);
        centroids = utils.clone(self.calculateCentroids(dataClusters.clusters));
        dataset = utils.clone(dataClusters.data);

        if (saveSteps) {
            steps.push({
                clusters         : dataset,
                centroids        : centroids,
                initialCentroids : initCentroid
            });
        }

        if (debug) console.log('i ' , i);
        i++;

        //centroide mudou
        converge = ! dataClusters.hasChanged;

    } while (! converge && i < self.maxIterations)

    self.iterations = i;

    if (debug) {
        for(var j = 0, i = dataset.length; j < i; j++){
            console.log("[" + dataset[j].attributes + "] cluster "
                + dataset[j].cluster);
        }
    }
    //final cluster
    var result = {
        clusters        : dataset,
        centroids       : centroids,
        initialCentroids: initCentroid
    }

    self.centroids = centroids;
    self.clusters = dataset;

    if (saveSteps) {
        self.steps = steps.slice();
    }

    return result;
};

/**
 * Método usado para a criação dos grupos em uma determinada iteração
 * @param  {Array} centroids - Array com os centroides atuais do agrupamento
 * @param  {Array} dataset   - Conjunto de dados
 * @return {Object}           Objecto na forma:
 * {
 *     data: {Array} - Array de objetos da classe clusterInstance
 *     hasChanged {boolean} - Informação se ocorreu mudança de centroide
 *     clusters: {Array} - Array de clusters com os pontos do conjunto de dados
 * }
 */
Kmeans.prototype.createClusters = function(centroids, dataset) {
    var self = this;
    var data = utils.clone(dataset);
    var _K = self.K;
    var clusters = new Array(_K);
    var changed = false;
    var fDist = self.distance;
    for (var p = 0, j = data.length; p < j; p++) {
        var minDistance = Infinity;
        var point = data[p].attributes;
        var cluster = -1;
        for (var c = 0; c < _K; c++) {
            var d = fDist(point, centroids[c]);
            if (d < minDistance) {
                minDistance = d;
                cluster = c;
            }
        }

        if (cluster == -1) continue;

        if (data[p].cluster !== cluster) {
            changed = true;
            data[p].cluster = cluster;
        }

        if (clusters[cluster] === undefined){
            clusters[cluster] = [point];
        }else {
            clusters[cluster].push(point);
        }
    }

    var returnData = {
        data      : data,
        hasChanged: changed,
        clusters  : clusters
    }

    return returnData;
};

/**
 * Método usado para calcular centroide de cada grupo do agrupamento
 * @param  {Array} clusters - Array de grupos
 * @return {Array}          Array com os centroides de cada grupo
 */
Kmeans.prototype.calculateCentroids = function (clusters) {

    var self = this;
    var k = self.K;
    var centroids = new Array(k);

    for (var i = 0; i < k; i++) {
        var centroid = [];
        if (clusters[i] !== undefined) {
            centroid = self.getCentroid(clusters[i]);
        }

        centroids[i] = centroid;
    }

    return centroids;
}

/**
 * Método para retornar o centroide de um cluster
 * @param  {array} cluster - Cluster para calcular o centroide
 * @return {array}         Array com o ponto central do cluster
 */
Kmeans.prototype.getCentroid = function(cluster) {
    var n = cluster.length;
    var centroid = new Array(cluster[0].length);

    for (var p = 0, i = cluster.length; p < i; p++) {
        var point = cluster[p];
        for (var x = 0, j = point.length; x < j; x++) {
            if (centroid[x] === undefined){
                centroid[x] = point[x];
            }else {
                centroid[x] += point[x];
            }
        }
    }
    centroid = centroid.map(function(c) {
        return c/n;
    });

    return centroid;
}

/**
 * Método para retornar a SSE do agrupamento
 * @return {number}
 */
Kmeans.prototype.getSSE = function() {
    var self = this;
    var clusters = self.clusters;
    var _k = self.K;
    var m_squaredErrors = [];

    var dist = self.distance;
    var sse = 0;

    for (var s = 0, c = clusters.length; s < c; s++){
        var point = clusters[s].attributes;
        var cen = clusters[s].cluster;
        var d = dist(point, self.centroids[cen]);
        var d2 = d * d;
        m_squaredErrors.push(d2);
        sse += (d2);

    }

    // normaliza as distâncias
    if (self.normalize) {
        var m = utils.minMaxScalling(m_squaredErrors);
        sse = m.reduce(function(a, b){ return a + b});
    }

    // console.log('SSE ' , sse);
    return sse;
}


/**
 * Implementação do kNN
 * @param {[type]} options [description]
 */
function kNN (options) {
    var self = this;
    var settings = options || {};
    self.K = settings['k'] || 1;
}

kNN.prototype = new Classifier();

/**
 * Método para setar o valor de K
 * @return {Object} self
 */
kNN.prototype.setK = function(k) {
    var self = this;
    this.K = k;

    return self;
}

/**
 * Método para classificar novo exemplo
 * @param  {array} example novo exemplo
 * @param  {number} k       valor de k
 * @return {string}         classe para novo exemplo
 */
kNN.prototype.classify = function (example, k) {
    var self = this;
    var instance = example["attributes"];
    var dist = self.distance;
    var data = self.trainData.slice();
    var debug = false;

    self.K = +k || self.K;

    if (self.K < 1) {
        throw "K cannot be less 1";
        return;
    }

    var distances = getDistances(instance, data, dist, self.K);
    var s = sortByFrequency(distances);
    if (debug)
        console.log('Example ['+instance+'] class ' + example["class"] +
            ' classified as '+ s[0] + ' with k=' + self.K);

    return s[0];

    function getDistances (instance, data, distance, k) {
        var distances = [];
        for (var i = 0, l = data.length; i < l; i++) {
            var dist = distance(instance, data[i]["attributes"]);
            distances.push({class: data[i]["class"], distance: dist});
        };

        distances.sort( function (a, b) {
            return (a.distance - b.distance);
        });

        return distances.slice(0, k);
    }

    function sortByFrequency(arr) {
        var data = arr.slice(0);
        var frequency = utils.getFrequency(data);

        return Object.keys(frequency).sort(function(curKey,nextKey) {
            return frequency[curKey] < frequency[nextKey];
        });
    }
}


/**
 * Método implementa o kNN
 * @param  {object} options - Objeto com as opções
 * {
 *     data: {array} Conjunto de dados
 *     k: {Number} valor dos k vizinhos, valor padrão é 1
 *     test: {Array} - Opcional, array com o conjunto de dados de teste, se
 *         omitido utiliza holdout para dividir o conjunto de dados
 *     percentSplit: Porcentagem do conjunto de dados a ser usada como
 *         base de treinamento, valor padrão é 2/3
 *
 * }
 * @return {object}         instância de ConfusionMatrix
 */
kNN.prototype.buildClassifier = function (options) {
    var self = this;

    var settings = options || {};
    var dataCopy = utils.clone(settings['data']);
    var fData = self._formatDataset(dataCopy);

    var trainData;
    var testData;
    var odata = utils.holdout(fData, settings['percentSplit']);
    trainData = odata.train;
    testData = odata.test;

    if (settings['test'] !== undefined) {
        trainData = utils.clone(fData);
        testData = self._formatDataset(utils.clone(settings['test']));
    }


    self.data = utils.clone(fData);
    self.distance = utils.getDistanceFunction(settings['distance']);
    self.K = +settings['k'] || 1;
    self.trainData = trainData;
    self.testData = testData; // nem sempre contem todas as classes da base

    self.frequency = utils.getFrequency(self.data);
    var labels = Object.keys(self.frequency).sort();
    self.ConfusionMatrix = new ConfusionMatrix(labels);
    self.ConfusionMatrix.setLanguage(settings['language'] || 'pt');
    var data = self.testData.slice();

    var unClassified = 0;
    var classifiedData = [];

    for (var i = 0, l = data.length; i < l; i++) {
        var classified = self.classify(data[i]);
        if (classified == null) {
            var attr = data[i]['attributes'].slice();
            attr.splice(attr.length, 0, -1);
            classifiedData.push(attr);
            unClassified++;
            continue;
        }
        self.ConfusionMatrix.matrix[data[i]["class"]][classified] += 1;
        var attr = data[i]['attributes'].slice();
        attr.splice(attr.length, 0, classified);
        classifiedData.push(attr);
    }

    self.ConfusionMatrix.unClassified = unClassified;
    self.resultData = classifiedData;

    var frequencyTest = utils.getFrequency(data);
    var frequencyDataset = utils.getFrequency(fData);
    self.ConfusionMatrix.frequency = utils.completeFrequency(frequencyTest,
        frequencyDataset);

    function buildInstace(attr, label, idx) {
        return new classifierInstance(attr, label, idx);
    }

    return self.ConfusionMatrix.calculate();
}


// Linear Regression Grad Descent
function GradientDescent() {
    var self = this;
    self.trained = false;
    return self;
}

// x0 = 1
//multivariate linear regression gradient descent
function linearRegressionGradientDescent() {}

linearRegressionGradientDescent.prototype = new GradientDescent();

linearRegressionGradientDescent.prototype.train = function train (options) {

    var self = this;
    var copyData = utils.clone(options['data']);
    var yCol = +options['y'] || (copyData[0].length - 1);

    var y = utils.getCol(copyData, yCol);
    var ld = copyData.length;
    var points = [];
    //formata os valores
    for (var i = 0; i < ld; i++) {
        //remove o y
        copyData[i].splice(yCol, 1);
        //x0 = 1
        copyData[i].splice(0, 0, 1);
        var num = copyData[i].map(function(e){return +e});
        points.push(num);
    }

    var alpha = +options['alpha'] || 0.001;
    var Theta = [];
    var isConverged = false;
    var iter = 0;
    var precision = +options['precision'] || 0.0001;
    var maxIterations =  +options['maxIterations'] || 500;
    var m = points[0].length;
    var debug = options['debug'] || false;
    var saveError = utils.isSet(options['saveError'], false);
    var errorPlot = [];
    var predictionLine = [];
    var gap = 100;

    function initializeTheta() {
        for (var i = 0, k = points[0].length; i < k; i++) {
            Theta.push(0);
        }
    }

    function hypothesis(x_arr) {
        var hx = 0;
        for (var i = 0, j = x_arr.length; i < j; i++) {
            hx += (Theta[i] * x_arr[i]);
        }

        return hx;
    }

    function mse() {
        var sum = 0;
        var n = points.length;
        for (var i = 0; i < n; i++) {
            var h = hypothesis(points[i]);
            var hy = h - y[i];
            sum += hy * hy;
        }

        return sum / (2 * n);
    }

    function derivativeTheta(th) {

        var sum = 0;
        var n = points.length;
        for (var i = 0; i < n; i++) {
            sum += (hypothesis(points[i]) - y[i]) * points[i][th];
        }

        return sum / n;

    }

    function addPredictionLine(last) {
        var line = [];
        var n = points.length;
        for (var i = 0; i < n; i++) {
            line.push([points[i], hypothesis(points[i])]);
            console.log('points[i]', points[i]);
        }
        predictionLine.push({
            data: line,
            color: last ? '#1F77B0' : '#C5CFD6'
        });

    }

    function run() {
        initializeTheta();

        if (debug)
            console.log('Theta 0' , Theta);

        var e_new = mse();
        var e_old;
        var tempTheta = new Array(m);

        do {

            if (debug)
                console.info('iter ' , iter);

            e_old = e_new;
            if (saveError)
                errorPlot.push([iter, e_new]);

            /* Atualização dos pesos de forma simutânea.
             * Usa o peso atualizado antes de atualizar todos
             */
            for (var i = 0; i < m; i++) {
                Theta[i] = Theta[i] - (alpha * derivativeTheta(i));
            }

            /* Uma outra maneira para a atualização do pesos, aqui todos os
             * pesos são atualizados primeiro para depois serem usados
             * Comente o loop acima e descomente esse caso queira usar outra
             * maneira de atualização dos pesos
             */

            /*
            for (var i = 0; i < m; i++) {
                tempTheta[i] = Theta[i] - (alpha * derivativeTheta(i));
            }

            for (var i = 0; i < m; i++) {
                Theta[i] = tempTheta[i];
            }
            */

           // imprime progresso
            if (saveError && (iter % gap == 0)) {
                addPredictionLine(false);
            }

            e_new = mse();
            iter++;
            var delta = Math.abs(e_new - e_old);

            isConverged = delta <= precision;
        } while (! isConverged && iter < maxIterations);

        self.trained = true;
        self.mse = e_new;
        self.theta = Theta;
        self.numIterations = iter;
        if (saveError){
            addPredictionLine(true);
            self.errorPlot = errorPlot;
            self.predictionLine = predictionLine;
        }
        console.log('predictionLine ' , predictionLine);
    }
    // treinar modelo
    run();

    return self;
}
linearRegressionGradientDescent.prototype.predict = function(args, real) {

    var self = this;
    var Theta = self.theta;
    if (! self.trained) {
        throw new Error("Untrained model");
    }

    var hasReal = real !== undefined;

    var pl = args.length;
    var predMatrix = [];
    var sum = 0;
    var result = {};
    for (var i = 0; i < pl; i++) {
        args[i].splice(0,0,1);
        var predicted = hypothesis(args[i]);
        predMatrix.push(predicted);
        if (hasReal) {
            sum += ((predicted - real[i]) * (predicted - real[i]));
        }
    }

    result.values = predMatrix;
    if (hasReal) {
        result.mse = sum / (2*pl);
    }

    return result;

    function hypothesis(x_arr) {
        var hx = 0;
        for (var i = 0, j = x_arr.length; i < j; i++) {
            hx += (Theta[i] * x_arr[i]);
        }

        return hx;
    }

}

function univariateLinearRegressionGradientDescent() {
    var self = this;
    self.errorPlot = false;
    self.color = {
        predictionLine: '#1F77B0',
        predictionLineLast: '#C5CFD6'
    }
    return self;
}

univariateLinearRegressionGradientDescent.prototype = new GradientDescent();
/**
 * Método para treinar o modelo Gradiente descendente univariado
 * @param  {object} args Objeto comtendo os paramentros a serem
 * usados pelo modelo
 * {
 *     alpha: taxa de aprendizagem,
 *     precision: tolerâcia para o delta erro,
 *     maxIterations: número máximo de iterações,
 *     saveError: salva o valor do mse a cada iteração,
 *     predictionLineGap: intervalo para salvar a linha de previsão durante o
 *     treinamento do modelo,
 *     data: conjunto de dados, o único obrigatório
 * }
 * @return {object}      self
 */
univariateLinearRegressionGradientDescent.prototype.train = function (args) {

    var self = this;
    var w0 = 0;
    var w1 = 0;
    var iter = 0;
    var delta0;
    var delta1;
    var alpha = +args['alpha'] || 0.001;
    var precision = +args['precision'] || 0.0001;
    var maxIterations = +args['maxIterations'] || 500;
    var saveError = utils.isSet(args['saveError'], false);
    var debug = utils.isSet(args['debug'], false);
    var copyData = utils.clone(args['data']);
    var gap = args['predictionLineGap'] || 100;
    var predictionLine = [];

    var points = utils.getCol(copyData, 0);
    var y = utils.getCol(copyData, 1);
    var ld = copyData.length;


    function hypothesis(x) {
        return w0 + w1 * x;
    }

    function _dEdw1() {
        var sum = 0;
        for (var i = 0; i < ld; i++) {
            sum += (hypothesis(points[i]) - y[i]) * points[i];
        }

        return (2 * sum) / ld;
    }

    function _dEdw0() {
        var sum = 0;
        for (var i = 0; i < ld; i++) {
            sum += (hypothesis(points[i]) - y[i]) * 1;
        }

        return (2 * sum) / ld;
    }

    function mse() {
        var sum = 0;
        for (var i = 0; i < ld; i++) {
            sum += (hypothesis(points[i]) - y[i]) * (hypothesis(points[i]) - y[i]);
        }

        return sum / (2 * ld);
    }

    function addPredictionLine(last) {
        var line = [];
        for (var i = 0; i < ld; i++) {
            line.push([points[i], hypothesis(points[i])]);
        }
        predictionLine.push({
            data: line,
            color: last ? self.color.predictionLine
                : self.color.predictionLineLast
        });

    }

    function run() {

        var isConverged = false;
        var e_new = mse();
        var e_old;
        var errorPlot = [];

        if (debug) {
            console.log('mse inicial' , e_new);
        }

        do {
            e_old = e_new;
            if (saveError)
                errorPlot.push([iter, e_new]);

            delta0 = alpha * _dEdw0();
            delta1 = alpha * _dEdw1();

            w0 = w0 - delta0;
            w1 = w1 - delta1;

            if (saveError && (iter % gap == 0)) {
                addPredictionLine(false);
            }

            e_new = mse();

            iter++;

            var delta = Math.abs(e_new - e_old);
            isConverged = delta <= precision;

            if (debug){
                console.log('iter ' , iter);
                console.log('mse ' , e_new);
            }

        } while (! isConverged && iter < maxIterations)

        self.trained = true;
        self.mse = e_new;
        self.theta = [w0, w1];
        self.numIterations = iter;
        if (saveError){
            addPredictionLine(true);
            self.errorPlot = errorPlot;
            self.predictionLine = predictionLine;
        }

        if (debug) {
            console.log('iters ' , iter);
            console.log('w0 ', w0);
            console.log('w1 ', w1);
            console.log('mse final ' , e_new);
        }
    }

    run();

    return self;
}

univariateLinearRegressionGradientDescent.prototype.predict = function(args, real) {

    var self = this;
    var Theta = self.theta;
    var w0 = Theta[0];
    var w1 = Theta[1];

    if (! self.trained) {
        throw new Error("Untrained model");
    }

    var hasReal = real !== undefined;
    var data = utils.isArray(args) ? args : [args];
    var dataReal = utils.isArray(real) ? real : [real];
    var pl = data.length;
    var predMatrix = [];
    var sum = 0;
    var result = {};
    for (var i = 0; i < pl; i++) {
        var predicted = hypothesis(data[i]);
        predMatrix.push(predicted);
        if (hasReal) {
            sum += ((predicted - dataReal[i]) * (predicted - dataReal[i]));
        }
    }

    result.values = predMatrix;
    if (hasReal) {
        result.mse = sum / (2*pl);
    }

    return result;

    function hypothesis(x) {
        return w0 + w1 * x;
    }
}