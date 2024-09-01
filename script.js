/**
 * MIT License

Copyright (c) 2024 Luanna Bahia da Silva

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */


let accessToken = '';
let parcelas = [];

// Função para autenticar e obter o token de acesso
document.getElementById('AutenticarBtn').addEventListener('click', function () {
    var settings = {
        "url": "https://api-parceiro.sicredi.com.br/auth/openapi/token", //substituir a url de sandbox ou produção, a diferenças da url é que o sandbox possui /sb/ e a outra não
        "method": "POST",
        "timeout": 0,
        "headers": {
            "x-api-key": "-----------------", // codigo de acesso gerado no site de desenvolvedor do sicredi, onde é preciso pedir o acesso para o sicredi liberar o uso da api
            "context": "COBRANCA",
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic MTIzNDU2Nzg5OnRlc3RlMTIz"
        },
        "data": {
            "username": "-----", //pode usar os dados do ambiente de teste(sandbox), se for usar o ambiente de produção colocar o codigo do beneficiario + cooperativa
            "password": "------", //aqui pode colocar o codigo que o cliente pega quando ele entra no internet banking, na documentação explica os passoas para solicitar
            "grant_type": "password",
            "scope": "cobranca"
        }
    };

    //msg de sucesso e erro
    $.ajax(settings).done(function (response) {
        console.log("Autenticado:", response);
        accessToken = response.access_token;

        document.getElementById('msg-sucess').innerHTML = 'Autenticado com sucesso!';
        document.getElementById('msg-sucess').style.cssText = 'color: white; display: block; position: absolute; left: 50%; transform: translateX(-50%); padding: 10px; border-radius: 5px; background-color: #28a745; z-index: 1; width: 10%; text-align: center; margin-top: 80px; transition: all 0.1s;';
        setTimeout(() => {
            document.getElementById('msg-sucess').style.display = 'none';
        }, 3000);

    }).fail(function (jqXHR, textStatus, errorThrown) {
        document.getElementById('msg-error').innerHTML = 'Erro na autenticação!';
        document.getElementById('msg-error').style.cssText = 'color: white; display: block; position: absolute; left: 50%; transform: translateX(-50%); padding: 10px; border-radius: 5px; background-color: #dc3545; z-index: 1; width: 10%; text-align: center; margin-top: 80px; transition: all 0.5s;';
        setTimeout(() => {
            document.getElementById('msg-error').style.display = 'none';
        }, 3000);
        console.error("Erro na autenticação:", textStatus, errorThrown);
    });
});

