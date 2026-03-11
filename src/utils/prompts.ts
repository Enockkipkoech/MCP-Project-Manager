// MCP PROMPTS

export const PROJECT_ANALYSIS_PROMPT = `
You are an expert project analyst and technical evaluator. Analyze the provided project description or job details and extract the following features:

## 1. TECHNICAL REQUIREMENTS ANALYSIS
- **Tech Stack Detection**: Identify all mentioned technologies, frameworks, languages, tools, and platforms
- **Skill Level Assessment**: Evaluate required experience level (Junior/Mid/Senior/Expert)
- **Domain Classification**: Categorize the domain (Web Dev, Mobile, AI/ML, DevOps, Data Engineering, etc.)
- **Architecture Patterns**: Identify any mentioned patterns (microservices, monolith, serverless, event-driven, etc.)

## 2. SCOPE & COMPLEXITY ANALYSIS
- **Project Size**: Estimate size (Small/Medium/Large/Enterprise)
- **Complexity Score**: Rate overall complexity (1–10) with justification
- **Timeline Indicators**: Extract any deadlines, milestones, or time-sensitivity signals
- **Deliverable Clarity**: Assess how well-defined the deliverables are (Vague/Partial/Clear/Detailed)

## 3. BUSINESS CONTEXT EXTRACTION
- **Industry Vertical**: Identify the business domain (FinTech, HealthTech, E-commerce, SaaS, etc.)
- **Business Goal**: Summarize the core business objective in 1–2 sentences
- **Target Users**: Identify the end users or stakeholders
- **Compliance/Regulatory Signals**: Flag any mentions of GDPR, HIPAA, SOC2, PCI-DSS, etc.

## 4. COLLABORATION & TEAM DYNAMICS
- **Team Structure**: Detect team size indicators and collaboration expectations
- **Communication Style**: Identify preferred tools (Slack, Jira, async, etc.)
- **Work Mode**: Detect remote/hybrid/on-site preferences
- **Client Involvement**: Assess expected client interaction level (Hands-off/Moderate/High-touch)

## 5. RISK & RED FLAG DETECTION
- **Scope Creep Signals**: Vague requirements, "and anything else needed", unlimited revisions
- **Unrealistic Expectations**: Detect mismatches between budget/timeline and scope
- **Missing Information**: List critical details that are absent
- **Ambiguity Flags**: Highlight unclear or contradictory requirements

## 6. COMPENSATION & VALUE SIGNALS
- **Budget Indicators**: Extract any explicit or implicit budget signals
- **Rate Appropriateness**: Assess if compensation aligns with required skills and scope
- **Value Proposition**: What does this project offer beyond compensation (learning, portfolio, network)
- **Negotiation Leverage Points**: Identify areas where scope or rate could be discussed

## 7. CANDIDATE FIT SCORING
- **Must-Have Skills Match**: List non-negotiable requirements
- **Nice-to-Have Skills**: List preferred but optional skills
- **Culture Fit Signals**: Detect working style, values, and culture cues
- **Growth Opportunity**: Rate career growth potential (Low/Medium/High)

## 8. TIMELINE & EFFORT ESTIMATION
- **Estimated Hours**: Provide a rough hour estimate with breakdown by phase
- **Phase Breakdown**: Discovery → Design → Development → Testing → Deployment
- **Buffer Recommendation**: Suggest a contingency percentage based on complexity and clarity

## 9. KEY QUESTIONS TO ASK
- Generate 5–10 clarifying questions the analyst/candidate should ask before committing
- Prioritize questions that address the highest-risk ambiguities

## 10. EXECUTIVE SUMMARY
- **One-Line Pitch**: Summarize the project in a single sentence
- **Go/No-Go Signal**: Recommend whether to pursue (Green/Yellow/Red) with reasoning
- **Top 3 Opportunities**: Best aspects of this project
- **Top 3 Concerns**: Biggest risks or challenges

---

Return your analysis in structured JSON format with all sections above as keys.
`;

export const QUICK_SCAN_PROMPT = `
Perform a rapid 30-second scan of this project/job description and return:
1. Domain & tech stack (bullet list)
2. Complexity: Low / Medium / High
3. Red flags (if any)
4. Go/No-Go: Green 🟢 / Yellow 🟡 / Red 🔴
Keep it under 150 words.
`;

export const SKILL_EXTRACTOR_PROMPT = `
Extract ALL skills mentioned or implied in this project description.
Categorize them as:
- REQUIRED (explicitly stated as mandatory)
- PREFERRED (nice-to-have or bonus)
- IMPLIED (not stated but clearly needed given the context)

For each skill, also note the proficiency level if mentioned (e.g., "3+ years", "expert-level").
Return as structured JSON.
`;

export const EFFORT_ESTIMATOR_PROMPT = `
Based on this project description, estimate the development effort.
Provide:
- Total estimated hours (range)
- Breakdown by phase: Discovery, Design, Development, Testing, Deployment, PM/Comms
- Assumptions made
- Confidence level: Low / Medium / High
- Key variables that could increase or decrease the estimate

Format as a clear table + brief narrative explanation.
`;

export const RED_FLAG_DETECTOR_PROMPT = `
Analyze this project description specifically for red flags and risk signals.
Check for:
- Scope ambiguity or "everything included" language
- Unrealistic budget vs. scope mismatch
- Tight deadlines with large scope
- Missing technical specifications
- Signs of a difficult client relationship
- IP or ownership concerns
- Payment terms or financial risk signals
- Regulatory/compliance traps

Rate overall risk: Low / Medium / High / Critical
Provide specific quotes from the text that triggered each flag.
`;