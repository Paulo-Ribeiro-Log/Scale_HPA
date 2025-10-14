# 🔄 Fix: Rollouts DaemonSet e StatefulSet em Sessões HPA

## 🔍 **Problema Identificado**

Os rollouts de **DaemonSet** e **StatefulSet** estavam sendo salvos no JSON das sessões, mas **não eram restaurados** corretamente ao carregar a sessão.

### **Situação Antes:**
- ✅ **Salvamento**: Campos salvos corretamente no JSON
- ❌ **Carregamento**: Apenas Deployment rollout era restaurado
- ❌ **Interface**: DaemonSet e StatefulSet apareciam como ❌ após carregar sessão

## 🛠️ **Correção Implementada**

### **Estrutura JSON Sempre Esteve Correta:**
```json
{
  "changes": [
    {
      "hpa_name": "nginx-ingress",
      "rollout_triggered": true,
      "daemonset_rollout_triggered": true,
      "statefulset_rollout_triggered": false,
      "new_values": {
        "perform_rollout": true,
        "perform_daemonset_rollout": true,
        "perform_statefulset_rollout": false
      }
    }
  ]
}
```

### **Problema na Restauração:**
**Arquivo:** `internal/tui/app.go` - Função `loadHPASessionState()`

**Antes (Linha 1953):**
```go
hpa := models.HPA{
    // ... outros campos ...
    PerformRollout:  change.RolloutTriggered,  ← Apenas este campo
    OriginalValues:  change.OriginalValues,
    Selected:        true,
    Modified:        true,
}
```

**Depois (Linhas 1953-1955):**
```go
hpa := models.HPA{
    // ... outros campos ...
    PerformRollout:            change.RolloutTriggered,
    PerformDaemonSetRollout:   change.DaemonSetRolloutTriggered,   ← Adicionado
    PerformStatefulSetRollout: change.StatefulSetRolloutTriggered, ← Adicionado
    OriginalValues:            change.OriginalValues,
    Selected:                  true,
    Modified:                  true,
}
```

## ✅ **Resultado Após Correção**

### **Salvamento (Já Funcionava):**
- ✅ `rollout_triggered`: true/false
- ✅ `daemonset_rollout_triggered`: true/false
- ✅ `statefulset_rollout_triggered`: true/false

### **Carregamento (Agora Corrigido):**
- ✅ `PerformRollout`: Deployment rollout restaurado
- ✅ `PerformDaemonSetRollout`: DaemonSet rollout restaurado
- ✅ `PerformStatefulSetRollout`: StatefulSet rollout restaurado

### **Interface (Agora Correta):**
```
🎯 nginx-ingress-controller
     Min:1 Max:22 Curr:3 ●
     Rollout: Deployment:✅ DaemonSet:✅ StatefulSet:❌
```

## 🧪 **Como Testar**

### **1. Criar Sessão com Rollouts:**
1. Selecione um HPA
2. Entre no modo de edição (Enter)
3. Use Space para habilitar rollouts:
   - Deployment: ✅
   - DaemonSet: ✅
   - StatefulSet: ❌
4. Salve a sessão (Ctrl+S)

### **2. Verificar JSON:**
```bash
# Localizar arquivo da sessão
ls ~/.k8s-hpa-manager/sessions/HPA-*/

# Verificar conteúdo
cat ~/.k8s-hpa-manager/sessions/HPA-*/nome_da_sessao.json
```

**JSON Esperado:**
```json
{
  "changes": [
    {
      "rollout_triggered": true,
      "daemonset_rollout_triggered": true,
      "statefulset_rollout_triggered": false
    }
  ]
}
```

### **3. Carregar Sessão:**
1. Use Ctrl+L para carregar sessões
2. Selecione a sessão criada
3. Verifique o painel "HPAs Selecionados"
4. Confirme que mostra: `Rollout: Deployment:✅ DaemonSet:✅ StatefulSet:❌`

### **4. Editar HPA Carregado:**
1. Entre no modo de edição (Enter)
2. Verifique que os rollouts estão corretamente marcados:
   - Deployment: ✅ (foi salvo e restaurado)
   - DaemonSet: ✅ (foi salvo e restaurado)
   - StatefulSet: ❌ (foi salvo e restaurado)

## 📋 **Campos Envolvidos**

### **Estrutura HPAChange (Sessão):**
```go
type HPAChange struct {
    // ... outros campos ...
    RolloutTriggered            bool `json:"rollout_triggered"`
    DaemonSetRolloutTriggered   bool `json:"daemonset_rollout_triggered"`
    StatefulSetRolloutTriggered bool `json:"statefulset_rollout_triggered"`
}
```

### **Estrutura HPA (Runtime):**
```go
type HPA struct {
    // ... outros campos ...
    PerformRollout            bool `json:"perform_rollout"`
    PerformDaemonSetRollout   bool `json:"perform_daemonset_rollout"`
    PerformStatefulSetRollout bool `json:"perform_statefulset_rollout"`
}
```

### **Mapeamento Correto:**
- `change.RolloutTriggered` → `hpa.PerformRollout`
- `change.DaemonSetRolloutTriggered` → `hpa.PerformDaemonSetRollout`
- `change.StatefulSetRolloutTriggered` → `hpa.PerformStatefulSetRollout`

## 🎯 **Status da Correção**

- 🟢 **Identificado**: Problema na restauração de sessões
- 🟢 **Corrigido**: Campos adicionados na função `loadHPASessionState()`
- 🟢 **Compilado**: Sem erros de compilação
- 🟢 **Testável**: Pronto para validação em ambiente real

## 🔧 **Arquivos Modificados**

1. **`internal/tui/app.go`** (Linhas 1953-1955):
   - Adicionado `PerformDaemonSetRollout` na restauração
   - Adicionado `PerformStatefulSetRollout` na restauração

## ⚠️ **Observações Importantes**

1. **Retrocompatibilidade**: Sessões antigas continuam funcionando
2. **Novas Sessões**: Agora salvam e restauram todos os rollouts corretamente
3. **Interface Consistente**: O que você vê é o que está salvo
4. **Sem Breaking Changes**: Estruturas JSON permanecem as mesmas

---

**🎯 Correção completa**: Rollouts de DaemonSet e StatefulSet agora são corretamente salvos E restaurados em sessões HPA!