import { ProjectAPI, createProjectAPI } from './project-api';
import { TerminalAPI, createTerminalAPI } from './terminal-api';
import { TaskAPI, createTaskAPI } from './task-api';
import { SettingsAPI, createSettingsAPI } from './settings-api';
import { TemplateAPI, createTemplateAPI } from './template-api';
import { SecretsAPI, createSecretsAPI } from './secrets-api';
import { FileAPI, createFileAPI } from './file-api';
import { AgentAPI, createAgentAPI } from './agent-api';
import { IdeationAPI, createIdeationAPI } from './modules/ideation-api';
import { InsightsAPI, createInsightsAPI } from './modules/insights-api';
import { AppUpdateAPI, createAppUpdateAPI } from './app-update-api';
import { GitHubAPI, createGitHubAPI } from './modules/github-api';
import { ProfileAPI, createProfileAPI } from './profile-api';
import { GitLabAPI, createGitLabAPI } from './modules/gitlab-api';
import { LogAPI, createLogAPI } from './log-api';
import { PluginAPI, createPluginAPI } from './plugin-api';

export interface ElectronAPI extends
  ProjectAPI,
  TerminalAPI,
  TaskAPI,
  SettingsAPI,
  TemplateAPI,
  SecretsAPI,
  FileAPI,
  AgentAPI,
  IdeationAPI,
  InsightsAPI,
  AppUpdateAPI,
  ProfileAPI,
  GitLabAPI,
  LogAPI,
  PluginAPI {
  github: GitHubAPI;
}

export const createElectronAPI = (): ElectronAPI => ({
  ...createProjectAPI(),
  ...createTerminalAPI(),
  ...createTaskAPI(),
  ...createSettingsAPI(),
  ...createTemplateAPI(),
  ...createSecretsAPI(),
  ...createFileAPI(),
  ...createAgentAPI(),
  ...createIdeationAPI(),
  ...createInsightsAPI(),
  ...createAppUpdateAPI(),
  ...createProfileAPI(),
  ...createGitLabAPI(),
  ...createLogAPI(),
  ...createPluginAPI(),
  github: createGitHubAPI()
});

// Export individual API creators for potential use in tests or specialized contexts
export {
  createProjectAPI,
  createTerminalAPI,
  createTaskAPI,
  createSettingsAPI,
  createTemplateAPI,
  createSecretsAPI,
  createFileAPI,
  createAgentAPI,
  createIdeationAPI,
  createInsightsAPI,
  createAppUpdateAPI,
  createProfileAPI,
  createGitHubAPI,
  createGitLabAPI,
  createLogAPI,
  createPluginAPI
};

export type {
  ProjectAPI,
  TerminalAPI,
  TaskAPI,
  SettingsAPI,
  TemplateAPI,
  SecretsAPI,
  FileAPI,
  AgentAPI,
  IdeationAPI,
  InsightsAPI,
  AppUpdateAPI,
  ProfileAPI,
  GitHubAPI,
  GitLabAPI,
  LogAPI,
  PluginAPI
};
