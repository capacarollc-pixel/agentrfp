/**
 * Standard RFP/RFI/Security Questionnaire section taxonomy.
 * Used for categorizing questions and answers in the knowledge base and library.
 */
export const SECTION_TAXONOMY = [
  { id: "business_info", label: "Business Information", keywords: ["company", "organization", "business", "corporate", "overview", "background", "history", "revenue", "employees", "headquarters"] },
  { id: "portal_intake", label: "Portal Intake Questions", keywords: ["portal", "intake", "onboarding", "registration", "account setup"] },
  { id: "compliance", label: "Compliance Management", keywords: ["compliance", "regulatory", "audit", "certification", "sox", "pci", "hipaa", "gdpr", "ccpa", "fedramp", "iso 27001", "soc 2", "soc2"] },
  { id: "subcontractor_risk", label: "Subcontractor / Nth Party Risk", keywords: ["subcontractor", "third party", "third-party", "nth party", "vendor risk", "supply chain", "outsource", "sub-processor"] },
  { id: "app_security", label: "Application Security", keywords: ["application security", "appsec", "owasp", "code review", "penetration test", "pentest", "vulnerability", "sast", "dast", "sdlc", "secure development", "vast"] },
  { id: "privacy", label: "Privacy Management", keywords: ["privacy", "personal data", "pii", "data subject", "consent", "data protection", "dpia", "privacy impact", "data processing", "gdpr", "ccpa"] },
  { id: "erm", label: "Enterprise Risk Management", keywords: ["enterprise risk", "risk management", "risk assessment", "risk register", "risk appetite", "risk framework", "erm"] },
  { id: "information_assurance", label: "Information Assurance", keywords: ["information assurance", "data classification", "data handling", "information security", "infosec", "security policy", "isms"] },
  { id: "asset_mgmt", label: "Asset & Information Management", keywords: ["asset management", "asset inventory", "cmdb", "data lifecycle", "data retention", "records management", "information management"] },
  { id: "hr_security", label: "Human Resources Security", keywords: ["human resources", "hr security", "background check", "security awareness", "training", "employee", "termination", "onboarding", "offboarding"] },
  { id: "physical_security", label: "Physical & Environmental Security", keywords: ["physical security", "environmental", "data center", "facility", "badge", "cctv", "fire", "flood", "power", "hvac", "physical access"] },
  { id: "access_control", label: "Access Control", keywords: ["access control", "authentication", "authorization", "mfa", "multi-factor", "sso", "single sign-on", "rbac", "privileged access", "iam", "identity", "password", "least privilege"] },
  { id: "app_mgmt", label: "Application Management", keywords: ["application management", "change management", "deployment", "release", "patch", "configuration management", "ci/cd"] },
  { id: "incident_mgmt", label: "Cybersecurity Incident Management", keywords: ["incident", "breach", "security event", "siem", "soc", "forensic", "response plan", "tabletop", "notification"] },
  { id: "operational_resilience", label: "Operational Resilience", keywords: ["business continuity", "disaster recovery", "bcp", "drp", "resilience", "failover", "rto", "rpo", "backup", "redundancy"] },
  { id: "endpoint_security", label: "Endpoint Security", keywords: ["endpoint", "edr", "antivirus", "anti-malware", "device", "laptop", "mobile device", "mdm", "byod", "workstation"] },
  { id: "network_security", label: "Network Security", keywords: ["network security", "firewall", "ids", "ips", "segmentation", "vpn", "dns", "ddos", "waf", "proxy", "network monitoring", "zero trust"] },
  { id: "esg", label: "Environmental, Social & Governance (ESG)", keywords: ["esg", "environmental", "social", "governance", "sustainability", "carbon", "diversity", "dei", "ethics", "corporate responsibility"] },
  { id: "threat_mgmt", label: "Threat Management", keywords: ["threat", "threat intelligence", "threat modeling", "vulnerability management", "scanning", "cve", "threat hunting"] },
  { id: "server_security", label: "Server Security", keywords: ["server security", "hardening", "patching", "server configuration", "container", "kubernetes", "docker", "cloud security", "infrastructure"] },
  { id: "encryption", label: "Encryption & Key Management", keywords: ["encryption", "cryptography", "tls", "ssl", "key management", "kms", "hashing", "certificate", "pki", "at rest", "in transit"] },
  { id: "data_security", label: "Data Security", keywords: ["data security", "dlp", "data loss prevention", "data masking", "tokenization", "database security"] },
  { id: "cloud_security", label: "Cloud Security", keywords: ["cloud security", "aws", "azure", "gcp", "iaas", "paas", "saas", "cloud configuration", "cspm"] },
  { id: "general", label: "General", keywords: [] },
] as const;

export type SectionId = (typeof SECTION_TAXONOMY)[number]["id"];

/**
 * Auto-categorize a question into a section based on keyword matching.
 */
export function categorizeQuestion(questionText: string): {
  sectionId: string;
  sectionLabel: string;
  confidence: number;
} {
  const text = questionText.toLowerCase();
  let bestMatch = { sectionId: "general", sectionLabel: "General", score: 0 };

  for (const section of SECTION_TAXONOMY) {
    if (section.keywords.length === 0) continue;

    let score = 0;
    for (const keyword of section.keywords) {
      if (text.includes(keyword)) {
        // Longer keyword matches are more specific, worth more
        score += keyword.split(" ").length;
      }
    }

    if (score > bestMatch.score) {
      bestMatch = {
        sectionId: section.id,
        sectionLabel: section.label,
        score,
      };
    }
  }

  return {
    sectionId: bestMatch.sectionId,
    sectionLabel: bestMatch.sectionLabel,
    confidence: bestMatch.score > 0 ? Math.min(bestMatch.score / 3, 1) : 0,
  };
}

/**
 * Get all section labels for display.
 */
export function getSectionOptions(): Array<{ id: string; label: string }> {
  return SECTION_TAXONOMY.map((s) => ({ id: s.id, label: s.label }));
}
