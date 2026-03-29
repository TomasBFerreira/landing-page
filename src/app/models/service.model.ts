/** Deployment environment — drives visual grouping and colour coding */
export type ServiceEnv    = 'infra' | 'prod' | 'qa' | 'dev';
export type ServiceStatus = 'up' | 'down' | 'pending' | 'unknown';

export interface ServiceDef {
  id:          string;
  name:        string;
  description: string;
  env:         ServiceEnv;
  url:         string;
  icon:        string;
  tags?:       string[];
}
