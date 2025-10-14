# 🎯 Kubernetes HPA Manager

Um gerenciador interativo de terminal para Horizontal Pod Autoscalers (HPAs) do Kubernetes, construído com Go e Bubble Tea. Gerencie HPAs de múltiplos clusters de forma intuitiva e eficiente.

![Build Status](https://img.shields.io/badge/build-passing-green)
![Go Version](https://img.shields.io/badge/go-1.21+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Funcionalidades

### 🚀 **Core Features**
- **🔍 Descoberta Automática**: Descobre clusters `akspriv-*` do kubeconfig
- **🎨 Interface Moderna**: TUI responsiva com navegação por teclado
- **📁 Seleção Múltipla**: Namespaces e HPAs com painéis visuais
- **✏️ Edição Avançada**: Min/max replicas, CPU/memory targets, rollout toggle
- **💾 Sistema de Sessões**: Salve e restaure estados para revisão
- **🔄 Operações Flexíveis**: Aplicação individual (Ctrl+D) ou em lote (Ctrl+U)

### 🎛️ **Interface Features**
- **❓ Sistema de Ajuda**: Help contextual com scroll navegável (tecla `?`)
- **🌡️ Status em Tempo Real**: Conectividade de cluster e contagem de HPAs
- **🔀 Navegação Intuitiva**: Tab entre painéis, ESC para voltar, vi-keys (hjkl)
- **🚨 Recuperação de Erros**: ESC volta de erros sem perder contexto
- **🎯 Indicadores Visuais**: Status modificado (✨), rollout (✅/❌), conectividade

### 🛠️ **Operational Features**
- **🔧 Rollout Integration**: Toggle por HPA com execução automática
- **🌐 Multi-cluster**: Gerenciamento de clientes Kubernetes por cluster
- **🔒 Filtros Inteligentes**: Namespaces de sistema opcionais (toggle `S`)
- **⚡ Performance**: Carregamento assíncrono e contagem em background

## 🚀 Instalação

### 📦 **Instalação Automática (Recomendada)**

```bash
# Clonar repositório
git clone <repository-url>
cd k8s-hpa-manager

# Executar instalador automático
./install.sh
```

🎉 **Pronto!** Agora use `k8s-hpa-manager` de qualquer lugar do terminal.

### 🛠️ **Instalação Manual**

```bash
# Compilar
make build

# Instalar globalmente
sudo cp build/k8s-hpa-manager /usr/local/bin/
sudo chmod +x /usr/local/bin/k8s-hpa-manager
```

### 🗑️ **Desinstalação**

```bash
# Usando script automático
./uninstall.sh

# Ou manual
sudo rm /usr/local/bin/k8s-hpa-manager
```

### ✅ **Pré-requisitos**

- **Go 1.21+** (para compilação)
- **Clusters Kubernetes** com contextos `akspriv-*` no kubeconfig
- **Permissões RBAC**: Listar namespaces, HPAs e executar rollouts

## 📋 Uso

### 🎮 **Início Rápido**

```bash
# Executar após instalação global
k8s-hpa-manager

# Opções disponíveis
k8s-hpa-manager --help
k8s-hpa-manager --debug                    # Modo debug
k8s-hpa-manager --kubeconfig /path/config  # Kubeconfig customizado
```

### 🎯 **Fluxo de Trabalho**

1. **🏗️ Seleção de Cluster** → Escolha um cluster `akspriv-*`
2. **📁 Seleção de Namespaces** → Selecione múltiplos namespaces
3. **🎯 Gerenciamento de HPAs** → Selecione e edite HPAs
4. **✏️ Edição Individual** → Configure cada HPA
5. **🚀 Aplicação** → Individual (Ctrl+D) ou lote (Ctrl+U)

### ⌨️ **Controles de Teclado**

#### 🌐 **Navegação Global**
- **`?`** → Ajuda contextual com scroll
- **`F4`** → Sair da aplicação
- **`ESC`** → Voltar/cancelar (inclusive de erros!)
- **`Ctrl+C`** → Forçar saída

#### 🏗️ **Clusters & Sessões**
- **`↑↓` / `k j`** → Navegar listas
- **`ENTER`** → Selecionar cluster
- **`Ctrl+L`** → Carregar sessão salva

#### 📁 **Namespaces**
- **`SPACE`** → Selecionar/deselecionar namespace
- **`TAB`** → Alternar entre painéis
- **`S`** → Toggle namespaces de sistema
- **`ENTER`** → Continuar para HPAs

#### 🎯 **HPAs**
- **`SPACE`** → Selecionar/deselecionar HPA
- **`ENTER`** → Editar HPA selecionado
- **`Ctrl+D`** → **Aplicar HPA individual**
- **`Ctrl+U`** → **Aplicar todos os HPAs modificados**
- **`Ctrl+S`** → Salvar sessão

#### ✏️ **Edição de HPAs**
- **`↑↓` / `k j`** → Navegar campos
- **`TAB`** → Próximo campo
- **`ENTER`** → Editar campo (números)
- **`SPACE`** → Toggle rollout (Sim/Não)
- **`0-9`** → Entrada numérica
- **`Backspace`** → Apagar dígito
- **`Ctrl+S`** → Salvar e voltar

## 💾 Sistema de Sessões

### 🔄 **Comportamento das Sessões**

As sessões agora funcionam como **"estados salvos"** para revisão:

1. **Ctrl+S** → Salva estado atual (cluster + namespaces + HPAs modificados)
2. **Ctrl+L** → **Restaura estado** para revisão (NÃO aplica automaticamente!)
3. **Revisar/Editar** → Faça ajustes nos HPAs carregados
4. **Ctrl+D/U** → Aplique quando estiver pronto

> 🎯 **Vantagem**: Você pode carregar uma sessão, revisar as mudanças, fazer ajustes (como alterar rollout) e depois aplicar.

### 📂 **Templates de Nomenclatura**

#### **Templates Disponíveis**
- **Action + Cluster + Timestamp**: `{action}_{cluster}_{timestamp}`
- **Environment + Date**: `{env}_{date}`  
- **Quick Save**: `Quick-save_{timestamp}`

#### **Variáveis Suportadas**
- `{action}` → Ação customizada
- `{cluster}` → Nome do cluster
- `{env}` → Ambiente (dev/prod/staging)
- `{timestamp}` → dd-mm-yy_hh:mm:ss
- `{date}` → dd-mm-yy
- `{user}` → Usuário do sistema
- `{hpa_count}` → Número de HPAs

### Estrutura das Sessões

As sessões são salvas em `~/.k8s-hpa-manager/sessions/` em formato JSON:

```json
{
  "session": {
    "name": "Up-sizing_aks-teste-prd_19-09-24_14:23:45",
    "created_at": "2024-09-19T14:23:45Z",
    "created_by": "admin",
    "description": "Scaling up production workloads"
  },
  "changes": [
    {
      "cluster": "akspriv-dev-central",
      "namespace": "api-services",
      "hpa": "web-api-hpa",
      "original_values": {
        "min_replicas": 2,
        "max_replicas": 10
      },
      "new_values": {
        "min_replicas": 2,
        "max_replicas": 15
      }
    }
  ]
}
```

## 🛠️ Desenvolvimento

### Configuração do Ambiente

```bash
# Configurar ambiente de desenvolvimento
make dev-setup

# Executar em modo de desenvolvimento
make run-dev

# Executar testes
make test

# Executar testes com coverage
make test-coverage

# Executar linter
make lint

# Formatar código
make fmt
```

### Estrutura do Projeto

```
k8s-hpa-manager/
├── cmd/                    # Comandos CLI
│   └── root.go
├── internal/               # Código interno
│   ├── config/            # Gerenciamento kubeconfig
│   ├── kubernetes/        # Cliente Kubernetes
│   ├── models/            # Estruturas de dados
│   ├── session/           # Gerenciamento de sessões
│   └── tui/               # Interface do usuário
├── pkg/                   # Código público (se necessário)
├── build/                 # Artefatos de build
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

### Arquitetura

- **Bubble Tea**: Framework TUI para interfaces interativas
- **Lipgloss**: Estilização e layout da interface
- **client-go**: Cliente oficial Kubernetes
- **cobra**: Framework CLI para comandos

## 📊 Exemplos Práticos

### 🚨 **Cenário 1: Scale Up Emergencial**

```bash
k8s-hpa-manager
# 1. Selecionar cluster produção → ENTER
# 2. Selecionar namespaces críticos → SPACE (múltiplos)
# 3. ENTER → Carregar HPAs
# 4. Selecionar HPAs → SPACE, ENTER para editar
# 5. Aumentar max_replicas, ativar rollout → SPACE
# 6. Ctrl+S → Salvar como "Emergency-scale-prod"
# 7. Ctrl+U → Aplicar todas as mudanças
```

### 🛍️ **Cenário 2: Preparação Black Friday**

```bash
k8s-hpa-manager
# 1. Ctrl+L → Carregar sessão "Black-friday-prep"
# 2. Revisar HPAs carregados (já modificados!)
# 3. Ajustar rollout se necessário → SPACE
# 4. Ctrl+U → Aplicar todas de uma vez
# ✅ Rollouts executados automaticamente
```

### 🔄 **Cenário 3: Rollback Rápido**

```bash
k8s-hpa-manager
# 1. Ctrl+L → Carregar sessão "Backup-pre-incident"
# 2. Verificar valores originais
# 3. Ctrl+U → Restaurar configurações
# 4. ? → Ver ajuda se necessário
# 5. ESC de qualquer erro → Não perde progresso
```

### 💡 **Dicas de Uso**

- **`?`** sempre disponível para ajuda contextual
- **Ctrl+D** para testar um HPA antes de aplicar todos
- **ESC** nunca força saída - sempre volta ao contexto
- **Sessões** preservam TODO o estado para revisão posterior

## ⚠️ Considerações de Segurança

- A aplicação requer permissões de leitura/escrita em HPAs
- Permissões para executar rollout restart em deployments
- Acesso aos clusters deve ser configurado via kubeconfig
- Sessões são salvas localmente em texto simples

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

## 🔧 Troubleshooting

### 🚨 **Problemas Comuns**

**Instalação:**
- **"Go not found"** → Instale Go 1.21+ e configure PATH
- **Permission denied** → Use `sudo` para `/usr/local/bin/`
- **Command not found** → Reinicie terminal ou verifique PATH

**Conectividade:**
- **Cluster offline** → `kubectl cluster-info --context=<cluster>`
- **Client not found** → Bug corrigido - reinicie se persistir
- **HPAs não carregam** → Verifique RBAC e use `S` para toggle

**Interface:**
- **Help muito grande** → Use ↑↓ ou PgUp/PgDn para navegar
- **Erro sem saída** → Use `ESC` para voltar (não perde contexto!)

### 💡 **Dicas de Performance**
- Filtros de sistema melhoram velocidade
- Carregamento assíncrono reduz espera
- Sessões preservam trabalho entre execuções

## ✨ Melhorias Recentes

### 🆕 **v2.0 - Interface Renovada**
- ✅ **Sistema de Ajuda** com scroll navegável (`?`)
- ✅ **Correção Ctrl+D** - aplicação individual agora funciona corretamente
- ✅ **Recuperação de Erros** - ESC volta de erros mantendo contexto
- ✅ **Sessões Inteligentes** - carrega para revisão, não aplica automaticamente
- ✅ **Status Visual** - indicadores de conectividade e modificações
- ✅ **Multi-namespace** - seleção e gestão de múltiplos namespaces

### 🎯 **Próximas Melhorias**
- [ ] Métricas customizadas (além de CPU/Memory)
- [ ] Export/import de sessões
- [ ] Temas de cores personalizáveis
- [ ] Histórico de operações

## 📞 Suporte

### 🆘 **Precisa de Ajuda?**

1. **`?`** → Ajuda contextual na própria aplicação (scroll com ↑↓)
2. **Troubleshooting** → Veja seção acima para problemas comuns
3. **Debug** → Execute com `k8s-hpa-manager --debug`
4. **Issues** → Abra uma issue no repositório com logs

### 📋 **Reportando Bugs**

Inclua nas issues:
- **Versão do Go**: `go version`
- **Contexto**: Quando o erro ocorreu
- **Logs**: Output com `--debug`
- **Steps**: Como reproduzir o problema

### 🤝 **Contribuindo**

1. Fork do projeto
2. Branch para feature: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Add: nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Pull Request

---

> 🎯 **Desenvolvido para simplificar o gerenciamento de HPAs do Kubernetes**  
> ⚡ **Interface rápida, intuitiva e poderosa**  
> 💾 **Sessões que preservam seu trabalho**