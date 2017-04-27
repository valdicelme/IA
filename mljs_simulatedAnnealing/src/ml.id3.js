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