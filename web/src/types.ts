// Mirrors server/src/types.ts report shapes (the API contract)

export type EntityType =
  | 'file'
  | 'component'
  | 'service'
  | 'api'
  | 'pipeline'
  | 'repository'
  | 'person'
  | 'security_finding'
  | 'merge_request'
  | 'incident';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  impact: 'direct' | 'transitive' | 'context';
  criticality?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
}

export interface BlastRadius {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    changedFiles: number;
    directServices: number;
    transitiveServices: number;
    apis: number;
    pipelines: number;
    repositories: number;
  };
}

export interface AffectedService {
  id: string;
  name: string;
  tier: string;
  impact: 'direct' | 'transitive';
  distance: number;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  slo: string;
  reason: string;
}

export interface ReviewerRecommendation {
  username: string;
  name: string;
  role: string;
  score: number;
  signals: string[];
  explanation: string;
}

export interface TestRecommendation {
  category: 'Unit' | 'Integration' | 'Security' | 'Regression' | 'Performance';
  name: string;
  rationale: string;
  priority: 'P0' | 'P1' | 'P2';
  targets: string[];
}

export interface SimilarIncident {
  mrId: string;
  title: string;
  similarity: number;
  outcome: 'deployed-clean' | 'caused-incident' | 'rolled-back' | 'pipeline-failed';
  date: string;
  overlap: { files: number; services: number };
  lesson: string;
}

export interface DeploymentPlan {
  safeWindow: string;
  canary: string;
  featureFlag: string;
  rollback: string;
  monitoring: string[];
}

export interface ExecutiveSummary {
  overview: string;
  businessImpact: string;
  deploymentRisk: string;
  recommendedActions: string[];
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  reasoning: string[];
  factors: { label: string; contribution: number; detail: string }[];
}

export type RelationType =
  | 'part_of' | 'belongs_to' | 'depends_on' | 'exposes' | 'consumes'
  | 'built_by' | 'contained_in' | 'owns' | 'contributed_to' | 'affects'
  | 'modified' | 'caused' | 'impacted';

export interface OrbitInsights {
  nodesTraversed: number;
  servicesImpacted: number;
  dependenciesAnalyzed: number;
  historicalMrsCompared: number;
  maxTraversalDepth: number;
  relationPathsUsed: { relation: RelationType; count: number; description: string }[];
}

export interface PathHop {
  id: string;
  name: string;
  type: EntityType;
  relation?: RelationType;
}

export interface ImpactPath {
  serviceId: string;
  serviceName: string;
  impact: 'direct' | 'transitive';
  hops: PathHop[];
}

export interface MitigationTask {
  kind: 'security-review' | 'integration-testing' | 'deployment-approval' | 'monitoring';
  workItemType: 'Task';
  title: string;
  description: string;
  labels: string[];
  suggestedAssignee: string;
  dueInDays: number;
  blocking: boolean;
}

export interface AnalysisReport {
  meta: {
    mrUrl: string;
    mrIid: number;
    project: string;
    title: string;
    author: string;
    branch: string;
    commitSha: string;
    analyzedAt: string;
    dataSource: 'orbit-live' | 'orbit-demo';
    aiEngine: 'claude' | 'heuristic';
    durationMs: number;
  };
  risk: RiskAssessment;
  blastRadius: BlastRadius;
  affectedServices: AffectedService[];
  reviewers: ReviewerRecommendation[];
  testPlan: TestRecommendation[];
  similarIncidents: SimilarIncident[];
  deployment: DeploymentPlan;
  executiveSummary: ExecutiveSummary;
  orbitInsights: OrbitInsights;
  impactPaths: ImpactPath[];
  mitigationTasks: MitigationTask[];
}
