package config

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
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
