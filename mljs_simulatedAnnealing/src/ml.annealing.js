/**
 * Implementação original disponível em: <https://github.com/vsinha/simulated_anneal>
 * Modificado por Valdicélio Mendes Santos utilizando o framework ml.js
 */

/**
 * Classe que implementa o algoritmo SimulatedAnnealing
 */
function SimulatedAnnealing (opts) {
    var self = this;
    var c = document.getElementById("canvas1");
    self.spanenergia = document.getElementById("spanenergia");
    self.spantemperatura = document.getElementById("spantemperatura");
    self.melhorenergia = document.getElementById("melhorenergia");

    self.temperatura = opts['temperatura'];
    self.resfriamento = opts['resfriamento'];
    self.exibirmelhor = opts['exibirmelhor'];
    self.width = c.width;
    self.height = c.height;
    self.nos = [];
    self.ctx = c.getContext("2d");
    self.melhor = Number.MAX_VALUE; //maior valor
    self.melhorSol;
    return self;
}

// Extendendo a classe Clusterer
// SimulatedAnnealing.prototype = new Clusterer();

/**
 * Método que implementa SimulatedAnnealing
 * @param  {Object} options - Objeto contendo as opções para o modelo na forma:
 */
SimulatedAnnealing.prototype.buildClusterer = function(options) {
    var self = this;
    var data = utils.clone(options['data']);
    
    self.temp = self.temperatura;
    self.numNos = data.length;
    self.gerarNos(data);
    self.redesenhar();
    self.simularAnneal();
};


function coordenada(x, y) {
    this.x = x;
    this.y = y;
}

SimulatedAnnealing.prototype.gerarNos = function(data) {
    var self = this;
    var i, novoX, novoY;
    for (i = 0; i < self.numNos; i++) {
        novoX = data[i][0];
        novoY = data[i][1];
        self.nos.push(new coordenada(novoX, novoY));
    }
}

SimulatedAnnealing.prototype.desenharNos = function() {
    var self = this;
    var i;
    for (i = 0; i < self.numNos; i++) {
        self.desenharCirculo(self.nos[i].x, self.nos[i].y);
    }
}

SimulatedAnnealing.prototype.desenharCirculo = function(x, y) {
    var self = this;
    self.ctx.beginPath();
    self.ctx.arc(x, y, 3, 0, 2 * Math.PI, false);
    self.ctx.fillStyle = '#0000ff';
    self.ctx.fill();
    self.ctx.lineWidth = 1;
    self.ctx.strokeStyle = '#444444';
    self.ctx.stroke();
}


//desenha a conexao entre dois nós
SimulatedAnnealing.prototype.conectarNos = function() {
    var self = this;
    var i;
    for (i = 0; i < self.numNos - 1; i++) {
        self.desenharLinha(self.nos[i], self.nos[i+1]);
    }
}

SimulatedAnnealing.prototype.desenharLinha = function(no1, no2) {
    var self = this;
    self.ctx.lineWidth = 1;
    self.ctx.strokeStyle = '#aaaaaa';

    for (var i = 0; i < self.numNos - 1; i++) {
        self.ctx.beginPath();
        self.ctx.moveTo(self.nos[i].x, self.nos[i].y); 
        self.ctx.lineTo(self.nos[i + 1].x, self.nos[i + 1].y);
        self.ctx.stroke();
    }
}

SimulatedAnnealing.prototype.configGrafico = function() {
    var self = this;
    var i;
    self.ctx.lineWidth = 1;
    self.ctx.strokeStyle = '#DDDDDD';

    for (i = 0; i < self.height; i+=50) { //desenhar linha a cada 10 pixels por referencia
        self.ctx.beginPath();
        self.ctx.moveTo(0, i);
        self.ctx.lineTo(self.width, i);
        self.ctx.stroke();
    }

    for (i = 0; i < self.width; i+=50) { //desenhar linha a cada 10 pixels por referencia
        self.ctx.beginPath();
        self.ctx.moveTo(i, 0);
        self.ctx.lineTo(i, self.height);
        self.ctx.stroke();
    }
}

