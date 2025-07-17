// Removido onload para scraping
window.onload = function () {
    var url = 'https://cors-anywhere.herokuapp.com/https://ipparaguay.com.py/cambios-chaco/';
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onload = function() {
      if (request.status === 200) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(request.responseText, 'text/html');
        var sections = doc.querySelectorAll('h3'); // Assuming sections are under h3 or similar
        var usdCompra, realCompra;
        for (let section of sections) {
          if (section.textContent.trim().includes('Cambios Chaco Asunción Casa Central')) {
            var table = section.nextElementSibling.querySelector('table');
            if (table) {
              var rows = table.querySelectorAll('tr');
              for (let row of rows) {
                var cells = row.querySelectorAll('td');
                if (cells.length === 3) {
                  var moeda = cells[0].textContent.trim();
                  if (moeda === 'Dólar Americano') {
                    usdCompra = parseFloat(cells[1].textContent.trim().replace(',', '.'));
                  } else if (moeda === 'Real') {
                    realCompra = parseFloat(cells[1].textContent.trim().replace(',', '.'));
                  }
                }
              }
            }
            break;
          }
        }
        if (usdCompra && realCompra) {
          var cotacao = (usdCompra / realCompra).toFixed(2);
          document.getElementById('cotacao_dolar').value = cotacao;
        } else {
          document.getElementById('cotacao_dolar').value = '5.85';
        }
      } else {
        document.getElementById('cotacao_dolar').value = '5.85';
      }
    };
    request.onerror = function() {
      document.getElementById('cotacao_dolar').value = '5.85';
    };
    request.send();
};

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('orcamentoForm');
    const resultado = document.getElementById('resultado');
    const mensagem = document.getElementById('mensagem');
    const copiar = document.getElementById('copiar');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        if (!form.checkValidity()) {
            event.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        const nome = document.getElementById('nome_cliente').value;
        const servico = document.getElementById('servico').value;
        const modelo = document.getElementById('modelo_aparelho').value;
        const valorDolar = parseFloat(document.getElementById('valor_dolar').value);
        const cotacao = parseFloat(document.getElementById('cotacao_dolar').value);
        const frete = parseFloat(document.getElementById('frete').value);
        const maoDeObra = parseFloat(document.getElementById('mao_de_obra').value);

        if (isNaN(valorDolar) || isNaN(cotacao) || isNaN(maoDeObra)) {
            alert('Por favor, insira valores numéricos válidos.');
            return;
        }

        const valorEmReal = valorDolar * cotacao;
        const valorSemMaoDeObra = Math.round(valorEmReal + frete);
        const valorFinalCalculado = Math.round(valorEmReal + frete + maoDeObra);

        const texto = `📝 *Orçamento para ${nome}*\n🛠️ *Serviço:* ${servico}\n📱 *Modelo:* ${modelo}\n💵 *Valor da peça em dólar:* $${valorDolar.toFixed(2)}\n💰 *Cotação do dólar:* R$${cotacao.toFixed(2)}\n🚚 *Frete:* R$${frete.toFixed(2)}\n🛠️ *Mão de obra:* R$${maoDeObra.toFixed(2)}\n🔖 *Valor sem mão de obra:* R$${valorSemMaoDeObra}\n🔖 *Valor total:* R$${valorFinalCalculado}\n\n*A mão de obra pode ser parcelada ou paga até um mês após o serviço.*`;

        mensagem.textContent = texto;
        resultado.style.display = 'block';
    });

    copiar.addEventListener('click', function() {
        navigator.clipboard.writeText(mensagem.textContent).then(() => {
            alert('Texto copiado para a área de transferência!');
        }).catch(err => {
            alert('Falha ao copiar texto: ' + err);
        });
    });
});
