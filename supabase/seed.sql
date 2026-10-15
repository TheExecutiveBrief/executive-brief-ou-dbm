-- ==============================================================================
-- The Executive Brief by OU DBM
-- Reproducible Seed Script (PostgreSQL / Supabase)
-- Maps the exact mockArticles dataset using deterministic UUIDs & ON CONFLICT updates.
-- ==============================================================================

-- 1. CATEGORIES (Desks 00 to 05)
insert into categories (id, slug, name, desk_number, description, accent_color, display_order)
values
  ('00000000-0000-0000-0001-000000000001', 'special-report', 'Special Report', 'Desk 00', 'In-depth investigative briefings, comprehensive economic surveys, and featured cover dossiers.', 'crimson', 0),
  ('00000000-0000-0000-0001-000000000002', 'business', 'Business & Markets', 'Desk 01', 'Corporate strategy, macroeconomic policy, capital flows, and the regional enterprise ecosystem.', 'brass', 1),
  ('00000000-0000-0000-0001-000000000003', 'campus', 'Campus Leadership', 'Desk 02', 'Milestones, placement analytics, industry guest lectures, and institutional developments at OU DBM.', 'crimson', 2),
  ('00000000-0000-0000-0001-000000000004', 'careers', 'Executive Careers', 'Desk 03', 'Career mobility, executive interviews, placement trends, and talent demand in emerging sectors.', 'forest', 3),
  ('00000000-0000-0000-0001-000000000005', 'research', 'Research & Insights', 'Desk 04', 'Peer-reviewed insights, faculty working papers, and management case analyses from the department.', 'forest', 4),
  ('00000000-0000-0000-0001-000000000006', 'voices', 'Student Voices & Op-Eds', 'Desk 05', 'Firsthand commentary, cohort viewpoints, summer internship chronicles, and leadership reflections.', 'brass', 5)
on conflict (slug) do update set
  name = excluded.name,
  desk_number = excluded.desk_number,
  description = excluded.description,
  accent_color = excluded.accent_color,
  display_order = excluded.display_order;

