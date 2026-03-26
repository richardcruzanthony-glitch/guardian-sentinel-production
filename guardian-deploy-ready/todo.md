# Guardian Sentinel Project TODO

## Core Features
- [x] Manufacturing domain with showcase parts (triple-clamp bracket, machinist's jack)
- [x] Compliance package with RFQ, Routing, FAI, Inspection, Shipping, Compliance, Outside Processes, BOM
- [x] Programming section with HAAS G-code display
- [x] Procurement section with material sourcing
- [x] Stage drawings with Part C clamping position
- [x] Floating chat widget for visitor engagement
- [x] Owner notifications on chat messages

## AI Sales Agent (NEW)
- [x] Create AI sales agent chatbot component for licensing
- [x] Add licensing tiers to database (Starter, Professional, Enterprise)
- [x] Create tRPC procedures for lead capture and license provisioning
- [x] Integrate sales agent with LLM for intelligent responses
- [x] Route all license lead notifications to richardcruzanthony@gmail.com
- [ ] Add license activation and key generation system
- [ ] Test sales agent end-to-end

## Future Enhancements
- [ ] Manufacturing Agent section in compliance package
- [ ] PDF export for compliance package
- [ ] Add 2 more showcase parts (bearing bracket, pillow block housing)
- [ ] ITAR security messaging below gallery
- [ ] Video walkthrough of 5-axis workflow
- [ ] Tool change notes in stage drawings
- [ ] Operation summary card in routing sheet

## Licensing Strategy Restructure
- [x] Update licensing tiers to Right to Execute, Deterministic Shield, Digital Twin
- [x] Update sales agent messaging to pitch speed, safety, and simulation benefits
- [x] Create licensing comparison page with value propositions
- [x] Add tier-specific features and unlock capabilities
- [x] Test licensing flow end-to-end

## Routing & Pricing Fixes (URGENT)
- [x] Complete shop floor routing with all operations (added OP-50 support trim, OP-60 manual deburr)
- [x] Add assembly operation to routing sheet (OP-60 assembly for machinist's jack)
- [x] Add outside processing cost to final pricing calculation (anodize cost $75 now included)
- [x] Verify pricing includes all cost components
- [x] Test routing sheet end-to-end

## CRITICAL DISPLAY ISSUES
- [ ] Fix Shop-Floor Routing Sheet - show actual operation table instead of placeholder
- [ ] Sync outside processing costs - RFQ shows $75 but Outside Processes shows $355 total
- [ ] Fix CNC Programming display - show actual G-code programs expandable by operation
- [ ] Add Stage Drawings to routing sheet - each operation needs specific stage drawing


## AI Sales Agent Dashboard (NEW)
- [x] Design database schema for agent configuration and activity tracking
- [x] Create agent configuration panel (email setup, messaging templates, capabilities)
- [x] Build agent activity monitoring and lead tracking interface
- [ ] Implement demo scheduling system (UI for booking demos)
- [ ] Add pricing tier management and display
- [ ] Create contract and NDA generation system (PDF generation)
- [ ] Integrate payment processing for license purchases (Stripe)
- [x] Build feedback monitoring and engagement analytics
- [x] Set up email integration for guardianoperatingsystem@gmail.com (database ready)
- [ ] Test AI Sales Agent Dashboard end-to-end


## Lead Generation & Sales Enablement System (NEW)
- [x] Design database schema for leads, sales materials, and email campaigns
- [ ] Create lead management module with daily sourcing (25 leads/day)
- [ ] Add position targeting (Owner, Operations Managers, Continuous Improvement, CCO, VP)
- [ ] Build sales materials library (presentations, videos, emails)
- [x] Implement email template builder with customization
- [x] Create email campaign scheduler and sender
- [x] Add advanced search criteria (company size, industry, location, engagement score, last contacted)
- [x] Implement quantity controls for campaign targeting
- [x] Create lead selection preview before sending
- [ ] Build engagement tracking (opens, clicks, replies, video views)
- [ ] Add notification system for email interactions
- [ ] Create lead status pipeline management
- [ ] Build analytics dashboard with ROI tracking by position/industry
- [ ] Integrate with guardianoperatingsystem@gmail.com for sending/receiving
- [ ] Test lead generation system end-to-end


## Email Campaign Builder Fixes (URGENT)
- [x] Add campaign launch/send button and functionality
- [x] Create campaign details modal for viewing and editing drafts
- [x] Add campaign status tracking (draft, scheduled, sent, completed)
- [x] Implement send confirmation with lead count preview
- [x] Fix campaign draft opening/editing workflow


## Email Campaign Builder Enhancements (NEW)
- [x] Add email body editor to campaign templates (WYSIWYG or markdown)
- [x] Allow editing saved draft campaigns (name, subject, body, targeting)
- [x] Implement auto-scheduling for recurring campaigns (daily, weekly, monthly)
- [x] Build file upload for videos, PDFs, and attachments
- [ ] Add media preview in email templates
- [ ] Create campaign scheduling calendar UI
- [ ] Test campaign mode (send to test email only)
- [ ] Verify auto-scheduled campaigns execute on time


## Guardian Sentinel Business Operating System Rebrand (PRIORITY)
- [ ] Update homepage messaging - position as "Business Operating System" not ERP/MRP
- [ ] Create "The Problem" section - explain execution gap and why ERP/MRP alone fail
- [ ] Create "The Solution" section - Guardian as the intelligent layer on top
- [ ] Update value proposition - from "compliance tool" to "autonomous business management"
- [ ] Create tiered pricing page ($2,500 Starter / $5,000 Professional / $10,000 Enterprise)
- [ ] Build ROI calculator showing customer value generation
- [ ] Create case studies showing cross-functional impact (Engineering, Procurement, Planning, Quality)
- [ ] Update all marketing copy to reflect Business Operating System positioning
- [ ] Create comparison chart: ERP/MRP alone vs. ERP/MRP + Guardian

## Tiered Pricing Implementation
- [ ] Add pricing tiers to database (Starter, Professional, Enterprise)
- [ ] Create pricing selection page in onboarding flow
- [ ] Implement feature gates based on pricing tier
- [ ] Add subscription management UI for customers
- [ ] Create invoice and billing history page
- [ ] Integrate Stripe for payment processing
- [ ] Test pricing tier features end-to-end

## Email Campaign Builder Completion
- [ ] Fix campaign launch execution (actually send emails)
- [ ] Add email sending integration (SendGrid or Gmail API)
- [ ] Implement email open/click tracking
- [ ] Create email delivery status page
- [ ] Add reply capture and lead scoring
- [ ] Verify file uploads work for videos and PDFs
- [ ] Test campaign scheduling and auto-send

## Lead Generation Dashboard Completion
- [ ] Seed 100+ test leads with varied attributes
- [ ] Implement lead filtering by position, industry, location
- [ ] Add lead status pipeline (New, Contacted, Qualified, Converted, Lost)
- [ ] Create bulk actions (assign, tag, update status)
- [ ] Build lead detail view with interaction history
- [ ] Add lead scoring based on engagement
- [ ] Test filtering and status management workflows

## Engagement Analytics & ROI Dashboard
- [ ] Create campaign performance dashboard (open rate, click rate, reply rate)
- [ ] Build ROI calculator showing customer savings vs. subscription cost
- [ ] Add analytics by position, industry, company size
- [ ] Create conversion funnel visualization
- [ ] Build email performance trends (over time)
- [ ] Add lead source attribution
- [ ] Test analytics accuracy with sample data

## ROI Calculator Lead Capture (NEW)
- [x] Add email capture form to ROI calculator component
- [x] Create tRPC procedure to save ROI calculator leads to database
- [x] Integrate captured leads into AI Sales Agent Dashboard
- [x] Test lead capture workflow end-to-end

## Final Integration & Testing
- [ ] Verify all systems working together (campaigns → leads → analytics)
- [ ] Test complete workflow: create campaign → send → track → analyze
- [ ] Verify email sending and tracking working
- [ ] Test pricing tiers and feature gates
- [ ] Load test with 100+ leads and campaigns
- [ ] Security audit of email and payment systems
- [ ] Final user acceptance testing
