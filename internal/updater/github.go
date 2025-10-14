package updater

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// GitHubRelease representa uma release do GitHub
type GitHubRelease struct {
	TagName     string    `json:"tag_name"`
	Name        string    `json:"name"`
	Body        string    `json:"body"`
	PublishedAt time.Time `json:"published_at"`
	HTMLURL     string    `json:"html_url"`
}

// GetLatestRelease busca a última release do GitHub
func GetLatestRelease(owner, repo string) (*GitHubRelease, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", owner, repo)

	// Criar cliente HTTP com timeout
	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	// Headers para evitar rate limiting
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "k8s-hpa-manager")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar release: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API retornou status %d", resp.StatusCode)
	}

	var release GitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, fmt.Errorf("erro ao decodificar JSON: %w", err)
	}

	return &release, nil
}
