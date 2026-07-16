# Changelog

All notable changes to **BiovaCo Nexus Admin** will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Planned
- Mobile-responsive admin sidebar
- Bulk export of intern data to CSV

---

## [1.4.0] — 2026-07-16

### Added
- **Security Hardening** — Explicit `search_path` on all DB functions, strict RLS policies replacing `USING (true)` across all critical tables (`ceo_md_timetable`, `admin_activity_logs`, `inquiries`, etc.)
- **CEO/MD Timetable** — Full schedule management with recurring event support
- **Push Notifications** — Web Push API integration via Supabase Edge Function (`push-notify`) with VAPID authentication
- **Shared Files Portal** — RBAC-secured file sharing system for team collaboration
- **Market Research Hub** — Business development and market research tracking module

### Fixed
- RLS lint errors across knowledge tracker and R&D lab tables
- Knowledge tracker multi-assign visibility for all assigned interns

---

## [1.3.0] — 2026-07-09

### Added
- **R&D Lab System** — Full module including Recipe Formulation, Batch Trials, QC Checklists, Shelf Life Testing, Raw Material Library, Product Testing, Manufacturing SOPs
- **Knowledge Tracker** — R&D knowledge base with RBAC, multi-user task assignment, and Brevo email notifications
- **Offline Sync Manager** — IndexedDB-backed offline queue with background sync

### Fixed
- Intern Management: status update parsing bug in form submission
- Job Positions: position update not saving correctly

---

## [1.2.0] — 2026-07-03

### Added
- **Business ERP Suite** — Finance Management, Invoice Generator, Document Generator, Purchase Management, Receivables & Payables
- **GST-compliant invoice generation** with PDF export and official branding
- **Admin Activity Logs** — Full audit trail of admin actions

### Changed
- Consolidated disparate modules into unified Business Management tab

---

## [1.1.0] — 2026-06-19

### Added
- **Expense Management** — Track and categorize business expenses
- Row Level Security hardening across all tables
- Application remarks system with contact modal

---

## [1.0.0] — 2025-08-01

### Added
- Initial production release
- Application Management (track, review, update candidates)
- Newsletter Administration (subscribers, confirmation flow)
- Content Management (locations, 3D models, videos, post-countdown reveals)
- Role-based Authentication via Supabase Auth
- PWA support with offline capability
- Careers public page
