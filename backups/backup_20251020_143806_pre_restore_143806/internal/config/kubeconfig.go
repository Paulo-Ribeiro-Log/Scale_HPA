package config

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/clientcmd/api"

	"k8s-hpa-manager/internal/models"
)

// ClusterConfig representa a configuração de um cluster no arquivo JSON
type ClusterConfig struct {
	Name          string `json:"clusterName"` // Mudado para "clusterName" para coincidir com o formato original
	ResourceGroup string `json:"resourceGroup"`
	Subscription  string `json:"subscription"`
}

// KubeConfigManager gerencia a configuração do Kubernetes
type KubeConfigManager struct {
	configPath string
	config     *api.Config
	clients    map[string]kubernetes.Interface
}

// NewKubeConfigManager cria um novo gerenciador de kubeconfig
func NewKubeConfigManager(configPath string) (*KubeConfigManager, error) {
	config, err := clientcmd.LoadFromFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load kubeconfig: %w", err)
	}

	return &KubeConfigManager{
		configPath: configPath,
		config:     config,
		clients:    make(map[string]kubernetes.Interface),
	}, nil
}

// DiscoverClusters descobre clusters do kubeconfig que começam com "akspriv-" em ordem alfabética
func (k *KubeConfigManager) DiscoverClusters() []models.Cluster {
	var clusters []models.Cluster
	var clusterNames []string

	// Coletar clusters do kubeconfig que começam com "akspriv-"
	for contextName, _ := range k.config.Contexts {
		if strings.HasPrefix(contextName, "akspriv-") {
			clusterNames = append(clusterNames, contextName)
		}
	}

	// Ordenar alfabeticamente
	sort.Strings(clusterNames)

	// Criar os objetos Cluster na ordem alfabética
	for _, contextName := range clusterNames {
		cluster := models.Cluster{
			Name:    contextName,
			Context: contextName,
			Status:  models.StatusUnknown,
		}
		clusters = append(clusters, cluster)
	}

	return clusters
}

// loadClustersFromConfig carrega clusters do arquivo clusters-config.json no diretório home
func (k *KubeConfigManager) loadClustersFromConfig() []ClusterConfig {
	homeConfigPath := filepath.Join(os.Getenv("HOME"), ".k8s-hpa-manager", "clusters-config.json")

	data, err := os.ReadFile(homeConfigPath)
	if err != nil {
		// Arquivo não existe ou não pode ser lido, retornar slice vazio
		return []ClusterConfig{}
	}

	var clusters []ClusterConfig
	if err := json.Unmarshal(data, &clusters); err != nil {
		// Erro ao fazer parse do JSON, retornar slice vazio
		return []ClusterConfig{}
	}

	return clusters
}

// TestClusterConnection testa a conectividade com um cluster
func (k *KubeConfigManager) TestClusterConnection(ctx context.Context, clusterName string) models.ConnectionStatus {
	// Usar defer recover para capturar panics e converter em erro
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("Panic recovered while testing cluster %s: %v\n", clusterName, r)
		}
	}()

	// Tentar criar cliente com tratamento gracioso de erros
	client, err := k.getClient(clusterName)
	if err != nil {
		// Log do erro para debug mas retorna status de erro sem panic
		fmt.Printf("Error creating client for cluster %s: %v\n", clusterName, err)
		return models.StatusError
	}

	// Criar contexto com timeout
	testCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	// Tentar listar namespaces como teste de conectividade
	_, err = client.CoreV1().Namespaces().List(testCtx, metav1.ListOptions{Limit: 1})
	if err != nil {
		if testCtx.Err() == context.DeadlineExceeded {
			return models.StatusTimeout
		}
		return models.StatusError
	}

	return models.StatusConnected
}

// GetClient retorna um cliente Kubernetes para o cluster especificado
func (k *KubeConfigManager) GetClient(clusterName string) (kubernetes.Interface, error) {
	return k.getClient(clusterName)
}

