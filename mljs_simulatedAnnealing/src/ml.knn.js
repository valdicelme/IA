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