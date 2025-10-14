# 🚀 K8s HPA Manager - Teste de Layout Unificado

## 📐 Sobre o Protótipo

Este é um protótipo visual do novo layout unificado para o K8s HPA Manager, desenvolvido para demonstrar:

- **Container único 200x50** com moldura elegante
- **Header dinâmico** que muda baseado na função atual do programa
- **Layout limpo** usando Bubble Tea + Lipgloss
- **Navegação fluida** entre diferentes estados da aplicação

## 🎯 Como Executar

### Compilar e Executar
```bash
# Compilar o protótipo
make build-test

# Executar o teste
make run-test

# Executar com debug
make run-test-debug

# Ou executar diretamente
./build/k8s-teste
```

## 🎮 Controles da Demonstração

| Tecla | Ação |
|-------|------|
| `→` / `L` | Próximo estado |
| `←` / `H` | Estado anterior |
| `R` | Reset para primeiro estado |
| `Q` / `Ctrl+C` / `F4` | Sair |

### Auto-navegação
- **Timer automático**: A cada 3 segundos avança para o próximo estado
- **8 estados demonstrados**: Desde seleção de clusters até edição de CronJobs

## 📊 Estados Demonstrados

1. **Seleção de Clusters** - Lista clusters disponíveis com status
2. **Gerenciamento de Sessões** - Sessões salvas organizadas
3. **Seleção de Namespaces** - Namespaces com contadores de HPA
4. **Gerenciamento de HPAs** - Lista HPAs agrupados por namespace
5. **Edição de HPA** - Interface detalhada de edição
6. **Gerenciamento de Node Pools** - Node pools com execução sequencial
7. **Edição de Node Pool** - Configurações Azure detalhadas
8. **Gerenciamento de CronJobs** - CronJobs com status e schedules

## 🎨 Recursos Implementados

### Container Unificado (`UnifiedContainer`)
- **Dimensões fixas**: 200x50 caracteres sempre
- **Moldura responsiva**: Bordas elegantes com Lipgloss
- **Header contextual**: Título automático baseado no estado
- **Quebra de linhas inteligente**: Texto longo quebrado sem cortar palavras

### Demo Interativa (`SimpleDemo`)
- **Navegação completa**: Entre todos os estados principais
- **Conteúdo realista**: Dados de exemplo representativos
- **Controles intuitivos**: Teclas simples para navegação
- **Timer automático**: Demonstração contínua

## 🔧 Arquitetura do Protótipo

```
cmd/k8s-teste/
├── main.go           # Entry point com Cobra CLI
└── simple_demo.go    # Modelo Bubble Tea para demonstração

internal/tui/components/
└── unified_container.go  # Container principal 230x70
```

## 🌟 Características do Layout

### Header Dinâmico
```
K8s HPA Manager - Seleção de Clusters
K8s HPA Manager - Gerenciamento de HPAs
K8s HPA Manager - Editando Node Pool
```

### Moldura Elegante
```
╭─────────── K8s HPA Manager - Estado Atual ───────────╮
│                                                     │
│  Conteúdo do estado atual aqui...                  │
│                                                     │
╰─────────────────────────────────────────────────────╯
```

### Quebra Inteligente
- **Palavras preservadas**: Não corta palavras no meio
- **Espaçamento automático**: Distribui conteúdo uniformemente
- **Scroll implícito**: Conteúdo muito longo é truncado com "..."

## ⚠️  Importante

**Este é APENAS um protótipo visual!**

- ❌ **Não conecta** com clusters reais
- ❌ **Não executa** comandos Azure/kubectl
- ❌ **Não salva** dados reais
- ✅ **Demonstra** apenas o layout e navegação
- ✅ **Mantém** toda lógica original intacta no app principal

## 🚀 Próximos Passos

1. **Validar** o layout com o usuário
2. **Coletar feedback** sobre o design
3. **Iterar** melhorias visuais
4. **Integrar** com a aplicação principal
5. **Migrar** lógica existente para o novo container

## 🎯 Benefícios do Novo Layout

- **Consistência visual**: Mesmo container em todas as telas
- **Header informativo**: Sempre mostra onde está no programa
- **Moldura elegante**: Interface mais profissional
- **Melhor organização**: Conteúdo sempre bem estruturado
- **Navegação clara**: Estado atual sempre visível

---

**Desenvolvido como prova de conceito - Janeiro 2025** 🎨