SimulatedAnnealing.prototype.energia = function(solucao) { //soma das distancias do nos em ordem
    var self = this;
    var i;
    var sum = 0;
    for (i = 0; i < self.numNos-1; i++) {
        //calculo da distancia euclidiana sqrt((x1 - x2)^2 + (y1 - y2)^2)
        sum += Math.sqrt( Math.pow(solucao[i].x - solucao[i + 1].x, 2) + Math.pow(solucao[i].y - self.nos[i+1].y, 2));
    }
    return sum;
}


//troca aleatoriamente a ordem de dois nos

SimulatedAnnealing.prototype.vizinho = function(solucaoAtual) {
    var self = this;
    //seleciona 2 aleatorias
    var rand1 = Math.floor(Math.random() * self.numNos);
    var rand2 = rand1;
    while (rand2 === rand1) {
        rand2 = Math.floor(Math.random() * self.numNos);
    }

     //trabalha com uma copia do array de nos
    solucaoVizinho = self.nos.slice(0);

    //troca as solucoes
    var temp = solucaoVizinho[rand1];
    solucaoVizinho[rand1] = solucaoVizinho[rand2];
    solucaoVizinho[rand2] = temp;
    return solucaoVizinho;
}

SimulatedAnnealing.prototype.simularPasso = function(temp) { //fazer um passo de cada vez para animacao
    var self = this;
    var solucaoAtual = self.nos;
    var solucaoVizinho = self.vizinho(solucaoAtual);
    
    if (self.energia(solucaoVizinho) < self.energia(solucaoAtual)) {
        solucaoAtual = solucaoVizinho;
    } else if (self.probFunc(solucaoVizinho, solucaoAtual, temp)) { 
        solucaoAtual = solucaoVizinho;
    }

    self.nos = solucaoAtual;  //armazena na variavel global

    self.redesenhar();
}

SimulatedAnnealing.prototype.probFunc = function(solucaoVizinho, solucaoAtual, temp) {
    var self = this;
    // fórmula da probabilidade desenvolvida por Boltzmann
    return (Math.random() < Math.exp(-(self.energia(solucaoVizinho)-self.energia(solucaoAtual))/temp)); 
}

SimulatedAnnealing.prototype.simularAnneal = function() {
    var self = this;

    self.animate({
        delay: 10,
        duracao: 1000, // 1 seg por default
        temp: function(temp, progresso) {
            return self.selectFuncaoResfria(self.temp, progresso);
        },
        passo: function(temp) {
            self.simularPasso(self.temp);
        }
    });
}

SimulatedAnnealing.prototype.selectFuncaoResfria = function(temp, progresso) {
    var self = this;
    switch (self.resfriamento) {
        case "linear":
            return linear(temp, progresso);
        case "quadratico":
            return quadratica(temp, progresso);
    }
}

//funcoes de resfriamento linear e quadratica
function linear(temp, progresso) {
    return temp - 0.1;
}

function quadratica(temp, progresso) {
    return temp - 0.1*Math.pow(progresso, 2);
}

SimulatedAnnealing.prototype.animate = function(opts) {
    var self = this;
    var inicio = new Date   

    var id = setInterval(function() {
        var tempoPassado = new Date - inicio
        var progresso = tempoPassado / opts.duracao
        

        self.temp = opts.temp(self.temp, progresso)

        if (self.temp <= 0) {
            self.temp = 0;
        }

        opts.passo(self.temp);
        self.spantemperatura.innerHTML = self.temp.toFixed(2);

        if (self.temp == 0) {
            clearInterval(id);
            if (self.exibirmelhor) {
                self.mostrarSolucaoFinal();
            }
        }
    }, opts.delay || 10)

}

SimulatedAnnealing.prototype.redesenhar = function() {
    //desenhar the indicator line if we have a better one
    var self = this;
    self.ctx.canvas.width = self.ctx.canvas.width; //reset graph?
    self.configGrafico();
    self.conectarNos();
    self.desenharNos();
    self.spanenergia.innerHTML = self.energia(self.nos).toFixed(2);
  
    if (self.energia(self.nos) < self.melhor) {
        self.melhor = self.energia(self.nos);
        self.melhorSol = self.nos.slice(0);
        self.melhorenergia.innerHTML = self.melhor.toFixed(2);
    }
}

SimulatedAnnealing.prototype.mostrarSolucaoFinal = function() {
    var self = this;
    self.nos = self.melhorSol;
    self.redesenhar();
}