import type { ChangedFile, OrbitGraph } from '../types.js';

/**
 * Demo knowledge graph modelling "CommercePlatform" — a realistic GitLab
 * group with 9 services. Used when no live Orbit credentials are configured,
 * so the product can be demoed end-to-end with zero setup.
 *
 * Entity id convention: <type>:<slug>
 */
export const demoGraph: OrbitGraph = {
  entities: [
    // ---- repositories ----
    { id: 'repo:commerce/payment-service', type: 'repository', name: 'commerce/payment-service', metadata: {} },
    { id: 'repo:commerce/checkout-service', type: 'repository', name: 'commerce/checkout-service', metadata: {} },
    { id: 'repo:commerce/auth-service', type: 'repository', name: 'commerce/auth-service', metadata: {} },
    { id: 'repo:commerce/order-service', type: 'repository', name: 'commerce/order-service', metadata: {} },
    { id: 'repo:commerce/platform-web', type: 'repository', name: 'commerce/platform-web', metadata: {} },

    // ---- services ----
    { id: 'svc:payment-service', type: 'service', name: 'payment-service', metadata: { tier: 'tier-0', criticality: 'critical', owner: 'payments-squad', slo: '99.99%' } },
    { id: 'svc:checkout-service', type: 'service', name: 'checkout-service', metadata: { tier: 'tier-0', criticality: 'critical', owner: 'checkout-squad', slo: '99.95%' } },
    { id: 'svc:order-service', type: 'service', name: 'order-service', metadata: { tier: 'tier-1', criticality: 'high', owner: 'orders-squad', slo: '99.9%' } },
    { id: 'svc:auth-service', type: 'service', name: 'auth-service', metadata: { tier: 'tier-0', criticality: 'critical', owner: 'identity-squad', slo: '99.99%' } },
    { id: 'svc:inventory-service', type: 'service', name: 'inventory-service', metadata: { tier: 'tier-1', criticality: 'high', owner: 'supply-squad', slo: '99.9%' } },
    { id: 'svc:notification-service', type: 'service', name: 'notification-service', metadata: { tier: 'tier-2', criticality: 'medium', owner: 'platform-squad', slo: '99.5%' } },
    { id: 'svc:fraud-detection', type: 'service', name: 'fraud-detection', metadata: { tier: 'tier-1', criticality: 'high', owner: 'risk-squad', slo: '99.9%' } },
    { id: 'svc:api-gateway', type: 'service', name: 'api-gateway', metadata: { tier: 'tier-0', criticality: 'critical', owner: 'platform-squad', slo: '99.99%' } },
    { id: 'svc:platform-web', type: 'service', name: 'platform-web', metadata: { tier: 'tier-1', criticality: 'high', owner: 'web-squad', slo: '99.9%' } },

    // ---- components ----
    { id: 'cmp:payment-core', type: 'component', name: 'payment-core', metadata: { criticality: 'critical' } },
    { id: 'cmp:payment-providers', type: 'component', name: 'payment-providers', metadata: { criticality: 'critical' } },
    { id: 'cmp:payment-ledger', type: 'component', name: 'payment-ledger', metadata: { criticality: 'critical' } },
    { id: 'cmp:auth-middleware', type: 'component', name: 'auth-middleware', metadata: { criticality: 'critical' } },
    { id: 'cmp:token-issuer', type: 'component', name: 'token-issuer', metadata: { criticality: 'critical' } },
    { id: 'cmp:checkout-flow', type: 'component', name: 'checkout-flow', metadata: { criticality: 'high' } },
    { id: 'cmp:web-storefront', type: 'component', name: 'web-storefront', metadata: { criticality: 'medium' } },

    // ---- APIs ----
    { id: 'api:payments-v2', type: 'api', name: 'POST /v2/payments', metadata: { consumers: 3 } },
    { id: 'api:refunds-v1', type: 'api', name: 'POST /v1/refunds', metadata: { consumers: 2 } },
    { id: 'api:auth-token', type: 'api', name: 'POST /oauth/token', metadata: { consumers: 7 } },
    { id: 'api:checkout-session', type: 'api', name: 'POST /v1/checkout/sessions', metadata: { consumers: 2 } },

    // ---- pipelines ----
    { id: 'pipe:payment-service-main', type: 'pipeline', name: 'payment-service · main', metadata: { recentFailureRate: 0.18 } },
    { id: 'pipe:checkout-e2e', type: 'pipeline', name: 'checkout · e2e-suite', metadata: { recentFailureRate: 0.31 } },
    { id: 'pipe:auth-service-main', type: 'pipeline', name: 'auth-service · main', metadata: { recentFailureRate: 0.05 } },
    { id: 'pipe:platform-web-main', type: 'pipeline', name: 'platform-web · main', metadata: { recentFailureRate: 0.04 } },

    // ---- people ----
    { id: 'person:mwallace', type: 'person', name: 'Maya Wallace', metadata: { username: 'mwallace', role: 'Staff Engineer · payments-squad' } },
    { id: 'person:dchen', type: 'person', name: 'David Chen', metadata: { username: 'dchen', role: 'Senior Engineer · payments-squad' } },
    { id: 'person:asingh', type: 'person', name: 'Aarav Singh', metadata: { username: 'asingh', role: 'Security Engineer · appsec' } },
    { id: 'person:lkim', type: 'person', name: 'Lena Kim', metadata: { username: 'lkim', role: 'Principal Engineer · identity-squad' } },
    { id: 'person:jrobert', type: 'person', name: 'Jules Robert', metadata: { username: 'jrobert', role: 'Senior Engineer · checkout-squad' } },
    { id: 'person:tnguyen', type: 'person', name: 'Thao Nguyen', metadata: { username: 'tnguyen', role: 'SRE · platform-squad' } },
    { id: 'person:efox', type: 'person', name: 'Erin Fox', metadata: { username: 'efox', role: 'Frontend Engineer · web-squad' } },
    { id: 'person:ppatel', type: 'person', name: 'Priya Patel', metadata: { username: 'ppatel', role: 'Senior Frontend Engineer · web-squad' } },

    // ---- security findings ----
    { id: 'finding:SAST-4411', type: 'security_finding', name: 'SAST-4411 · Possible PAN logging in payment processor', metadata: { severity: 'high', status: 'open' } },
    { id: 'finding:DAST-2210', type: 'security_finding', name: 'DAST-2210 · JWT audience not validated', metadata: { severity: 'critical', status: 'in-review' } },
    { id: 'finding:DEP-0907', type: 'security_finding', name: 'DEP-0907 · stripe-sdk CVE-2025-44190', metadata: { severity: 'medium', status: 'open' } },

    // ---- historical merge requests ----
    { id: 'mr:!1841', type: 'merge_request', name: '!1841 Refactor provider retry logic', metadata: { date: '2026-03-02', outcome: 'caused-incident', lesson: 'Retry storm against Stripe sandbox took payments down for 41 min. Idempotency keys were not propagated through the new retry wrapper.' } },
    { id: 'mr:!1762', type: 'merge_request', name: '!1762 Add 3DS2 challenge flow', metadata: { date: '2026-01-18', outcome: 'rolled-back', lesson: 'Canary caught a 9% auth-decline spike in EU traffic; rollback within 12 min. Card-network test matrix was incomplete.' } },
    { id: 'mr:!1633', type: 'merge_request', name: '!1633 Ledger double-entry migration', metadata: { date: '2025-11-30', outcome: 'deployed-clean', lesson: 'Shadow-write period of 2 weeks before cutover eliminated reconciliation surprises.' } },
    { id: 'mr:!1590', type: 'merge_request', name: '!1590 Rotate JWT signing keys', metadata: { date: '2025-11-04', outcome: 'caused-incident', lesson: 'Old tokens were invalidated before all gateway pods reloaded JWKS — 7 min of platform-wide 401s. Stagger key rotation with dual-key validity window.' } },
    { id: 'mr:!1505', type: 'merge_request', name: '!1505 Checkout session TTL tuning', metadata: { date: '2025-10-12', outcome: 'pipeline-failed', lesson: 'Flaky e2e suite blocked release train for 2 days; quarantine flaky specs before risky merges.' } },
    { id: 'mr:!1488', type: 'merge_request', name: '!1488 Storefront banner CMS integration', metadata: { date: '2025-09-29', outcome: 'deployed-clean', lesson: 'Pure presentation-layer changes behind a CMS flag shipped without incident.' } },

    // ---- incidents ----
    { id: 'incident:INC-2291', type: 'incident', name: 'INC-2291 Payment retry storm (S1)', metadata: { date: '2026-03-02', durationMin: 41 } },
    { id: 'incident:INC-2150', type: 'incident', name: 'INC-2150 Platform-wide 401s after key rotation (S1)', metadata: { date: '2025-11-04', durationMin: 7 } },
  ],

  relations: [
    // files are attached per-scenario at query time; static topology below
    // components -> services
    { from: 'cmp:payment-core', to: 'svc:payment-service', type: 'belongs_to' },
    { from: 'cmp:payment-providers', to: 'svc:payment-service', type: 'belongs_to' },
    { from: 'cmp:payment-ledger', to: 'svc:payment-service', type: 'belongs_to' },
    { from: 'cmp:auth-middleware', to: 'svc:auth-service', type: 'belongs_to' },
    { from: 'cmp:token-issuer', to: 'svc:auth-service', type: 'belongs_to' },
    { from: 'cmp:checkout-flow', to: 'svc:checkout-service', type: 'belongs_to' },
    { from: 'cmp:web-storefront', to: 'svc:platform-web', type: 'belongs_to' },

    // service dependency graph (from depends on to)
    { from: 'svc:checkout-service', to: 'svc:payment-service', type: 'depends_on', weight: 0.95 },
    { from: 'svc:checkout-service', to: 'svc:inventory-service', type: 'depends_on', weight: 0.7 },
    { from: 'svc:order-service', to: 'svc:payment-service', type: 'depends_on', weight: 0.85 },
    { from: 'svc:order-service', to: 'svc:notification-service', type: 'depends_on', weight: 0.4 },
    { from: 'svc:payment-service', to: 'svc:fraud-detection', type: 'depends_on', weight: 0.8 },
    { from: 'svc:payment-service', to: 'svc:auth-service', type: 'depends_on', weight: 0.6 },
    { from: 'svc:checkout-service', to: 'svc:auth-service', type: 'depends_on', weight: 0.9 },
    { from: 'svc:api-gateway', to: 'svc:auth-service', type: 'depends_on', weight: 0.99 },
    { from: 'svc:platform-web', to: 'svc:api-gateway', type: 'depends_on', weight: 0.95 },
    { from: 'svc:api-gateway', to: 'svc:checkout-service', type: 'depends_on', weight: 0.8 },
    { from: 'svc:api-gateway', to: 'svc:order-service', type: 'depends_on', weight: 0.7 },

    // service -> api
    { from: 'svc:payment-service', to: 'api:payments-v2', type: 'exposes' },
    { from: 'svc:payment-service', to: 'api:refunds-v1', type: 'exposes' },
    { from: 'svc:auth-service', to: 'api:auth-token', type: 'exposes' },
    { from: 'svc:checkout-service', to: 'api:checkout-session', type: 'exposes' },
    { from: 'svc:checkout-service', to: 'api:payments-v2', type: 'consumes' },
    { from: 'svc:order-service', to: 'api:refunds-v1', type: 'consumes' },
    { from: 'svc:api-gateway', to: 'api:auth-token', type: 'consumes' },

    // pipelines
    { from: 'svc:payment-service', to: 'pipe:payment-service-main', type: 'built_by' },
    { from: 'svc:checkout-service', to: 'pipe:checkout-e2e', type: 'built_by' },
    { from: 'svc:auth-service', to: 'pipe:auth-service-main', type: 'built_by' },
    { from: 'svc:platform-web', to: 'pipe:platform-web-main', type: 'built_by' },

    // repos
    { from: 'svc:payment-service', to: 'repo:commerce/payment-service', type: 'contained_in' },
    { from: 'svc:checkout-service', to: 'repo:commerce/checkout-service', type: 'contained_in' },
    { from: 'svc:auth-service', to: 'repo:commerce/auth-service', type: 'contained_in' },
    { from: 'svc:order-service', to: 'repo:commerce/order-service', type: 'contained_in' },
    { from: 'svc:platform-web', to: 'repo:commerce/platform-web', type: 'contained_in' },

    // ownership / contribution
    { from: 'person:mwallace', to: 'cmp:payment-core', type: 'owns' },
    { from: 'person:mwallace', to: 'cmp:payment-ledger', type: 'owns' },
    { from: 'person:dchen', to: 'cmp:payment-providers', type: 'owns' },
    { from: 'person:lkim', to: 'cmp:token-issuer', type: 'owns' },
    { from: 'person:lkim', to: 'cmp:auth-middleware', type: 'owns' },
    { from: 'person:jrobert', to: 'cmp:checkout-flow', type: 'owns' },
    { from: 'person:efox', to: 'cmp:web-storefront', type: 'owns' },
    { from: 'person:ppatel', to: 'cmp:web-storefront', type: 'contributed_to', weight: 0.9 },
    { from: 'person:ppatel', to: 'svc:platform-web', type: 'owns' },
    { from: 'person:asingh', to: 'svc:payment-service', type: 'contributed_to', weight: 0.5 },
    { from: 'person:asingh', to: 'svc:auth-service', type: 'contributed_to', weight: 0.6 },
    { from: 'person:tnguyen', to: 'svc:api-gateway', type: 'owns' },
    { from: 'person:dchen', to: 'cmp:payment-core', type: 'contributed_to', weight: 0.8 },
    { from: 'person:jrobert', to: 'cmp:payment-providers', type: 'contributed_to', weight: 0.3 },

    // security findings
    { from: 'finding:SAST-4411', to: 'cmp:payment-core', type: 'affects' },
    { from: 'finding:DEP-0907', to: 'cmp:payment-providers', type: 'affects' },
    { from: 'finding:DAST-2210', to: 'cmp:auth-middleware', type: 'affects' },

    // historical MRs -> components they touched
    { from: 'mr:!1841', to: 'cmp:payment-providers', type: 'modified' },
    { from: 'mr:!1841', to: 'cmp:payment-core', type: 'modified' },
    { from: 'mr:!1762', to: 'cmp:payment-core', type: 'modified' },
    { from: 'mr:!1633', to: 'cmp:payment-ledger', type: 'modified' },
    { from: 'mr:!1590', to: 'cmp:token-issuer', type: 'modified' },
    { from: 'mr:!1590', to: 'cmp:auth-middleware', type: 'modified' },
    { from: 'mr:!1505', to: 'cmp:checkout-flow', type: 'modified' },
    { from: 'mr:!1488', to: 'cmp:web-storefront', type: 'modified' },

    // MRs -> incidents
    { from: 'mr:!1841', to: 'incident:INC-2291', type: 'caused' },
    { from: 'mr:!1590', to: 'incident:INC-2150', type: 'caused' },
    { from: 'incident:INC-2291', to: 'svc:payment-service', type: 'impacted' },
    { from: 'incident:INC-2291', to: 'svc:checkout-service', type: 'impacted' },
    { from: 'incident:INC-2150', to: 'svc:api-gateway', type: 'impacted' },
    { from: 'incident:INC-2150', to: 'svc:auth-service', type: 'impacted' },
  ],
};