// getClient cria ou retorna um cliente existente para o cluster
func (k *KubeConfigManager) getClient(clusterName string) (kubernetes.Interface, error) {
	// Verificar se já temos um cliente para este cluster
	if client, exists := k.clients[clusterName]; exists {
		return client, nil
	}

	// Verificar se o arquivo kubeconfig existe e é válido
	if k.configPath == "" {
		return nil, fmt.Errorf("kubeconfig path is empty")
	}

	// Verificar se o arquivo kubeconfig existe
	if _, err := os.Stat(k.configPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("kubeconfig file does not exist at path: %s", k.configPath)
	}

	// Criar configuração do cliente para o contexto específico
	loadingRules := &clientcmd.ClientConfigLoadingRules{ExplicitPath: k.configPath}
	configOverrides := &clientcmd.ConfigOverrides{CurrentContext: clusterName}

	clientConfig := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
		loadingRules,
		configOverrides,
	)

	// Tentar obter configuração REST com tratamento de erro melhorado
	restConfig, err := clientConfig.ClientConfig()
	if err != nil {
		// Tratar erros específicos de parsing YAML
		if strings.Contains(err.Error(), "yaml") || strings.Contains(err.Error(), "unmarshal") {
			return nil, fmt.Errorf("kubeconfig file has invalid YAML format for cluster %s: %w", clusterName, err)
		}
		return nil, fmt.Errorf("failed to create client config for %s: %w", clusterName, err)
	}

	// Configurar timeouts
	restConfig.Timeout = 30 * time.Second
	restConfig.QPS = 50
	restConfig.Burst = 100

	// Criar cliente Kubernetes
	client, err := kubernetes.NewForConfig(restConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes client for %s: %w", clusterName, err)
	}

	// Armazenar cliente para reuso
	k.clients[clusterName] = client

	return client, nil
}

// ListContexts retorna todos os contextos disponíveis
func (k *KubeConfigManager) ListContexts() []string {
	var contexts []string
	for contextName := range k.config.Contexts {
		contexts = append(contexts, contextName)
	}
	return contexts
}

// GetCurrentContext retorna o contexto atual
func (k *KubeConfigManager) GetCurrentContext() string {
	return k.config.CurrentContext
}

// ValidateConfig valida a configuração do kubeconfig
func (k *KubeConfigManager) ValidateConfig() error {
	if k.config == nil {
		return fmt.Errorf("kubeconfig is not loaded")
	}

	if len(k.config.Contexts) == 0 {
		return fmt.Errorf("no contexts found in kubeconfig")
	}

	// Verificar se existem clusters akspriv-*
	hasAksprivClusters := false
	for contextName := range k.config.Contexts {
		if strings.HasPrefix(contextName, "akspriv-") {
			hasAksprivClusters = true
			break
		}
	}

	if !hasAksprivClusters {
		return fmt.Errorf("no akspriv-* clusters found in kubeconfig")
	}

	return nil
}

// GetClusterInfo retorna informações detalhadas sobre um cluster
func (k *KubeConfigManager) GetClusterInfo(clusterName string) (*ClusterInfo, error) {
	context, exists := k.config.Contexts[clusterName]
	if !exists {
		return nil, fmt.Errorf("context %s not found", clusterName)
	}

	cluster, exists := k.config.Clusters[context.Cluster]
	if !exists {
		return nil, fmt.Errorf("cluster %s not found", context.Cluster)
	}

	return &ClusterInfo{
		Name:      clusterName,
		Server:    cluster.Server,
		Context:   clusterName,
		Namespace: context.Namespace,
	}, nil
}

// ClusterInfo representa informações sobre um cluster
type ClusterInfo struct {
	Name      string
	Server    string
	Context   string
	Namespace string
}

// AutoDiscoverClusterConfig descobre automaticamente resource group e subscription a partir do kubeconfig e Azure CLI
func (k *KubeConfigManager) AutoDiscoverClusterConfig(clusterName string) (*ClusterConfig, error) {
	// 1. Extrair resource group do campo user no kubeconfig
	// Padrão: clusterAdmin_{RESOURCE_GROUP}_{CLUSTER_NAME}
	resourceGroup, err := k.extractResourceGroupFromKubeconfig(clusterName)
	if err != nil {
		return nil, fmt.Errorf("failed to extract resource group: %w", err)
	}

	// 2. Descobrir subscription via Azure CLI
	subscription, err := k.discoverSubscriptionViaAzureCLI(clusterName, resourceGroup)
	if err != nil {
		return nil, fmt.Errorf("failed to discover subscription: %w", err)
	}

	return &ClusterConfig{
		Name:           clusterName,
		ResourceGroup:  resourceGroup,
		Subscription:   subscription,
	}, nil
}