-- 2. AUTHORS
insert into authors (id, slug, name, role, affiliation, avatar_url, bio)
values
  ('00000000-0000-0000-0002-000000000001', 'k-r-v-narayana', 'K. R. V. Narayana', 'Editor-in-Chief', 'MBA Class of 2025 · Newsletter & Media Club', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80', 'Senior editor overseeing editorial integrity, investigative macroeconomic features, and strategic industry interviews for The Executive Brief.'),
  ('00000000-0000-0000-0002-000000000002', 'dr-radhika-v-sastri', 'Dr. Radhika V. Sastri', 'Faculty Advisor', 'Professor of Corporate Finance, OU DBM', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80', 'Academic researcher and consultant specializing in corporate capital structure, healthcare M&A, and debt markets.'),
  ('00000000-0000-0000-0002-000000000003', 'aditya-s-chary', 'Aditya S. Chary', 'Associate Editor', 'MBA Class of 2026 · Placement Student Representative', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80', 'MBA candidate focusing on strategy and corporate relations, coordinating student executive placement activities.'),
  ('00000000-0000-0000-0002-000000000004', 'siddharth-ramamurthy', 'Siddharth Ramamurthy', 'Senior Contributor', 'MBA Class of 2025 · Energy & Infrastructure Lead', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80', 'Focuses on renewable infrastructure project financing, industrial decarbonisation, and ESG mandate structures.'),
  ('00000000-0000-0000-0002-000000000005', 'ananya-rao', 'Ananya Rao', 'Staff Writer', 'MBA Class of 2026 · Banking & Financial Markets', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80', 'Researches fintech inclusion, alternate lending algorithms, and retail credit expansion across southern India.'),
  ('00000000-0000-0000-0002-000000000006', 'prof-p-venkataswamy', 'Prof. P. Venkataswamy', 'Head of Department', 'Senior Professor of Management, OU DBM', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80', 'Dean and Senior Professor with over three decades of research in institutional leadership and organizational sociology.'),
  ('00000000-0000-0000-0002-000000000007', 'meera-krishnan', 'Meera Krishnan', 'Social Impact Lead', 'MBA Class of 2026 · Consulting & Social Enterprise Club', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80', 'Leads grassroots consulting initiatives connecting MBA scholars with regional weavers and MSME clusters.'),
  ('00000000-0000-0000-0002-000000000008', 'dr-k-srinivas-rao', 'Dr. K. Srinivas Rao', 'Professor of Strategic Management', 'Department of Business Management, Osmania University', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80', 'Advises family conglomerates on succession frameworks, corporate charter structuring, and executive ethics.'),
  ('00000000-0000-0000-0002-000000000009', 'dr-sandhya-v-murthy', 'Dr. Sandhya V. Murthy', 'Associate Professor of Operations', 'Chair, Centre for Supply Chain Excellence, OU DBM', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=256&q=80', 'Published authority on cold chain logistics, pharmaceutical transit validation, and industrial IoT systems.'),
  ('00000000-0000-0000-0002-000000000010', 'pranav-teja', 'Pranav Teja', 'Student Columnist', 'MBA Class of 2026 · Former Systems Engineer at Infosys', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80', 'Writes on transition hurdles from technical engineering roles to managerial decision frameworks in corporate hubs.'),
  ('00000000-0000-0000-0002-000000000011', 'sanya-fatima', 'Sanya Fatima', 'Student Columnist', 'MBA Class of 2025 · Summer Analyst at ICICI Securities', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80', 'Focuses on investment banking desk dynamics, cross-border valuation models, and summer internship chronicles.')
on conflict (slug) do update set
  name = excluded.name,
  role = excluded.role,
  affiliation = excluded.affiliation,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio;

-- 3. PUBLICATION ISSUES
insert into issues (id, slug, volume, issue_number, title, description, date_string, academic_year, published_date, is_current, cover_image_url, editorial_note, status)
values (
  '00000000-0000-0000-0003-000000000001',
  'vol-24-issue-04',
  'Vol. XXIV',
  'No. 04',
  'The New Indian Enterprise: Talent, Capital, and the Hyderabad Nexus',
  'The flagship digital dossier of The Executive Brief examining Hyderabad''s corporate GCC explosion, private equity capital across Genome Valley, empirical faculty governance research, and student dispatches from Dalal Street to regional handloom clusters.',
  'Mid-October 2026',
  'Academic Year 2026–27',
  '2026-10-14',
  true,
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85',
  'Curated by the Newsletter & Media Club under the auspices of the Department of Business Management, Osmania University. This demonstration volume marks the inaugural digital release for the academic year 2026–27.',
  'published'
)
on conflict (slug) do update set
  volume = excluded.volume,
  issue_number = excluded.issue_number,
  title = excluded.title,
  description = excluded.description,
  date_string = excluded.date_string,
  academic_year = excluded.academic_year,
  published_date = excluded.published_date,
  is_current = excluded.is_current,
  cover_image_url = excluded.cover_image_url,
  editorial_note = excluded.editorial_note,
  status = excluded.status;

-- 4. ARTICLES (All 15 Curated Dispatches)
insert into articles (
  id, slug, title, subtitle, excerpt, category_id, author_id, issue_id, status,
  published_at, reading_time, cover_image_url, image_caption, is_lead_story, is_editor_pick,
  is_breaking, edition, tags, key_takeaways, metrics, body_sections
) values
-- 4.1 Lead Story
(
  '00000000-0000-0000-0004-000000000001',
  'twin-cities-corridor-hyderabad-gcc-boom-management-education',
  'The Twin Cities Corridor: How Hyderabad’s GCC Surge is Redefining Management Pedagogy',
  'With over 1,400 Global Capability Centres anchored between HITEC City and the Financial District, corporate leaders are demanding a structural pivot in MBA curricula from traditional administration to algorithmic decision governance.',
  'An extensive investigation into how Telangana''s tech-corporate axis has reshaped recruitment at Osmania University, driving double-digit gains in consulting and analytics roles while pressing business schools to overhaul legacy frameworks.',
  '00000000-0000-0000-0001-000000000001', -- special-report
  '00000000-0000-0000-0002-000000000001', -- auth-01 Narayana
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-14T08:00:00Z',
  '8 min read',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85',
  'Monolithic glass towers along the HITEC City to Financial District corridor, housing premier Global Capability Centres in Hyderabad.',
  true,
  true,
  false,
  'Hyderabad Edition',
  array['GCCs', 'Strategy', 'Pedagogy', 'Consulting', 'Hyderabad Economy'],
  array[
    'Telangana now commands over 1,400 active GCCs employing 450,000+ professionals.',
    'Corporate recruiters increasingly mandate capability in quantitative data storytelling alongside traditional case study mastery.',
    'OU DBM curriculum revisions for 2026–27 introduce specialized experiential labs in financial analytics and decision sciences.'
  ],
  '[{"label":"Active GCCs in Telangana","value":"1,420+","change":"+14% YoY"},{"label":"Technology & Operations Workforce","value":"452,000","change":"+19.2% YoY"},{"label":"OU DBM Consulting Offers","value":"114","change":"+31% YoY"}]'::jsonb,
  '[
    {"id":"the-deccan-pivot","heading":"I. The Deccan Pivot: From Back-Office to Mandate Hub","paragraphs":["Across the arterial expressway connecting Madhapur to the Financial District, the nomenclature on monolithic glass towers has undergone a quiet yet monumental revolution. A decade ago, Hyderabad was celebrated in corporate boardrooms primarily as a cost-efficient delivery engine for offshore software maintenance. Today, the city commands the second-largest concentration of Global Capability Centres (GCCs) in the Asia-Pacific region, housing regional command centers for global investment banks, pharmaceutical giants, and automotive conglomerates.","Crucially, these entities are no longer operating as subservient satellites. They are drafting global risk models, executing enterprise AI transformations, and orchestrating cross-border supply chain architectures. For business schools throughout Telangana, this transition has created an unprecedented urgency to redefine what management education delivers."],"pullQuote":{"quote":"We are no longer training administrators to oversee existing workflows; we are preparing decision architects who can stress-test algorithms and govern complex organizational transformations.","attribution":"Senior Placement Advisory Board, OU DBM"}},
    {"id":"curriculum-recalibration","heading":"II. Recalibrating the Classroom: Beyond Pure Theory","paragraphs":["At the Department of Business Management, Osmania University—an institution rooted in over six decades of academic leadership—faculty boards have initiated a series of structural curriculum revisions. The traditional silo between quantitative finance and corporate strategy has been dismantled in favor of integrated managerial laboratory electives.","Rather than studying retrospective case studies of mid-20th-century industrial enterprises, candidates are now dissecting real-time enterprise telemetry: how currency volatility affects multi-currency liquidity pools, and how automated regulatory compliance regimes alter executive liability."],"bulletPoints":["Inauguration of the Applied Decision Science Lab featuring terminal simulations and real-world corporate dataset exercises.","Direct corporate mentorship pods pairing senior MBA scholars with resident Managing Directors across HITEC City GCCs.","Expansion of semester-long field consulting engagements with Telangana state industry cooperatives and regional MSME manufacturing hubs."]},
    {"id":"the-human-dividend","heading":"III. The Enduring Value of Judgement in an Algorithmic Era","paragraphs":["Yet, amidst the rush toward predictive models and quantitative metrics, corporate recruiters visiting the Osmania campus emphasize a perennial reality: technical aptitude is merely table stakes. The defining asset of executive leadership remains ethical judgment, stakeholder diplomacy, and the capacity to lead through ambiguity.","As the 2026–27 academic year gets underway, the corridors of OU DBM reflect a campus mindful of its heritage but resolutely positioned at the cutting edge of modern enterprise governance."],"callout":{"title":"Executive Synthesis","content":"The modern Indian MBA graduate must bridge two previously separate domains: computational rigor and humanistic organizational leadership. Hyderabad''s corporate ecosystem provides the ideal living laboratory for this synthesis."}}
  ]'::jsonb
),
-- 4.2 Capital Inflow Genome Valley
(
  '00000000-0000-0000-0004-000000000002',
  'capital-inflow-pharma-city-biotech-ma',
  'Pharma City’s Next Horizon: Private Equity Bets on Genome Valley Spin-Offs',
  'Why global healthcare funds are bypassing traditional venture corridors to back mid-market bulk drug innovators in Telangana.',
  'With over $2.4B invested across Genome Valley in the past 18 months, mid-tier Hyderabad pharma operators are turning to institutional private equity to finance US-FDA compliant automation.',
  '00000000-0000-0000-0001-000000000002', -- business
  '00000000-0000-0000-0002-000000000002', -- auth-02 Sastri
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-13T10:30:00Z',
  '5 min read',
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
  'Automated fermentation bioreactors in a Genome Valley research cluster near Shameerpet, Hyderabad.',
  false, true, false, 'Hyderabad Edition',
  array['Pharma', 'Private Equity', 'Genome Valley', 'Healthcare'],
  array[
    'Genome Valley accounts for one-third of global vaccine production capacity.',
    'Institutional PE buyouts have accelerated as second-generation promoter families seek structured capital.',
    'Regulatory compliance automation represents 40% of newly earmarked capital expenditure.'
  ],
  '[]'::jsonb,
  '[]'::jsonb
),
-- 4.3 Autumn Placement Dossier
(
  '00000000-0000-0000-0004-000000000003',
  'campus-placement-dossier-2026-recruitment-report',
  'The Autumn Placement Dossier: Consulting & Tech Firms Accelerate Pre-Placement Offers',
  'A detailed breakdown of the 2026 early recruitment window at Department of Business Management, Osmania University.',
  'Early trends indicate robust demand across BFSI risk advisory and product management, with international conglomerates expanding direct campus interviews on the OU campus.',
  '00000000-0000-0000-0001-000000000003', -- campus
  '00000000-0000-0000-0002-000000000003', -- auth-03 Chary
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-14T06:15:00Z',
  '4 min read',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  'Scholars from the MBA Class of 2026 participating in an interactive consulting case workshop on campus.',
  false, false, true, 'Hyderabad Edition',
  array['Placements', 'OU DBM', 'Careers', 'Consulting'],
  array[
    'Consulting and strategy roles accounted for 31% of early autumn offers.',
    'Average compensation package increased by 18.5% year-over-year.',
    'First-time recruiters from global investment banking hubs constituted 22% of total visiting corporate houses.'
  ],
  '[]'::jsonb,
  '[]'::jsonb
),
-- 4.4 Green Hydrogen
(
  '00000000-0000-0000-0004-000000000004',
  'green-hydrogen-industrial-corridors-telangana',
  'Clean Capital: Decarbonising the South Indian Manufacturing Grid',
  'Heavy industry conglomerates around the Hyderabad-Warangal belt are securing long-term power purchase agreements for green hydrogen.',
  'How forward-thinking manufacturing CFOs are balancing near-term Capex spikes against stringent EU carbon border adjustment mechanisms.',
  '00000000-0000-0000-0001-000000000002', -- business
  '00000000-0000-0000-0002-000000000004', -- auth-04 Siddharth
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-11T12:00:00Z',
  '6 min read',
  'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
  'Solar photovoltaic installation powering industrial operations on the outskirts of Hyderabad.',
  false, false, false, 'Hyderabad Edition',
  array['Energy', 'ESG', 'Manufacturing', 'Finance'],
  array[
    'Heavy industrial clusters are locking in long-term green power purchase pacts.',
    'Anticipated European carbon border tariffs are driving proactive corporate decarbonization.'
  ],
  '[]'::jsonb,
  '[]'::jsonb
),
-- 4.5 FinTech Credit Underwriting
(
  '00000000-0000-0000-0004-000000000005',
  'fintech-credit-underwriting-msme-tier-2-cities',
  'Algorithmic Underwriting: Unlocking Credit for Telangana’s Micro-Enterprises',
  'Alternative data scoring is bypassing legacy collateral models to finance textile and agricultural processing hubs.',
  'Field research reveals a 42% faster loan approval rate across rural cooperatives adopting digital transaction trail scoring.',
  '00000000-0000-0000-0001-000000000002', -- business
  '00000000-0000-0000-0002-000000000005', -- auth-05 Ananya
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-10T14:20:00Z',
  '4 min read',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
  'Digital merchant transaction points empowering regional business owners in tier-2 Telangana towns.',
  false, false, false, 'Hyderabad Edition',
  array['Fintech', 'MSMEs', 'Credit', 'Banking'],
  array[
    'Cash flow scoring reduces formal loan processing times from 14 days to under 4 hours.',
    'Cooperative credit institutions report non-performing asset rates below 1.2% using alternate data models.'
  ],
  '[]'::jsonb,
  '[]'::jsonb
),
-- 4.6 Commercial Real Estate REITs
(
  '00000000-0000-0000-0004-000000000006',
  'commercial-real-estate-reits-hyderabad',
  'Institutional Real Estate: Why Hyderabad Leads Grade-A Office Absorption in India',
  'Foreign institutional REITs report record lease renewals in Madhapur and Gachibowli amid sustained global workforce expansions.',
  'Institutional yields continue to outperform traditional metropolitan peers as infrastructure projects like the Metro Phase 2 decongest transit routes.',
  '00000000-0000-0000-0001-000000000002', -- business
  '00000000-0000-0000-0002-000000000001', -- auth-01 Narayana
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-09T09:15:00Z',
  '5 min read',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  'Grade-A corporate campuses lining the HITEC City IT corridor.',
  false, false, false, 'Hyderabad Edition',
  array['Real Estate', 'REITs', 'Infrastructure', 'Investment'],
  null,
  '[]'::jsonb,
  '[]'::jsonb
),
-- 4.7 Sixty-Four Years of DBM
(
  '00000000-0000-0000-0004-000000000007',
  'sixty-four-years-of-dbm-legacy-to-frontier',
  'From Arts College to Frontier Business Education: The 64-Year DBM Odyssey',
  'A historical retrospection on the Department of Business Management, Osmania University, founded in 1962 under visionary leadership.',
  'As one of South India''s oldest university business schools, OU DBM has seeded CEOs, civil servants, policymakers, and entrepreneurial pioneers across the globe.',
  '00000000-0000-0000-0001-000000000003', -- campus
  '00000000-0000-0000-0002-000000000006', -- auth-06 Venkataswamy
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-08T11:00:00Z',
  '7 min read',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
  'The historic Osmania University campus quadrangle, home to generation of scholars since the university''s establishment.',
  false, true, false, 'Hyderabad Edition',
  array['History', 'OU DBM', 'Heritage', 'Alumni'],
  array[
    'Founded in 1962, OU DBM was one of the earliest management faculties instituted in an Indian public university.',
    'Over 12,000 alumni across 40 countries maintain active leadership networks.'
  ],
  '[]'::jsonb,
  '[]'::jsonb
),
-- 4.8 Handloom Consulting
(
  '00000000-0000-0000-0004-000000000008',
  'student-consulting-wing-advises-local-handloom-clusters',
  'Pro-Bono Impact: Student Consulting Wing Modernises Pochampally Handloom Supply Chains',
  'MBA candidates partner with state weavers'' cooperatives to implement digital inventory reconciliation and direct D2C logistics.',
  'Bridging classroom operations theory with grassroots commerce, the 8-week field intervention helped artisanal weavers recover a 19% margin previously lost to intermediaries.',
  '00000000-0000-0000-0001-000000000003', -- campus
  '00000000-0000-0000-0002-000000000007', -- auth-07 Meera
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-07T15:45:00Z',
  '5 min read',
  'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=800&q=80',
  'Traditional Pochampally ikat looms visited during the 8-week student consulting field research.',
  false, false, false, 'Hyderabad Edition',
  array['Social Impact', 'Consulting', 'Handlooms', 'Supply Chain'],
  null,
  '[]'::jsonb,
  '[]'::jsonb
),
-- 4.9 Alumni Conclave
(
  '00000000-0000-0000-0004-000000000009',
  'global-alumni-mentorship-conclave-hyderabad',
  'Bridging the Decades: 2026 Global Alumni Mentorship Conclave Sets Record Participation',
  'Senior leaders from London, Singapore, New York, and Mumbai assemble at the University Club to mentor the upcoming batch.',
  'Over 40 executive alumni conducted one-on-one leadership diagnostic clinics, resume clinics, and corporate navigation seminars for the Class of 2026.',
  '00000000-0000-0000-0001-000000000003', -- campus
  '00000000-0000-0000-0002-000000000003', -- auth-03 Chary
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-06T18:00:00Z',
  '4 min read',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
  'Alumni and faculty convening at the University Club for the 2026 Mentorship Gala.',
  false, false, false, 'Hyderabad Edition',
  array['Alumni', 'Mentorship', 'Leadership', 'Networking'],
  null,
  '[]'::jsonb,
  '[]'::jsonb
),
-- 4.10 Family Governance Research
(
  '00000000-0000-0000-0004-000000000010',
  'corporate-governance-family-enterprises-telangana',
  'Succession Dilemmas and Board Autonomy in Deccan Family Conglomerates',
  'An empirical examination of 120 family-managed conglomerates navigating succession transitions, board independence, and minority shareholder rights.',
  'Department faculty study proves that structured family council charters combined with independent audit board chairs correlate with a 24% reduction in enterprise valuation volatility during leadership handovers.',
  '00000000-0000-0000-0001-000000000005', -- research
  '00000000-0000-0000-0002-000000000008', -- auth-08 Srinivas Rao
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-05T09:30:00Z',
  '9 min read',
  'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
  'Corporate boardroom setting where governance charters and succession plans are negotiated.',
  false, true, false, 'Hyderabad Edition',
  array['Corporate Governance', 'Family Business', 'Strategy', 'Faculty Research'],
  array[
    '120 regional family conglomerates tracked across five fiscal years.',
    'Only 18% of surveyed firms maintain documented succession charters prior to transition events.',
    'Independent audit chair appointments correlate with a 24% drop in stock price volatility during handovers.'
  ],
  '[]'::jsonb,
  '[]'::jsonb
),
-- 4.11 Retail Derivatives Trading Research
(
  '00000000-0000-0000-0004-000000000011',
  'retail-investor-behavior-derivative-trading-tier-2',
  'Speculation or Financialization? Behavioral Drivers of Retail F&O Participation in Semi-Urban India',
  'Why the surge in zero-commission retail F&O volume in Tier-2/3 Indian cities warrants proactive behavioral nudges rather than blanket prohibitions.',
  'Examining 450,000 anonymised trading logs, OU DBM behavioral finance researchers highlight the psychological triggers driving loss-chasing among post-pandemic retail market entrants.',
  '00000000-0000-0000-0001-000000000005', -- research
  '00000000-0000-0000-0002-000000000002', -- auth-02 Sastri
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-04T11:15:00Z',
  '6 min read',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
  'Multi-monitor trading terminal displaying real-time financial derivative option chain analytics.',
  false, false, false, 'Hyderabad Edition',
  array['Behavioral Finance', 'Derivatives', 'SEBI', 'Faculty Research'],
  array[
    '91% of retail derivative accounts incurred net trading losses across the 3-year sample window.',
    'Loss-chasing propensity increases 3.4x following midday drawdown sessions.',
    'Mandatory cooling-off periods reduced impulse trades by 38% in controlled testing groups.'
  ],
  '[]'::jsonb,
  '[]'::jsonb
),
-- 4.12 Cold-Chain Biopharma Logistics
(
  '00000000-0000-0000-0004-000000000012',
  'cold-chain-logistics-biopharma-transit-integrity',
  'Zero-Degree Deficit: Neural Prediction Models for Temperature-Sensitive Vaccine Corridors',
  'A collaborative whitepaper between OU DBM Operations Lab and Indian Vaccine Manufacturers on preventing transit excursion losses.',
  'Real-time IoT sensor telemetry combined with neural path prediction reduces temperature excursion scrap rates to under 0.08% across complex pan-India transit corridors.',
  '00000000-0000-0000-0001-000000000005', -- research
  '00000000-0000-0000-0002-000000000009', -- auth-09 Murthy
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-03T16:00:00Z',
  '8 min read',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
  'Automated temperature-controlled cold storage warehouse facility at Shamshabad Air Cargo complex.',
  false, false, false, 'Hyderabad Edition',
  array['Supply Chain', 'Operations', 'Pharma Logistics', 'IoT'],
  null,
  '[]'::jsonb,
  '[]'::jsonb
),
-- 4.13 From Engineering to Boardroom
(
  '00000000-0000-0000-0004-000000000013',
  'from-engineering-to-boardroom-the-mba-inflection',
  'Unlearning Determinism: The Identity Shift from Systems Engineer to Business Leader',
  'How moving from deterministic code loops to ambiguous organizational dynamics tests every prior instinct of a technical graduate.',
  'In engineering, 2+2 reliably equals 4. In corporate leadership, people bring emotional liabilities, misaligned incentives, and conflicting agendas into every decision meeting. Here is how the DBM case method cured my hubris.',
  '00000000-0000-0000-0001-000000000006', -- voices
  '00000000-0000-0000-0002-000000000010', -- auth-10 Pranav
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-02T13:40:00Z',
  '4 min read',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  'MBA candidates debating strategic trade-offs inside an OU DBM seminar room.',
  false, false, false, 'Hyderabad Edition',
  array['Opinion', 'Student Voice', 'Career Transition', 'MBA Life'],
  null,
  '[]'::jsonb,
  '[]'::jsonb
),
-- 4.14 Summer Chronicles Mumbai
(
  '00000000-0000-0000-0004-000000000014',
  'summer-chronicles-mumbai-investment-banking',
  '100-Hour Weeks and Pitch Book Precision: Dispatches from a Dalal Street Summer',
  'An unvarnished account of an OU DBM candidate’s eight weeks inside an institutional M&A advisory desk.',
  'You learn quickly that financial modeling is barely half the game. The real discipline lies in managing client optics under exhaustion, verifying footnote assumptions, and defending valuations before senior partners.',
  '00000000-0000-0000-0001-000000000006', -- voices
  '00000000-0000-0000-0002-000000000011', -- auth-11 Sanya
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-10-01T09:00:00Z',
  '5 min read',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  'Financial towers of Mumbai where institutional investment banking teams operate round-the-clock.',
  false, false, false, 'Hyderabad Edition',
  array['Internship', 'Investment Banking', 'Mumbai', 'Finance'],
  null,
  '[]'::jsonb,
  '[]'::jsonb
),
-- 4.15 Sustainable Capitalism
(
  '00000000-0000-0000-0004-000000000015',
  'sustainable-capitalism-a-millennial-dilemma',
  'Are We Trained to Maximize Shareholder Value or Human Potential?',
  'A critique of classical agency theory through the eyes of an emerging cohort conscious of climate risks.',
  'As future managers inheriting a planet stressed by ecological overshoot, we can no longer afford to treat social negative externalities as harmless footnotes in discounted cash flow spreadsheets.',
  '00000000-0000-0000-0001-000000000006', -- voices
  '00000000-0000-0000-0002-000000000004', -- auth-04 Siddharth
  '00000000-0000-0000-0003-000000000001',
  'published',
  '2026-09-28T14:30:00Z',
  '5 min read',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  'Modern corporate atrium designed with sustainable biophilic architectural principles.',
  false, false, false, 'Hyderabad Edition',
  array['Philosophy', 'ESG', 'Ethics', 'Student Voice'],
  null,
  '[]'::jsonb,
  '[]'::jsonb
)
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  excerpt = excluded.excerpt,
  category_id = excluded.category_id,
  author_id = excluded.author_id,
  issue_id = excluded.issue_id,
  status = excluded.status,
  published_at = excluded.published_at,
  reading_time = excluded.reading_time,
  cover_image_url = excluded.cover_image_url,
  image_caption = excluded.image_caption,
  is_lead_story = excluded.is_lead_story,
  is_editor_pick = excluded.is_editor_pick,
  is_breaking = excluded.is_breaking,
  edition = excluded.edition,
  tags = excluded.tags,
  key_takeaways = excluded.key_takeaways,
  metrics = excluded.metrics,
  body_sections = excluded.body_sections;

-- 5. UPDATE ISSUE COVER STORY LINK
update issues
set cover_story_id = '00000000-0000-0000-0004-000000000001'
where slug = 'vol-24-issue-04';

-- 6. LIVE MARKET INDICATORS
insert into market_indicators (symbol, name, value, change, is_positive, display_order)
values
  ('SENSEX', 'BSE Sensex', '82,490.12', '+0.42%', true, 1),
  ('NIFTY50', 'NSE Nifty 50', '25,188.75', '+0.38%', true, 2),
  ('HYD-GCC', 'Telangana GCC Index', '1,420+', '+14.2% YoY', true, 3),
  ('INR/USD', 'USD to INR', '₹83.92', '-0.05%', false, 4),
  ('DBM-PLACE', 'Campus Median CTC', '₹14.8 LPA', '+18.5% YoY', true, 5)
on conflict (symbol) do update set
  name = excluded.name,
  value = excluded.value,
  change = excluded.change,
  is_positive = excluded.is_positive,
  display_order = excluded.display_order;

-- 7. EXECUTIVE WIRE BRIEFINGS
insert into wire_briefings (label, headline, article_slug, time_label, is_active, display_order)
values
  ('REGULATORY DISPATCH', 'RBI signals measured stance on shadow banking liquidity norms; impact on Telangana NBFC credit spreads expected minimal.', 'fintech-credit-underwriting-msme-tier-2-cities', '2h ago', true, 1),
  ('CAMPUS ARCHIVE', 'OU DBM marks 64 years of management excellence: Alumni Foundation announces ₹5 Crore endowment for faculty research fellowships.', 'sixty-four-years-of-dbm-legacy-to-frontier', '4h ago', true, 2),
  ('GLOBAL EXPANSION', 'Hyderabad aerospace corridor bags Tier-1 avionics contract for European civil aviation consortium.', 'green-hydrogen-industrial-corridors-telangana', '6h ago', true, 3),
  ('CASE COMPETITION', 'Team ''Chanakya'' from OU DBM qualifies for the National Finals of the National Business Strategy Olympiad.', 'from-engineering-to-boardroom-the-mba-inflection', '8h ago', true, 4)
on conflict do nothing;

-- 8. INITIAL SITE SETTINGS
insert into site_settings (key, value, description, is_public)
values
  ('site_metadata', '{"title": "The Executive Brief", "subtitle": "Department of Business Management, Osmania University", "activeEdition": "Hyderabad Edition"}'::jsonb, 'General publication branding', true),
  ('dossier_active', '{"volume": "Vol. XXIV", "issue": "No. 04", "theme": "The New Indian Enterprise: Talent, Capital, and the Hyderabad Nexus"}'::jsonb, 'Current active dossier banner configuration', true),
  ('editorial_governance', '{"foundedYear": 1962, "department": "Department of Business Management", "university": "Osmania University", "contactEmail": "executivebrief@oudbm.ac.in"}'::jsonb, 'Masthead institutional information', true)
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  is_public = excluded.is_public;
