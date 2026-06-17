// ---------- Orbit knowledge-graph entities ----------

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

export interface OrbitEntity {
  id: string;
  type: EntityType;
  name: string;
  metadata: Record<string, unknown>;
}

export type RelationType =
  | 'part_of'        // file -> component
  | 'belongs_to'     // component -> service
  | 'depends_on'     // service -> service
  | 'exposes'        // service -> api
  | 'consumes'       // service -> api
  | 'built_by'       // service -> pipeline
  | 'contained_in'   // service -> repository
  | 'owns'           // person -> file/component/service
  | 'contributed_to' // person -> file
  | 'affects'        // security_finding -> file/service
  | 'modified'       // merge_request -> file
  | 'caused'         // merge_request -> incident
  | 'impacted';      // incident -> service

export interface OrbitRelation {
  from: string;
  to: string;
  type: RelationType;
  weight?: number;
}

export interface OrbitGraph {
  entities: OrbitEntity[];
  relations: OrbitRelation[];
}

// ---------- Analysis input / context ----------

export interface AnalyzeRequest {
  mrUrl: string;
  branch: string;
  commitSha: string;
}

export interface ChangedFile {
  path: string;
  additions: number;
  deletions: number;
  securitySensitive: boolean;
  criticality: 'low' | 'medium' | 'high' | 'critical';
}

export interface MrContext {
  mrUrl: string;
  mrIid: number;
  project: string;
  title: string;
  author: string;
  branch: string;
  commitSha: string;
  changedFiles: ChangedFile[];
  dataSource: 'orbit-live' | 'orbit-demo';
}

// ---------- Report sections ----------

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
  relation: RelationType;
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
  score: number;            // 0 - 100
  level: RiskLevel;
  reasoning: string[];
  factors: { label: string; contribution: number; detail: string }[];
}

/** Telemetry about what the Orbit traversal actually did — proof of graph usage. */
export interface OrbitInsights {
  nodesTraversed: number;
  servicesImpacted: number;
  dependenciesAnalyzed: number;
  historicalMrsCompared: number;
  maxTraversalDepth: number;
  relationPathsUsed: { relation: RelationType; count: number; description: string }[];
}

/** One hop in a graph traversal path. */
export interface PathHop {
  id: string;
  name: string;
  type: EntityType;
  /** relation that led FROM this hop TO the next one (absent on the last hop) */
  relation?: RelationType;
}

/** Why a service is in the blast radius: the exact shortest path from a changed file. */
export interface ImpactPath {
  serviceId: string;
  serviceName: string;
  impact: 'direct' | 'transitive';
  hops: PathHop[];
}

/** A GitLab Work Item ready for creation via the workItemCreate GraphQL mutation. */
export interface MitigationTask {
  kind: 'security-review' | 'integration-testing' | 'deployment-approval' | 'monitoring';
  workItemType: 'Task';
  title: string;
  description: string;        // GitLab-flavored markdown body
  labels: string[];
  suggestedAssignee: string;  // @username
  dueInDays: number;
  blocking: boolean;          // should block the MR merge
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
    aiEngine: 'claude' | 'gemini' | 'heuristic';
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