// extractResourceGroupFromKubeconfig extrai o resource group do nome do user no kubeconfig
// Padrão: clusterAdmin_{RESOURCE_GROUP}_{CLUSTER_NAME}
func (k *KubeConfigManager) extractResourceGroupFromKubeconfig(clusterName string) (string, error) {
	// Encontrar o context para o cluster
	var contextName string
	for name, ctx := range k.config.Contexts {
		if ctx.Cluster == clusterName {
			contextName = name
			break
		}
	}

	if contextName == "" {
		return "", fmt.Errorf("context not found for cluster %s", clusterName)
	}

	// Pegar o user name do context
	context := k.config.Contexts[contextName]
	userName := context.AuthInfo

	// Extrair resource group do user name
	// Formato: clusterAdmin_{RESOURCE_GROUP}_{CLUSTER_NAME}
	parts := strings.Split(userName, "_")
	if len(parts) < 3 {
		return "", fmt.Errorf("unexpected user name format: %s", userName)
	}

	// Resource group é o segundo elemento (index 1)
	resourceGroup := parts[1]
	return resourceGroup, nil
}

// discoverSubscriptionViaAzureCLI descobre a subscription usando Azure CLI
func (k *KubeConfigManager) discoverSubscriptionViaAzureCLI(clusterName, resourceGroup string) (string, error) {
	// Executar: az aks list --query "[?name=='CLUSTER_NAME' && resourceGroup=='RG'].id" -o tsv
	cmd := exec.Command("az", "aks", "list",
		"--query", fmt.Sprintf("[?name=='%s' && resourceGroup=='%s'].id", clusterName, resourceGroup),
		"-o", "tsv")

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("azure CLI command failed: %w, output: %s", err, string(output))
	}

	// Output formato: /subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RG}/providers/Microsoft.ContainerService/managedClusters/{CLUSTER}
	resourceID := strings.TrimSpace(string(output))
	if resourceID == "" {
		return "", fmt.Errorf("cluster not found in Azure or no access")
	}

	// Extrair subscription do resource ID
	parts := strings.Split(resourceID, "/")
	for i, part := range parts {
		if part == "subscriptions" && i+1 < len(parts) {
			return parts[i+1], nil
		}
	}

	return "", fmt.Errorf("failed to extract subscription from resource ID: %s", resourceID)
}

// AutoDiscoverAllClusters descobre automaticamente configurações de todos os clusters do kubeconfig
func (k *KubeConfigManager) AutoDiscoverAllClusters() ([]ClusterConfig, []error) {
	clusters := k.DiscoverClusters()
	var configs []ClusterConfig
	var errors []error

	fmt.Printf("🔍 Iniciando auto-descoberta para %d clusters...\n\n", len(clusters))

	for i, cluster := range clusters {
		fmt.Printf("[%d/%d] Processando %s...\n", i+1, len(clusters), cluster.Name)

		config, err := k.AutoDiscoverClusterConfig(cluster.Name)
		if err != nil {
			fmt.Printf("  ❌ Erro: %v\n", err)
			errors = append(errors, fmt.Errorf("cluster %s: %w", cluster.Name, err))
			continue
		}

		fmt.Printf("  ✅ Resource Group: %s\n", config.ResourceGroup)
		fmt.Printf("  ✅ Subscription: %s\n", config.Subscription)
		configs = append(configs, *config)
	}

	fmt.Printf("\n📊 Resumo:\n")
	fmt.Printf("  ✅ Sucesso: %d clusters\n", len(configs))
	fmt.Printf("  ❌ Erros: %d clusters\n", len(errors))

	return configs, errors
}

// SaveClusterConfigs salva as configurações descobertas no arquivo clusters-config.json
func (k *KubeConfigManager) SaveClusterConfigs(configs []ClusterConfig) error {
	homeConfigPath := filepath.Join(os.Getenv("HOME"), ".k8s-hpa-manager", "clusters-config.json")

	// Criar diretório se não existir
	dir := filepath.Dir(homeConfigPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Carregar configurações existentes
	existingConfigs := k.loadClustersFromConfig()

	// Criar mapa de configs existentes por nome
	configMap := make(map[string]ClusterConfig)
	for _, cfg := range existingConfigs {
		configMap[cfg.Name] = cfg
	}

	// Atualizar ou adicionar novas configs
	for _, cfg := range configs {
		configMap[cfg.Name] = cfg
	}

	// Converter mapa de volta para slice
	var allConfigs []ClusterConfig
	for _, cfg := range configMap {
		allConfigs = append(allConfigs, cfg)
	}

	// Ordenar alfabeticamente por nome
	sort.Slice(allConfigs, func(i, j int) bool {
		return allConfigs[i].Name < allConfigs[j].Name
	})

	// Serializar para JSON
	data, err := json.MarshalIndent(allConfigs, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	// Salvar arquivo
	if err := os.WriteFile(homeConfigPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	fmt.Printf("\n💾 Configurações salvas em: %s\n", homeConfigPath)
	fmt.Printf("📝 Total de clusters: %d\n", len(allConfigs))

	return nil
}
