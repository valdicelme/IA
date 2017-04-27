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
    console.log('Theta ' , Theta);
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