// ---------------------------------------------------------------------------
// Demo MR scenarios. Selected by MR iid so judges can type different MR URLs
// and watch the risk profile change. Each scenario declares the changed files
// and which components those files map to in the graph.
// ---------------------------------------------------------------------------

export interface DemoScenario {
  key: string;
  title: string;
  author: string;
  project: string;
  changedFiles: ChangedFile[];
  fileComponentMap: Record<string, string>; // file path -> component entity id
}

export const demoScenarios: DemoScenario[] = [
  {
    key: 'payment-capture-refactor',
    title: 'Refactor capture flow to async provider settlement',
    author: 'dchen',
    project: 'commerce/payment-service',
    changedFiles: [
      { path: 'src/core/capture_processor.py', additions: 312, deletions: 188, securitySensitive: true, criticality: 'critical' },
      { path: 'src/core/idempotency.py', additions: 84, deletions: 31, securitySensitive: true, criticality: 'critical' },
      { path: 'src/providers/stripe_adapter.py', additions: 156, deletions: 97, securitySensitive: true, criticality: 'high' },
      { path: 'src/providers/adyen_adapter.py', additions: 122, deletions: 64, securitySensitive: true, criticality: 'high' },
      { path: 'src/ledger/settlement_writer.py', additions: 67, deletions: 12, securitySensitive: false, criticality: 'critical' },
      { path: 'config/feature_flags.yaml', additions: 6, deletions: 1, securitySensitive: false, criticality: 'medium' },
      { path: 'tests/core/test_capture_processor.py', additions: 201, deletions: 45, securitySensitive: false, criticality: 'low' },
    ],
    fileComponentMap: {
      'src/core/capture_processor.py': 'cmp:payment-core',
      'src/core/idempotency.py': 'cmp:payment-core',
      'src/providers/stripe_adapter.py': 'cmp:payment-providers',
      'src/providers/adyen_adapter.py': 'cmp:payment-providers',
      'src/ledger/settlement_writer.py': 'cmp:payment-ledger',
      'config/feature_flags.yaml': 'cmp:payment-core',
      'tests/core/test_capture_processor.py': 'cmp:payment-core',
    },
  },
  {
    key: 'jwt-validation-hardening',
    title: 'Harden JWT validation: enforce audience + key rotation grace window',
    author: 'lkim',
    project: 'commerce/auth-service',
    changedFiles: [
      { path: 'src/middleware/jwt_validator.go', additions: 145, deletions: 89, securitySensitive: true, criticality: 'critical' },
      { path: 'src/issuer/jwks_rotation.go', additions: 98, deletions: 22, securitySensitive: true, criticality: 'critical' },
      { path: 'src/middleware/claims.go', additions: 41, deletions: 18, securitySensitive: true, criticality: 'high' },
      { path: 'deploy/helm/values.yaml', additions: 9, deletions: 3, securitySensitive: false, criticality: 'medium' },
      { path: 'tests/middleware/jwt_validator_test.go', additions: 167, deletions: 20, securitySensitive: false, criticality: 'low' },
    ],
    fileComponentMap: {
      'src/middleware/jwt_validator.go': 'cmp:auth-middleware',
      'src/issuer/jwks_rotation.go': 'cmp:token-issuer',
      'src/middleware/claims.go': 'cmp:auth-middleware',
      'deploy/helm/values.yaml': 'cmp:token-issuer',
      'tests/middleware/jwt_validator_test.go': 'cmp:auth-middleware',
    },
  },
  {
    key: 'storefront-promo-banner',
    title: 'Add seasonal promo banner to storefront home page',
    author: 'efox',
    project: 'commerce/platform-web',
    changedFiles: [
      { path: 'src/components/PromoBanner.tsx', additions: 88, deletions: 0, securitySensitive: false, criticality: 'low' },
      { path: 'src/pages/Home.tsx', additions: 14, deletions: 2, securitySensitive: false, criticality: 'low' },
      { path: 'src/styles/banner.css', additions: 52, deletions: 0, securitySensitive: false, criticality: 'low' },
      { path: 'tests/components/PromoBanner.spec.tsx', additions: 61, deletions: 0, securitySensitive: false, criticality: 'low' },
    ],
    fileComponentMap: {
      'src/components/PromoBanner.tsx': 'cmp:web-storefront',
      'src/pages/Home.tsx': 'cmp:web-storefront',
      'src/styles/banner.css': 'cmp:web-storefront',
      'tests/components/PromoBanner.spec.tsx': 'cmp:web-storefront',
    },
  },
];