// Função para cadastrar o boleto
document.getElementById('CadastrarBtn').addEventListener('click', function () {
    if (!accessToken) {
        alert('Você precisa autenticar antes de cadastrar um boleto.');
        return;
    }

    const valor = 0.10; // Valor do boleto
    const numParcelas = parseInt(prompt('Deseja parcelar o boleto? (Digite 1 para não parcelar)'));

    // aqui vc coloca os dados que precisam aparecer no boleto para realizar o cadastro dele
    const boleto = {
        "beneficiarioFinal": {
            "cep": "91250000",
            "cidade": "Arenápolis",
            "documento": "46173736080",
            "logradouro": "Rua não sei oque lá",
            "nome": "ROSANA FERREIRA GOMES E CIA LT",
            "numeroEndereco": "980",
            "tipoPessoa": "PESSOA_FISICA",
            "uf": "MT"
        },
        "codigoBeneficiario": 23523, //fornecido pelo cliente
        "dataVencimento": "2024-10-30",
        "especieDocumento": "DUPLICATA_MERCANTIL_INDICACAO",
        "pagador": {
            "cep": "78420000",
            "cidade": "PORTO ALEGRE",
            "documento": "48634430057",
            "nome": "User pagador",
            "tipoPessoa": "PESSOA_FISICA",
            "endereco": "RUA DOUTOR VARGAS NETO 150",
            "uf": "MT"
        },
        "tipoCobranca": "HIBRIDO",
        "seuNumero": "TESTE",
        "valor": valor,
        "tipoDesconto": "VALOR",
        "valorDesconto1": 0.01,
        "dataDesconto1": "2024-10-27",
        "valorDesconto2": 0.04,
        "dataDesconto2": "2024-10-28",
        "valorDesconto3": 0.05,
        "dataDesconto3": "2024-10-29",
        "tipoJuros": "VALOR",
        "juros": 0.05,
        "multa": 0.08,
        "informativos": [
            "Boleto teste"
        ],
        "mensagens": [
            "Teste"
        ],
        "parcelas": []
    };

    if (numParcelas > 1) {
        const valorParcela = valor / numParcelas;
        const originalDueDate = new Date();
        const interval = 30;

        for (let i = 0; i < numParcelas; i++) {
            const parcela = {
                "valor": valorParcela,
                "dataVencimento": new Date(originalDueDate.getTime() + (i * interval * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
            };
            boleto.parcelas.push(parcela);
        }
    }

    const settings = {
        "url": "https://api-parceiro.sicredi.com.br/cobranca/boleto/v1/boletos", // na documentação vai ter várias url, vc precisa saber qual é a certa para poder usar, lá tem o passo de como testar a api primeiro no postman
        "method": "POST",
        "timeout": 0,
        "headers": {
            "x-api-key": "--------", //pega no site de desenvolvedor do sicredi tanto para o ambiente de produção e teste
            "Authorization": "Bearer " + accessToken,
            "Content-Type": "application/json",
            "cooperativa": "----", //cooperativa que o cliente usa
            "posto": "---" // posto do banco do cliente, fornecido por ele
        },
        "data": JSON.stringify(boleto)
    };

    $.ajax(settings).done(function (response) {
        console.log("Resposta da API:", response);

        const nossoNumero = response.nossoNumero;

        adicionarBoletoTabela({
            pagador: boleto.pagador.nome,
            valor: boleto.valor,
            dataVencimento: boleto.dataVencimento,
            parcelas: boleto.parcelas.length,
            linhaDigitavel: response.linhaDigitavel,
            nossoNumero: nossoNumero
        });

        document.getElementById('msg-sucess').innerHTML = 'Boleto cadastrado com sucesso!';
    }).fail(function (jqXHR, textStatus, errorThrown) {
        document.getElementById('msg-error').innerHTML = 'Erro ao cadastrar boleto!';
        console.error("Erro ao cadastrar boleto:", textStatus, errorThrown);
    });
});

// Função para visualizar o boleto
function VerBoleto(linhaDigitavel) {
    if (!linhaDigitavel) {
        alert('Linha digitável não disponível.');
        return;
    }

    // url que tem na documentação para ver o boleto em pdf através da linha digitavel
    const url = `https://api-parceiro.sicredi.com.br/cobranca/boleto/v1/boletos/pdf?linhaDigitavel=${encodeURIComponent(linhaDigitavel)}`;

    var settings = {
        "url": url,
        "method": "GET",
        "timeout": 0,
        "headers": {
            "x-api-key": "----------", //pega no site de desenvolvedor do sicredi tanto para o ambiente de produção e teste
            "Authorization": "Bearer " + accessToken,
            "Content-Type": "application/pdf"
        },
        "xhrFields": {
            responseType: 'blob'
        }
    };

    $.ajax(settings).done(function (response) {
        // Cria um URL para o blob
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // Abre o PDF em uma nova aba
        window.open(url, '_blank');

        // Revoga o URL do blob para liberar memória
        URL.revokeObjectURL(url);
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error("Erro ao visualizar boleto:", textStatus, errorThrown);
    });
}

// Função para adicionar o boleto na tabela
function adicionarBoletoTabela(boleto) {
    const tabela = document.getElementById('boletos-tbody');
    const novaLinha = document.createElement('tr');

    novaLinha.innerHTML = `
                <td>${boleto.pagador}</td>
                <td>${boleto.valor.toFixed(2)}</td>
                <td>${boleto.dataVencimento}</td>
                <td>${boleto.parcelas}</td>
                <td>
                    <button class="ver-boleto" data-linha-digitavel="${boleto.linhaDigitavel}">Ver</button>
                    <button class="editar-boleto" data-nossoNumero="${boleto.nossoNumero}" data-data-vencimento="${boleto.dataVencimento}">Editar</button>
                    <button class="delete-boleto" data-nossoNumero="${boleto.nossoNumero}">Excluir</button>
                </td>
            `;

    tabela.appendChild(novaLinha);

    // Adiciona o evento de clique ao novo botão "Ver"
    novaLinha.querySelector('.ver-boleto').addEventListener('click', function () {
        VerBoleto(this.getAttribute('data-linha-digitavel'));
    });

    // Adiciona o evento de clique ao novo botão "Editar"
    novaLinha.querySelector('.editar-boleto').addEventListener('click', function () {
        editarBoleto(this.getAttribute('data-nossoNumero'));
    });

    // Adiciona o evento de clique ao novo botão "Excluir"
    novaLinha.querySelector('.delete-boleto').addEventListener('click', function () {
        const nossoNumero = this.getAttribute('data-nossoNumero');
        if (nossoNumero) {
            excluirBoleto(nossoNumero);
        } else {
            console.error('Não foi possível encontrar o nosso número');
        }
    });

    salvarBoletos();
    carregarBoletos();
}

// Função para editar o boleto
function editarBoleto(nossoNumero) {
    if (!nossoNumero) {
        alert('Seu número não foi encontrado.');
        return;
    }

    const novaDataVencimento = prompt('Digite a nova data de vencimento (YYYY-MM-DD):');

    if (!novaDataVencimento) return;


    // url para encontrar o boleto que vc quer editar a data de vencimento dele
    const url = `https://api-parceiro.sicredi.com.br/cobranca/boleto/v1/boletos/${encodeURIComponent(nossoNumero)}/data-vencimento`;
    console.log(url)

    const data = {
        dataVencimento: novaDataVencimento
    };

    const settings = {
        "url": url,
        "method": "PATCH",
        "timeout": 0,
        "headers": {
            "x-api-key": "------", //pega no site de desenvolvedor do sicredi tanto para o ambiente de produção e teste
            "Authorization": "Bearer " + accessToken,
            "Content-Type": "application/json",
            "cooperativa": "---", //como é o sicredi a cooperativa é 0804
            "posto": "----", // fornecido pelo cliente
            "codigoBeneficiario": "----" // fornecido pelo cliente
        },
        "data": JSON.stringify(data)
    };

    $.ajax(settings)
        .done(function (response) {
            console.log("Data de vencimento editada:", response);

            // Atualizar a tabela localmente
            const boletos = JSON.parse(localStorage.getItem('boletos'));
            const index = boletos.findIndex((boleto) => boleto.nossoNumero === nossoNumero);
            if (index !== -1) {
                boletos[index].dataVencimento = novaDataVencimento;
                localStorage.setItem('boletos', JSON.stringify(boletos));

                // Atualizar a tabela
                const tabela = document.getElementById('boletos-tbody');
                const linha = tabela.rows[index];
                linha.cells[2].textContent = novaDataVencimento;
            }

            // Recarregar a tabela
            carregarBoletos();
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.error("Erro ao editar data de vencimento:", textStatus, errorThrown);
            // Mostrar uma mensagem de erro amigável para o usuário
            alert("Ocorreu um erro ao editar a data de vencimento. Por favor, tente novamente mais tarde.");
        });
}

// Função excluir boleto
function excluirBoleto(nossoNumero) {
    if (!nossoNumero) {
        alert('Seu número não foi encontrado.');
        return;
    }

    // user insere porq quer remover o boleto
    const motivo = prompt('Digite o motivo da exclusão do boleto:');

    if (!motivo) return;

    //url que encontra o boleto cadastrado com o nossoNumero especifico e deleta
    const url = `https://api-parceiro.sicredi.com.br/cobranca/boleto/v1/boletos/${encodeURIComponent(nossoNumero)}/baixa`;

    const data = {
        motivo: motivo
    };

    const settings = {
        "url": url,
        "method": "PATCH",
        "timeout": 0,
        "headers": {
            "x-api-key": "--------", //pega no site de desenvolvedor do sicredi tanto para o ambiente de produção e teste
            "Authorization": "Bearer " + accessToken,
            "Content-Type": "application/json",
            "cooperativa": "0804", //como é o sicredi a cooperativa é 0804
            "posto": "--", // fornecido pelo cliente
            "codigoBeneficiario": "-----" // fornecido pelo cliente
        },
        "data": JSON.stringify(data)
    };

    $.ajax(settings)
        .done(function (response) {
            console.log("Boleto excluído:", response);

            // Remover o boleto da tabela localmente
            const boletos = JSON.parse(localStorage.getItem('boletos'));
            const index = boletos.findIndex((boleto) => boleto.nossoNumero === nossoNumero);
            if (index !== -1) {
                boletos.splice(index, 1);
                localStorage.setItem('boletos', JSON.stringify(boletos));
            }

            // Recarregar a tabela
            carregarBoletos();
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.error("Erro ao excluir boleto:", textStatus, errorThrown);
            console.error("Response Text:", jqXHR.responseText);
            // Mostrar uma mensagem de erro para o usuário
            alert("Ocorreu um erro ao excluir o boleto. Por favor, tente novamente mais tarde.");
        });
}

// Função salvar boleto na tabela
function salvarBoletos() {
    const boletos = [];
    const tabela = document.getElementById('boletos-tbody');
    const linhas = tabela.rows;

    for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        const boleto = {
            pagador: linha.cells[0].textContent,
            valor: linha.cells[1].textContent,
            dataVencimento: linha.cells[2].textContent,
            parcelas: linha.cells[3].textContent,
            linhaDigitavel: linha.cells[4].querySelector('.ver-boleto').getAttribute('data-linha-digitavel'),
            nossoNumero: linha.cells[4].querySelector('.editar-boleto').getAttribute('data-nossoNumero')
        };
        boletos.push(boleto);
    }

    localStorage.setItem('boletos', JSON.stringify(boletos));
}

// Função carregar boletos quando a pagina é iniciada, meio que salvar em um "banco de dados"
function carregarBoletos() {
    const boletos = localStorage.getItem('boletos');
    if (boletos) {
        const tabela = document.getElementById('boletos-tbody');
        tabela.innerHTML = '';

        const boletosArray = JSON.parse(boletos);
        boletosArray.forEach((boleto) => {
            const novaLinha = document.createElement('tr');
            novaLinha.innerHTML = `
                        <td>${boleto.pagador}</td>
                        <td>${boleto.valor}</td>
                        <td>${boleto.dataVencimento}</td>
                        <td>${boleto.parcelas}</td>
                        <td>
                        <button class="ver-boleto" data-linha-digitavel="${boleto.linhaDigitavel}">Ver</button>
                        <button class="editar-boleto" data-nossoNumero="${boleto.nossoNumero}">Editar</button>
                        <button class="delete-boleto" data-nossoNumero="${boleto.nossoNumero}">Excluir</button>
                        </td>
                    `;
            tabela.appendChild(novaLinha);

            // Adiciona o evento de clique ao novo botão "Ver"
            novaLinha.querySelector('.ver-boleto').addEventListener('click', function () {
                VerBoleto(this.getAttribute('data-linha-digitavel'));
            });

            // Adiciona o evento de clique ao novo botão "Editar"
            novaLinha.querySelector('.editar-boleto').addEventListener('click', function () {
                editarBoleto(this.getAttribute('data-nossoNumero'));
            });

            // Adiciona o evento de clique ao novo botão "Excluir"
            novaLinha.querySelector('.delete-boleto').addEventListener('click', function () {
                const nossoNumero = this.getAttribute('data-nossoNumero');
                if (nossoNumero) {
                    excluirBoleto(nossoNumero);
                } else {
                    console.error('Não foi possível encontrar o nosso número');
                }
            });
        });
    }
}

// Chamaa a Função para carregar os boletos quando a página é carregada
$(document).ready(function () {
    carregarBoletos();
});