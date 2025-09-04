// Configurações e utilitários
const CONFIG = {
    defaultCotacao: 5.85,
    animationDuration: 250,
    loadingDelay: 1000,
    corsProxy: 'https://cors-anywhere.herokuapp.com/https://ipparaguay.com.py/cambios-chaco/'
};

// Utilitários
const utils = {
    // Debounce para otimizar performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Animação suave para elementos
    animate(element, className, duration = CONFIG.animationDuration) {
        element.classList.add(className);
        setTimeout(() => {
            element.classList.remove(className);
        }, duration);
    },
    
    // Mostrar/esconder loading
    toggleLoading(show = true) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    },
    
    // Validação de formulário melhorada
    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('error');
                isValid = false;
            } else {
                input.classList.remove('error');
            }
        });
        
        return isValid;
    }
};

// Gerenciador de cotação
const cotacaoManager = {
    async fetchCotacao() {
        try {
            const response = await fetch(CONFIG.corsProxy);
            if (!response.ok) throw new Error('Falha na requisição');
            
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            const sections = doc.querySelectorAll('h3');
            let usdCompra, realCompra;
            
            for (let section of sections) {
                if (section.textContent.trim().includes('Cambios Chaco Asunción Casa Central')) {
                    const table = section.nextElementSibling?.querySelector('table');
                    if (table) {
                        const rows = table.querySelectorAll('tr');
                        for (let row of rows) {
                            const cells = row.querySelectorAll('td');
                            if (cells.length === 3) {
                                const moeda = cells[0].textContent.trim();
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
                return (usdCompra / realCompra).toFixed(2);
            }
            
            return CONFIG.defaultCotacao;
        } catch (error) {
            console.warn('Erro ao buscar cotação:', error);
            return CONFIG.defaultCotacao;
        }
    },
    
    async updateCotacao() {
        const cotacaoInput = document.getElementById('cotacao_dolar');
        const cotacao = await this.fetchCotacao();
        cotacaoInput.value = cotacao;
        
        // Feedback visual
        utils.animate(cotacaoInput, 'pulse');
    }
};

// Gerenciador de lazy loading
const lazyLoadManager = {
    init() {
        const toggleBtn = document.getElementById('toggleCotacao');
        const widget = document.getElementById('cotacaoWidget');
        const iframe = widget.querySelector('iframe');
        const loader = document.getElementById('widgetLoader');
        
        toggleBtn.addEventListener('click', () => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            
            if (!isExpanded) {
                // Expandir
                widget.style.display = 'block';
                toggleBtn.setAttribute('aria-expanded', 'true');
                toggleBtn.textContent = 'Ocultar Cotação';
                
                // Lazy load do iframe
                if (!iframe.src && iframe.dataset.src) {
                    loader.style.display = 'flex';
                    iframe.src = iframe.dataset.src;
                    
                    iframe.onload = () => {
                        setTimeout(() => {
                            loader.style.display = 'none';
                        }, CONFIG.loadingDelay);
                    };
                }
            } else {
                // Colapsar
                widget.style.display = 'none';
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.textContent = 'Ver Cotação Atual';
            }
        });
    }
};

// Gerenciador principal da aplicação
const appManager = {
    init() {
        this.bindEvents();
        this.initializeApp();
        lazyLoadManager.init();
    },
    
    async initializeApp() {
        // Mostrar loading inicial
        utils.toggleLoading(true);
        
        // Simular carregamento e buscar cotação
        await Promise.all([
            cotacaoManager.updateCotacao(),
            new Promise(resolve => setTimeout(resolve, 800)) // Mínimo de loading
        ]);
        
        // Esconder loading
        utils.toggleLoading(false);
    },
    
    bindEvents() {
        const form = document.getElementById('orcamentoForm');
        const copiarBtn = document.getElementById('copiar');
        const novoBtn = document.getElementById('novoOrcamento');
        
        // Submit do formulário
        form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Copiar texto
        copiarBtn.addEventListener('click', this.handleCopy.bind(this));
        
        // Novo orçamento
        novoBtn.addEventListener('click', this.handleNewBudget.bind(this));
        
        // Validação em tempo real
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', utils.debounce(() => {
                this.validateField(input);
            }, 300));
        });
    },
    
    validateField(field) {
        if (field.hasAttribute('required') && !field.value.trim()) {
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    },
    
    async handleSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        // Validar formulário
        if (!utils.validateForm(form)) {
            utils.animate(form, 'shake');
            return;
        }
        
        // Mostrar loading no botão
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
        
        try {
            // Simular processamento
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Coletar dados
            const formData = this.collectFormData();
            
            // Calcular orçamento
            const orcamento = this.calculateBudget(formData);
            
            // Mostrar resultado
            this.showResult(orcamento);
            
        } catch (error) {
            console.error('Erro ao gerar orçamento:', error);
            alert('Erro ao gerar orçamento. Tente novamente.');
        } finally {
            // Restaurar botão
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    },
    
    collectFormData() {
        return {
            nome: document.getElementById('nome_cliente').value.trim(),
            servico: document.getElementById('servico').value.trim(),
            modelo: document.getElementById('modelo_aparelho').value.trim(),
            valorDolar: parseFloat(document.getElementById('valor_dolar').value) || 0,
            cotacao: parseFloat(document.getElementById('cotacao_dolar').value) || CONFIG.defaultCotacao,
            frete: parseFloat(document.getElementById('frete').value) || 0,
            maoDeObra: parseFloat(document.getElementById('mao_de_obra').value) || 0
        };
    },
    
    calculateBudget(data) {
        const valorEmReal = data.valorDolar * data.cotacao;
        const valorSemMaoDeObra = Math.round(valorEmReal + data.frete);
        const valorFinal = Math.round(valorEmReal + data.frete + data.maoDeObra);
        
        return {
            ...data,
            valorEmReal,
            valorSemMaoDeObra,
            valorFinal,
            texto: this.generateBudgetText(data, valorSemMaoDeObra, valorFinal)
        };
    },
    
    generateBudgetText(data, valorSemMaoDeObra, valorFinal) {
        return `📝 *Orçamento para ${data.nome}*
🛠️ *Serviço:* ${data.servico}
📱 *Modelo:* ${data.modelo}
💵 *Valor da peça em dólar:* $${data.valorDolar.toFixed(2)}
💰 *Cotação do dólar:* R$${data.cotacao.toFixed(2)}
🚚 *Frete:* R$${data.frete.toFixed(2)}
🛠️ *Mão de obra:* R$${data.maoDeObra.toFixed(2)}
🔖 *Valor sem mão de obra:* R$${valorSemMaoDeObra}
🔖 *Valor total:* R$${valorFinal}

*A mão de obra pode ser parcelada ou paga até um mês após o serviço.*`;
    },
    
    showResult(orcamento) {
        const resultado = document.getElementById('resultado');
        const mensagem = document.getElementById('mensagem');
        
        mensagem.textContent = orcamento.texto;
        resultado.style.display = 'block';
        
        // Scroll suave para o resultado
        resultado.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    },
    
    async handleCopy() {
        const mensagem = document.getElementById('mensagem');
        const copiarBtn = document.getElementById('copiar');
        const btnText = copiarBtn.querySelector('.btn-text');
        const btnSuccess = copiarBtn.querySelector('.btn-success');
        
        try {
            await navigator.clipboard.writeText(mensagem.textContent);
            
            // Feedback visual de sucesso
            btnText.style.display = 'none';
            btnSuccess.style.display = 'flex';
            utils.animate(copiarBtn, 'pulse');
            
            // Restaurar após 2 segundos
            setTimeout(() => {
                btnText.style.display = 'inline';
                btnSuccess.style.display = 'none';
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao copiar:', error);
            
            // Fallback para dispositivos mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = mensagem.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                alert('Texto copiado com sucesso!');
            } catch (fallbackError) {
                alert('Não foi possível copiar automaticamente. Selecione e copie manualmente.');
            }
            
            document.body.removeChild(textArea);
        }
    },
    
    handleNewBudget() {
        const form = document.getElementById('orcamentoForm');
        const resultado = document.getElementById('resultado');
        
        // Reset do formulário
        form.reset();
        
        // Restaurar valores padrão
        document.getElementById('mao_de_obra').value = '100';
        document.getElementById('cotacao_dolar').value = CONFIG.defaultCotacao;
        
        // Esconder resultado
        resultado.style.display = 'none';
        
        // Scroll para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Foco no primeiro campo
        document.getElementById('nome_cliente').focus();
    }
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    appManager.init();
});

// Service Worker para cache (opcional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registrado:', registration);
            })
            .catch(registrationError => {
                console.log('SW falhou:', registrationError);
            });
    });
}
